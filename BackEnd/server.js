// Arquivo: server.js
// Versão: Correção Final Mercado Pago (Bypass Localhost Restrictions)
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = 3001;

// --- CONFIGURAÇÃO MERCADO PAGO ---
// 1. Cole sua Credencial de TESTE aqui (começa com TEST-...)
const client = new MercadoPagoConfig({ accessToken: 'TEST-293404710508092-010509-23454016cc1cf244b865b0b20018c3d6-821679961' });

app.use(cors()); 
app.use(bodyParser.json());

// --- CONEXÃO COM BANCO DE DADOS ---
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin10140131', // <--- Verifique sua senha
  database: process.env.DB_NAME || 'tupperware_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err) => {
    if (err) console.error('❌ Erro DB:', err.message);
    else console.log('✅ Conectado ao MySQL!');
});

app.get('/', (req, res) => res.send('API Online'));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/register', (req, res) => {
    const { nome, email, telefone, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).send({ message: "Preencha tudo." });
    db.query("SELECT * FROM clientes WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro banco." });
        if (results.length > 0) return res.status(409).send({ message: "Email em uso." });
        db.query("INSERT INTO clientes (nome, email, telefone, senha) VALUES (?, ?, ?, ?)", [nome, email, telefone, senha], (err, result) => {
            if (err) return res.status(500).send({ message: "Erro cadastro." });
            res.status(201).send({ message: "Sucesso!", id: result.insertId });
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    db.query("SELECT * FROM clientes WHERE email = ? AND senha = ?", [email, senha], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro banco." });
        if (results.length > 0) res.json(results[0]);
        else res.status(401).send({ message: "Login inválido." });
    });
});

app.get('/api/clientes/:id/historico', (req, res) => {
    const sql = `SELECT rn.numero, rn.status, rn.data_reserva, r.nome_premio, r.valor_numero, r.imagem_url FROM rifa_numeros rn JOIN rifas r ON rn.rifa_id = r.id WHERE rn.cliente_id = ? ORDER BY rn.data_reserva DESC`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro histórico." });
        res.json(results);
    });
});

// --- ROTAS CONSULTORA / MENTORIA ---
app.post('/api/consultoras', (req, res) => {
  let { nome, email, telefone, cidade } = req.body;
  const tel = telefone.replace(/\D/g, '');
  if (!nome || tel.length !== 11) return res.status(400).send({ message: "Dados inválidos." });
  const telFmt = `(${tel.slice(0,2)})${tel.slice(2,7)}-${tel.slice(7)}`;
  db.query("SELECT * FROM consultoras WHERE email = ? OR telefone = ?", [email, telFmt], (err, results) => {
    if (results && results.length > 0) return res.status(409).send({ message: "Duplicado." });
    db.query("INSERT INTO consultoras (nome, email, telefone, cidade) VALUES (?, ?, ?, ?)", [nome, email, telFmt, cidade], (err, result) => {
        if(err) return res.status(500).send({message: "Erro."});
        res.status(201).send({ message: "Sucesso!", id: result.insertId });
    });
  });
});
app.get('/api/consultoras', (req, res) => { db.query("SELECT * FROM consultoras ORDER BY id DESC", (e,r)=>res.json(r||[])); });

app.post('/api/mentoria', (req, res) => {
  const { nome, telefone, nivel, dificuldade } = req.body;
  db.query("INSERT INTO mentoria_leads (nome, telefone, nivel, dificuldade) VALUES (?, ?, ?, ?)", [nome, telefone, nivel, dificuldade], (e)=> {
      if(e) return res.status(500).send({message: "Erro"}); res.status(201).send({ message: "Sucesso!" });
  });
});
app.get('/api/mentoria', (req, res) => { db.query("SELECT * FROM mentoria_leads ORDER BY id DESC", (e,r)=>res.json(r||[])); });

// --- RIFAS & PAGAMENTO (CORREÇÃO DE AUTO_RETURN) ---
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

    if (!numeros || !numeros.length) return res.status(400).send({ message: "Sem números." });

    const placeholders = numeros.map(() => '?').join(',');
    db.query(`SELECT * FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders}) AND status = 'Pago'`, [rifaId, ...numeros], async (err, results) => {
        if (results && results.length > 0) return res.status(409).send({ message: "Números já vendidos." });

        try {
            const total = Number(valorUnitario) * numeros.length;
            if (isNaN(total) || total <= 0) throw new Error("Valor inválido");

            const preference = new Preference(client);
            
            // CORREÇÃO: Removido 'auto_return' para evitar erro com localhost
            // Adicionado email fictício ao payer para passar na validação
            const preferenceData = {
                body: {
                    items: [{ 
                        title: `${tituloRifa}`, 
                        quantity: 1, 
                        unit_price: total, 
                        currency_id: 'BRL' 
                    }],
                    payer: { 
                        name: nome || 'Cliente',
                        email: 'cliente_teste@user.com' // Obrigatório em Sandbox
                    },
                    back_urls: { 
                        success: 'http://localhost:5173', 
                        failure: 'http://localhost:5173', 
                        pending: 'http://localhost:5173' 
                    },
                    // auto_return: 'approved', // <--- COMENTADO PARA FUNCIONAR EM LOCALHOST
                    external_reference: JSON.stringify({ rifaId, numeros, clienteId }),
                }
            };

            console.log("Enviando para MP:", JSON.stringify(preferenceData, null, 2));

            const prefResponse = await preference.create(preferenceData);

            const values = numeros.map(num => [rifaId, num, clienteId || null, nome, telefone, 'Reservado', prefResponse.id]);
            db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [values], (dbErr) => {
                if (dbErr) { console.error(dbErr); return res.status(500).send({ message: "Erro ao salvar reserva no banco." }); }
                res.json({ link_pagamento: prefResponse.init_point });
            });

        } catch (mpError) { 
            console.error("Erro MP Detalhado:", mpError); 
            const msg = mpError.message || "Erro na integração com Mercado Pago.";
            res.status(500).send({ message: msg }); 
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