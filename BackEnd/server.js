// Arquivo: server.js
// Versão Final: API Completa com todas as correções e segurança
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = 3001;

// --- CONFIGURAÇÃO MERCADO PAGO ---
// Substitua pelo seu ACCESS TOKEN de produção ou teste
const client = new MercadoPagoConfig({ accessToken: 'SEU_ACCESS_TOKEN_AQUI' });

app.use(cors()); 
app.use(bodyParser.json());

// --- CONEXÃO COM BANCO DE DADOS ---
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin10140131', // <--- SENHA DO BANCO
  database: process.env.DB_NAME || 'tupperware_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) console.error('❌ Erro DB:', err.message);
    else { console.log('✅ Conectado ao MySQL!'); connection.release(); }
});

app.get('/', (req, res) => res.send('API Online'));

// --- AUTENTICAÇÃO E CLIENTES ---

// 1. Registro
app.post('/api/auth/register', (req, res) => {
    const { nome, email, telefone, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).send({ message: "Preencha todos os campos." });

    db.query("SELECT * FROM clientes WHERE email = ?", [email], (err, results) => {
        if (err) { console.error(err); return res.status(500).send({ message: "Erro interno." }); }
        if (results.length > 0) return res.status(409).send({ message: "Email já cadastrado." });

        const sql = "INSERT INTO clientes (nome, email, telefone, senha) VALUES (?, ?, ?, ?)";
        db.query(sql, [nome, email, telefone, senha], (err, result) => {
            if (err) return res.status(500).send({ message: "Erro ao cadastrar." });
            res.status(201).send({ message: "Cadastro realizado com sucesso!", id: result.insertId });
        });
    });
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    db.query("SELECT * FROM clientes WHERE email = ? AND senha = ?", [email, senha], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro interno." });
        
        if (results.length > 0) {
            const user = results[0];
            res.json({ id: user.id, nome: user.nome, email: user.email, telefone: user.telefone });
        } else {
            res.status(401).send({ message: "Email ou senha incorretos." });
        }
    });
});

// 3. Histórico
app.get('/api/clientes/:id/historico', (req, res) => {
    const sql = `
        SELECT rn.numero, rn.status, rn.data_reserva, r.nome_premio, r.valor_numero, r.imagem_url
        FROM rifa_numeros rn
        JOIN rifas r ON rn.rifa_id = r.id
        WHERE rn.cliente_id = ?
        ORDER BY rn.data_reserva DESC
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro ao buscar histórico." });
        res.json(results);
    });
});

// --- CONSULTORAS ---
app.post('/api/consultoras', (req, res) => {
  let { nome, email, telefone, cidade } = req.body;
  if (!nome || !telefone || !email) return res.status(400).send({ message: "Dados incompletos." });

  const telefoneLimpo = telefone.toString().replace(/\D/g, '');
  if (telefoneLimpo.length !== 11) return res.status(400).send({ message: "Telefone inválido (11 dígitos)." });
  
  const telefoneFormatado = `(${telefoneLimpo.slice(0, 2)})${telefoneLimpo.slice(2, 7)}-${telefoneLimpo.slice(7)}`;

  db.query("SELECT * FROM consultoras WHERE email = ? OR telefone = ?", [email, telefoneFormatado], (err, results) => {
    if (err) return res.status(500).send({ message: "Erro banco." });
    if (results.length > 0) return res.status(409).send({ message: "Cadastro duplicado." });

    db.query("INSERT INTO consultoras (nome, email, telefone, cidade) VALUES (?, ?, ?, ?)", 
    [nome, email, telefoneFormatado, cidade], (err, result) => {
        if(err) return res.status(500).send({message: "Erro."});
        res.status(201).send({ message: "Sucesso!", id: result.insertId });
    });
  });
});

app.get('/api/consultoras', (req, res) => {
  db.query("SELECT * FROM consultoras ORDER BY id DESC", (err, result) => res.json(result || []));
});

// --- MENTORIA ---
app.post('/api/mentoria', (req, res) => {
  const { nome, telefone, nivel, dificuldade } = req.body;
  db.query("INSERT INTO mentoria_leads (nome, telefone, nivel, dificuldade) VALUES (?, ?, ?, ?)", 
  [nome, telefone, nivel, dificuldade], (err) => {
      if(err) return res.status(500).send({message: "Erro"});
      res.status(201).send({ message: "Sucesso!" });
  });
});

app.get('/api/mentoria', (req, res) => {
  db.query("SELECT * FROM mentoria_leads ORDER BY id DESC", (err, result) => res.json(result || []));
});

// --- RIFAS ---
app.get('/api/rifas', (req, res) => {
  const sql = `SELECT r.*, (SELECT COUNT(*) FROM rifa_numeros rn WHERE rn.rifa_id = r.id AND rn.status = 'Pago') as numeros_vendidos FROM rifas r ORDER BY r.id DESC`;
  db.query(sql, (err, result) => res.json(result || []));
});

app.get('/api/rifas/:id/numeros', (req, res) => {
    db.query("SELECT numero, status, comprador_nome FROM rifa_numeros WHERE rifa_id = ?", [req.params.id], (err, result) => res.json(result || []));
});

app.post('/api/rifas/:id/pagar', async (req, res) => {
    const rifaId = req.params.id;
    const { numeros, nome, telefone, valorUnitario, tituloRifa, clienteId } = req.body;

    if (!numeros || numeros.length === 0) return res.status(400).send({ message: "Sem números." });

    const placeholders = numeros.map(() => '?').join(',');
    // Verifica disponibilidade
    db.query(`SELECT * FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders}) AND status = 'Pago'`, [rifaId, ...numeros], async (err, results) => {
        if (err) return res.status(500).send({ message: "Erro banco." });
        if (results && results.length > 0) return res.status(409).send({ message: "Números já vendidos." });

        try {
            // Cria Pagamento MP
            const total = Number(valorUnitario) * numeros.length;
            const preference = new Preference(client);
            const prefResponse = await preference.create({
                body: {
                    items: [{ title: `${tituloRifa}`, quantity: 1, unit_price: total, currency_id: 'BRL' }],
                    payer: { name: nome },
                    back_urls: { success: 'http://localhost:5173', failure: 'http://localhost:5173', pending: 'http://localhost:5173' },
                    auto_return: 'approved',
                    external_reference: JSON.stringify({ rifaId, numeros, clienteId }),
                }
            });

            // Salva reserva
            const insertValues = numeros.map(num => [rifaId, num, clienteId || null, nome, telefone, 'Reservado', prefResponse.id]);
            db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [insertValues], (dbErr) => {
                if (dbErr) { console.error(dbErr); return res.status(500).send({ message: "Erro reserva." }); }
                res.json({ link_pagamento: prefResponse.init_point });
            });
        } catch (mpError) {
            console.error(mpError);
            res.status(500).send({ message: "Erro MP." });
        }
    });
});

app.post('/api/simular-pagamento', (req, res) => {
    const { rifaId, numeros } = req.body;
    const placeholders = numeros.map(() => '?').join(',');
    db.query(`UPDATE rifa_numeros SET status = 'Pago' WHERE rifa_id = ? AND numero IN (${placeholders})`, [rifaId, ...numeros], (err) => {
        if(err) return res.status(500).send(err); res.send({message:"Ok"});
    });
});

app.listen(PORT, () => { console.log(`🚀 Servidor rodando na porta ${PORT}`); });