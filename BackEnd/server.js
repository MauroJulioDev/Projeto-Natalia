// Arquivo: server.js
// Versão: Completa (Mercado Pago + Admin Dashboard + CRUD Rifas)
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = 3001;

// --- CONFIGURAÇÃO MERCADO PAGO ---
const client = new MercadoPagoConfig({ accessToken: 'TEST-293404710508092-010509-23454016cc1cf244b865b0b20018c3d6-821679961' });

app.use(cors()); 
// Aumentando o limite para 50 megabytes para aceitar imagens em Base64
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- CONEXÃO COM BANCO DE DADOS ---
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '10140131', 
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

// ==========================================
// ROTAS DE AUTENTICAÇÃO E CLIENTES
// ==========================================
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

// ==========================================
// ROTAS DO PAINEL ADMIN (CONSULTORAS E MENTORIA)
// ==========================================
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

app.get('/api/consultoras', (req, res) => { 
    db.query("SELECT * FROM consultoras ORDER BY id DESC", (e,r)=>res.json(r||[])); 
});

app.post('/api/mentoria', (req, res) => {
  const { nome, telefone, nivel, dificuldade } = req.body;
  db.query("INSERT INTO mentoria_leads (nome, telefone, nivel, dificuldade) VALUES (?, ?, ?, ?)", [nome, telefone, nivel, dificuldade], (e)=> {
      if(e) return res.status(500).send({message: "Erro"}); res.status(201).send({ message: "Sucesso!" });
  });
});

app.get('/api/mentoria', (req, res) => { 
    db.query("SELECT * FROM mentoria_leads ORDER BY id DESC", (e,r)=>res.json(r||[])); 
});

// ==========================================
// ROTAS DE GERENCIAMENTO DE RIFAS (CRUD)
// ==========================================

// LER todas as Rifas (Vitrine e Painel)
 app.get('/api/rifas', (req, res) => {
    // Usamos o * para garantir que numeros_vendidos e vencedor_numero sejam enviados
    const sql = "SELECT * FROM rifas"; 
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// LER os números ocupados de uma Rifa
app.get('/api/rifas/:id/numeros', (req, res) => {
    db.query("SELECT numero, status, comprador_nome FROM rifa_numeros WHERE rifa_id = ?", [req.params.id], (err, result) => res.json(result || []));
});

// CRIAR uma nova Rifa
app.post('/api/rifas', (req, res) => {
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;
    
    // Removido o "numeros_vendidos" do SQL
    const query = 'INSERT INTO rifas (nome_premio, total_numeros, valor_numero, imagem_url) VALUES (?, ?, ?, ?)';
    
    db.query(query, [nome_premio, total_numeros, valor_numero, imagem_url], (err, result) => {
        if (err) {
            console.error("Erro ao criar rifa:", err);
            return res.status(500).json({ error: 'Erro no banco de dados' });
        }
        res.status(201).json({ message: 'Rifa cadastrada!', id: result.insertId });
    });
});

// ATUALIZAR uma Rifa (NOVO)
app.put('/api/rifas/:id', (req, res) => {
    const { id } = req.params;
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;

    const query = 'UPDATE rifas SET nome_premio = ?, total_numeros = ?, valor_numero = ?, imagem_url = ? WHERE id = ?';
    
    db.query(query, [nome_premio, total_numeros, valor_numero, imagem_url, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar rifa:", err);
            return res.status(500).json({ error: 'Erro ao atualizar no banco.' });
        }
        res.status(200).json({ message: 'Rifa atualizada com sucesso!' });
    });
});

// DELETAR uma Rifa (NOVO)
app.delete('/api/rifas/:id', (req, res) => {
    const { id } = req.params;

    // Primeiro, deleta os números reservados dessa rifa
    db.query('DELETE FROM rifa_numeros WHERE rifa_id = ?', [id], (err1) => {
        if (err1) {
            console.error("Erro ao limpar números da rifa:", err1);
            return res.status(500).json({ error: 'Erro ao limpar dados relacionados.' });
        }
        // Depois, deleta a rifa em si
        db.query('DELETE FROM rifas WHERE id = ?', [id], (err2) => {
            if (err2) {
                console.error("Erro ao deletar rifa:", err2);
                return res.status(500).json({ error: 'Erro ao deletar a rifa.' });
            }
            res.status(200).json({ message: 'Rifa deletada com sucesso!' });
        });
    });
});

// ==========================================
// ROTAS DE PAGAMENTO E CHECKOUT
// ==========================================
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
                        email: 'cliente_teste@user.com' 
                    },
                    back_urls: { 
                        success: 'http://localhost:5173', 
                        failure: 'http://localhost:5173', 
                        pending: 'http://localhost:5173' 
                    },
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

app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    // Buscamos o usuário no banco
    db.query("SELECT id, nome, email, telefone FROM clientes WHERE email = ? AND senha = ?", [email, senha], (err, results) => {
        if (err) return res.status(500).send({ message: "Erro banco." });
        if (results.length > 0) {
            // Enviamos os dados REAIS do banco para o Frontend
            res.json(results[0]); 
        } else {
            res.status(401).send({ message: "Login inválido." });
        }
    });
});

// Função auxiliar para limpar reservas expiradas (Coloque no topo do arquivo)
const limparReservasExpiradas = () => {
    // Deleta reservas que não foram pagas e que foram criadas há mais de 5 minutos
    const sql = `DELETE FROM rifa_numeros 
                 WHERE status = 'Reservado' 
                 AND data_reserva < NOW() - INTERVAL 5 MINUTE`;
    db.query(sql, (err) => {
        if (err) console.error("Erro ao limpar expirados:", err);
    });
};

// 1. ATUALIZAR: Rota que busca os números ocupados
app.get('/api/rifas/:id/numeros', (req, res) => {
    // Antes de enviar os números para o site, limpamos o que já expirou
    limparReservasExpiradas();

    db.query(
        "SELECT numero, status, comprador_nome FROM rifa_numeros WHERE rifa_id = ?", 
        [req.params.id], 
        (err, result) => res.json(result || [])
    );
});

// 2. ATUALIZAR: Rota de Pagamento (Segurança contra duplicidade)
app.post('/api/rifas/:id/pagar', async (req, res) => {
    const rifaId = req.params.id;
    const { numeros, nome, telefone, valorUnitario, tituloRifa, clienteId } = req.body;

    // SEMPRE limpamos expirados antes de checar se um número está disponível
    limparReservasExpiradas();

    // Verificamos se algum dos números escolhidos já está ocupado (Pago ou Reservado ainda válido)
    const placeholders = numeros.map(() => '?').join(',');
    const checkSql = `SELECT numero FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders})`;
    
    db.query(checkSql, [rifaId, ...numeros], async (err, results) => {
        if (results && results.length > 0) {
            const ocupados = results.map(r => r.numero).join(', ');
            return res.status(409).send({ message: `Os números [${ocupados}] acabaram de ser reservados por outra pessoa. Escolha outros!` });
        }

        // Se chegou aqui, os números estão livres. Prossegue com o Mercado Pago...
        try {
            // ... (restante do seu código do Mercado Pago igual ao anterior)
            // ... ao final, o INSERT no rifa_numeros registrará a data_reserva (NOW())
        } catch (error) { /* ... */ }
    });
});

// ROTA PARA SORTEAR UM VENCEDOR
app.post('/api/rifas/:id/sortear', (req, res) => {
    const rifaId = req.params.id;

    // 1. Buscamos todos os números PAGOS desta rifa
    const sqlNumeros = "SELECT numero, comprador_nome FROM rifa_numeros WHERE rifa_id = ? AND status = 'Pago'";
    
    db.query(sqlNumeros, [rifaId], (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar números pagos." });
        if (results.length === 0) return res.status(400).json({ message: "Não há números pagos para sortear." });

        // 2. Sorteio aleatório no servidor (Segurança máxima)
        const indiceSorteado = Math.floor(Math.random() * results.length);
        const vencedor = results[indiceSorteado];

        // 3. Salva o resultado na tabela de rifas
        const sqlUpdate = "UPDATE rifas SET vencedor_numero = ?, data_sorteio = NOW() WHERE id = ?";
        db.query(sqlUpdate, [vencedor.numero, rifaId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Erro ao salvar vencedor." });
            
            res.json({
                message: "Sorteio realizado com sucesso!",
                numero: vencedor.numero,
                ganhador: vencedor.comprador_nome
            });
        });
    });
});

// server.js
app.post('/api/rifas/:id/sortear', (req, res) => {
    const rifaId = req.params.id;

    // 1. Busca os números PAGOS
    const sql = "SELECT numero, comprador_nome FROM rifa_numeros WHERE rifa_id = ? AND status = 'Pago'";
    
    db.query(sql, [rifaId], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar números." });
        if (results.length === 0) return res.status(400).json({ message: "Nenhum número pago encontrado." });

        // 2. Sorteia um índice aleatório
        const vencedor = results[Math.floor(Math.random() * results.length)];

        // 3. Salva no banco de dados
        const updateSql = "UPDATE rifas SET vencedor_numero = ?, data_sorteio = NOW() WHERE id = ?";
        db.query(updateSql, [vencedor.numero, rifaId], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Erro ao salvar vencedor." });
            
            // 4. Retorna para o Frontend
            res.json({
                numero: vencedor.numero,
                ganhador: vencedor.comprador_nome
            });
        });
    });
});

app.listen(PORT, () => { console.log(`🚀 Servidor rodando na porta ${PORT}`); });