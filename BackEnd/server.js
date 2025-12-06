// Arquivo: server.js
// Versão: Com Integração Mercado Pago
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
// Importando Mercado Pago (Seu programador deve rodar: npm install mercadopago)
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = 3001;

// --- CONFIGURAÇÃO MERCADO PAGO ---
// Substitua pelo seu ACCESS TOKEN de produção ou teste do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'SEU_ACCESS_TOKEN_AQUI' });

app.use(cors()); 
app.use(bodyParser.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin10140131', 
  database: process.env.DB_NAME || 'tupperware_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ... (Conexão DB mantida igual) ...
db.getConnection((err, connection) => {
    if (err) console.error('❌ Erro DB:', err.message);
    else { console.log('✅ Conectado ao MySQL!'); connection.release(); }
});

// --- ROTAS PADRÃO (Consultoras/Mentoria mantidas, omitidas p/ brevidade se não mudaram) ---
app.get('/', (req, res) => res.send('API Online'));

// 1. CONSULTORAS (Cadastro + Validação)
app.post('/api/consultoras', (req, res) => {
  console.log('📩 Recebendo cadastro de consultora...');
  let { nome, email, telefone, cidade } = req.body;

  if (!nome || !telefone || !email) {
    return res.status(400).send({ message: "Nome, Email e Telefone são obrigatórios." });
  }

  const telefoneLimpo = telefone.toString().replace(/\D/g, '');

  if (telefoneLimpo.length !== 11) {
    return res.status(400).send({ message: "Telefone inválido. Digite o DDD + 9 números." });
  }

  const telefoneFormatado = `(${telefoneLimpo.slice(0, 2)})${telefoneLimpo.slice(2, 7)}-${telefoneLimpo.slice(7)}`;

  const checkSql = "SELECT * FROM consultoras WHERE email = ? OR telefone = ? OR nome = ?";
  
  db.query(checkSql, [email, telefoneFormatado, nome], (err, results) => {
    if (err) return res.status(500).send({ message: "Erro interno." });

    if (results.length > 0) {
      console.log('🚫 Falha: Cadastro Duplicado.');
      return res.status(409).send({ message: "Cadastro duplicado! Já existe um registro com este Nome, Email ou Telefone." });
    }

    const insertSql = "INSERT INTO consultoras (nome, email, telefone, cidade) VALUES (?, ?, ?, ?)";
    db.query(insertSql, [nome, email, telefoneFormatado, cidade], (err, result) => {
      if (err) return res.status(500).send({ message: "Erro ao salvar." });
      console.log(`✨ Sucesso! Consultora ${nome} cadastrada.`);
      res.status(201).send({ message: "Sucesso!", id: result.insertId });
    });
  });
});

app.get('/api/consultoras', (req, res) => {
  db.query("SELECT * FROM consultoras ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).send({ message: "Erro ao buscar." });
    res.json(result);
  });
});


// 2. MENTORIA
app.post('/api/mentoria', (req, res) => {
  const { nome, telefone, nivel, dificuldade } = req.body;
  const sql = "INSERT INTO mentoria_leads (nome, telefone, nivel, dificuldade) VALUES (?, ?, ?, ?)";
  db.query(sql, [nome, telefone, nivel, dificuldade], (err, result) => {
    if (err) return res.status(500).send({ message: "Erro ao registrar." });
    res.status(201).send({ message: "Sucesso!" });
  });
});

app.get('/api/mentoria', (req, res) => {
  db.query("SELECT * FROM mentoria_leads ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).send({ message: "Erro ao buscar." });
    res.json(result);
  });
});

// --- ROTAS RIFA E PAGAMENTO ---

app.get('/api/rifas', (req, res) => {
  const sql = `SELECT r.*, (SELECT COUNT(*) FROM rifa_numeros rn WHERE rn.rifa_id = r.id AND rn.status = 'Pago') as numeros_vendidos FROM rifas r ORDER BY r.id DESC`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send({ message: "Erro DB" });
    res.json(result);
  });
});

app.get('/api/rifas/:id/numeros', (req, res) => {
    db.query("SELECT numero, status, comprador_nome FROM rifa_numeros WHERE rifa_id = ?", [req.params.id], (err, result) => {
        res.json(result || []);
    });
});

// 1. CRIAR PREFERÊNCIA DE PAGAMENTO (RESERVAR)
app.post('/api/rifas/:id/pagar', async (req, res) => {
    const rifaId = req.params.id;
    const { numero, nome, telefone, valor, tituloRifa } = req.body;

    // A. Verifica se já está PAGO (Reservado pode ser sobrescrito se expirou, mas aqui simplificamos)
    db.query("SELECT * FROM rifa_numeros WHERE rifa_id = ? AND numero = ? AND status = 'Pago'", [rifaId, numero], async (err, results) => {
        if (results.length > 0) return res.status(409).send({ message: "Número já vendido!" });

        try {
            // B. Cria Preferência no Mercado Pago
            const preference = new Preference(client);
            const prefResponse = await preference.create({
                body: {
                    items: [{
                        title: `Rifa: ${tituloRifa} - Nº ${numero}`,
                        quantity: 1,
                        unit_price: Number(valor),
                        currency_id: 'BRL',
                    }],
                    payer: {
                        name: nome,
                        // email: email // Ideal pedir email também
                    },
                    back_urls: {
                        success: 'http://localhost:5173/?status=success',
                        failure: 'http://localhost:5173/?status=failure',
                        pending: 'http://localhost:5173/?status=pending',
                    },
                    auto_return: 'approved',
                    // Identificador interno para sabermos qual número atualizar depois
                    external_reference: JSON.stringify({ rifaId, numero, nome, telefone }),
                    notification_url: 'https://seusite.com.br/api/webhook', // URL REAL necessária para produção
                }
            });

            // C. Salva como Reservado no Banco com o link do pagamento
            const sql = "INSERT INTO rifa_numeros (rifa_id, numero, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES (?, ?, ?, ?, 'Reservado', ?)";
            
            // Se já existir (tentativa anterior falha), faz update, senão insert (Lógica simplificada: Insert direto)
            // Para produção, ideal usar INSERT ... ON DUPLICATE KEY UPDATE
            db.query(sql, [rifaId, numero, nome, telefone, prefResponse.id], (dbErr) => {
                // Retorna o link de pagamento para o Frontend abrir
                res.json({ link_pagamento: prefResponse.init_point });
            });

        } catch (mpError) {
            console.error(mpError);
            res.status(500).send({ message: "Erro ao gerar pagamento MP" });
        }
    });
});

// 2. WEBHOOK (Onde a mágica acontece)
// O Mercado Pago chama isso quando o pagamento é aprovado
app.post('/api/webhook', async (req, res) => {
    const { type, data } = req.body;
    
    if (type === 'payment') {
        // Aqui você consultaria a API do MP para ver se status === 'approved'
        // E leria o external_reference para saber qual número liberar
        console.log("Pagamento recebido:", data.id);
        
        // Simulação: Atualizar banco para 'Pago'
        // UPDATE rifa_numeros SET status = 'Pago' WHERE id_pagamento_externo = ...
    }
    res.status(200).send("OK");
});

// 3. ROTA DE SIMULAÇÃO (Para você testar em Localhost)
// Como o Webhook não funciona em localhost sem túnel, use isso para "fingir" que pagou
app.post('/api/simular-pagamento', (req, res) => {
    const { rifaId, numero } = req.body;
    const sql = "UPDATE rifa_numeros SET status = 'Pago' WHERE rifa_id = ? AND numero = ?";
    db.query(sql, [rifaId, numero], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Pagamento Simulado: Número marcado como Pago!" });
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});