require('dotenv').config();
const { enviarMensagemZap } = require('./whatsapp');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURAÇÃO MERCADO PAGO ---
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

app.use(cors()); 
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 1. MIDDLEWARES DE SEGURANÇA
// ==========================================
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "Token não fornecido." });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Sessão expirada. Logue novamente." });
        req.userId = decoded.id;
        next();
    });
};

// ==========================================
// 2. CONEXÃO COM BANCO DE DADOS
// ==========================================
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
// 3. ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/api/auth/admin-login', (req, res) => {
    const { email, senha } = req.body;
    if (email === 'admin' && senha === 'admin123') {
        const token = jwt.sign({ id: 0, role: 'admin' }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: "Credenciais de administrador inválidas." });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { nome, email, telefone, senha, foto_perfil } = req.body;
    if (!nome || !telefone || !senha) return res.status(400).send({ message: "Preencha nome, telefone e senha." });
    
    try {
        db.query("SELECT * FROM clientes WHERE telefone = ?", [telefone], async (err, results) => {
            if (err) return res.status(500).send({ message: "Erro no banco." });
            if (results.length > 0) return res.status(409).send({ message: "Este WhatsApp já está cadastrado!" });
            
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            const sql = "INSERT INTO clientes (nome, email, telefone, senha, foto_perfil) VALUES (?, ?, ?, ?, ?)";
            db.query(sql, [nome, email || '', telefone, senhaHash, foto_perfil || ''], (err, result) => {
                if (err) return res.status(500).json({ message: "Erro ao cadastrar." });
                res.status(201).json({ id: result.insertId, message: "Usuário criado!" });
            });
        });
    } catch (e) {
        res.status(500).json({ message: "Erro interno." });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { telefone, senha } = req.body;
    db.query("SELECT * FROM clientes WHERE telefone = ?", [telefone], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: "WhatsApp não cadastrado." });

        const user = results[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ message: "Senha incorreta." });

        const token = jwt.sign({ id: user.id, telefone: user.telefone }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, foto_perfil: user.foto_perfil, telefone: user.telefone } });
    });
});

app.get('/api/clientes/:id/historico', (req, res) => {
    const clienteId = req.params.id;
    const sql = `
        SELECT rn.numero, rn.status, r.nome_premio, r.imagem_url, r.vencedor_numero 
        FROM rifa_numeros rn 
        JOIN rifas r ON rn.rifa_id = r.id 
        WHERE rn.cliente_id = ? 
        ORDER BY rn.id DESC
    `;
    db.query(sql, [clienteId], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar histórico." });
        res.json(results);
    });
});

// ==========================================
// 4. ROTAS DO PAINEL ADMIN
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
// 5. ROTAS DE GERENCIAMENTO DE RIFAS
// ==========================================
app.get('/api/rifas', (req, res) => {
    db.query("SELECT * FROM rifas", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

const limparReservasExpiradas = () => {
    const sql = `DELETE FROM rifa_numeros WHERE status = 'Reservado' AND data_reserva < NOW() - INTERVAL 15 MINUTE`;
    db.query(sql, (err) => {
        if (err) console.error("Erro ao limpar expirados:", err);
    });
};

app.get('/api/rifas/:id/numeros', (req, res) => {
    limparReservasExpiradas();
    db.query("SELECT numero, status, comprador_nome FROM rifa_numeros WHERE rifa_id = ?", [req.params.id], (err, result) => res.json(result || []));
});

// ROTA NOVO: Buscar o Ranking (Top 3) de uma rifa
app.get('/api/rifas/:id/ranking', (req, res) => {
    const rifaId = req.params.id;
    const sql = `
        SELECT comprador_nome, comprador_telefone, COUNT(numero) as total_numeros        FROM rifa_numeros
        WHERE rifa_id = ? AND status = 'Pago'
        GROUP BY comprador_telefone, comprador_nome
        ORDER BY total_numeros DESC
        LIMIT 3
    `;
    db.query(sql, [rifaId], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar ranking." });
        res.json(results);
    });
});

app.post('/api/rifas', verifyToken, (req, res) => {
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;
    db.query('INSERT INTO rifas (nome_premio, total_numeros, valor_numero, imagem_url) VALUES (?, ?, ?, ?)', [nome_premio, total_numeros, valor_numero, imagem_url], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro no banco' });
        res.status(201).json({ message: 'Rifa cadastrada!', id: result.insertId });
    });
});

app.put('/api/rifas/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;
    db.query('UPDATE rifas SET nome_premio = ?, total_numeros = ?, valor_numero = ?, imagem_url = ? WHERE id = ?', [nome_premio, total_numeros, valor_numero, imagem_url, id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar' });
        res.status(200).json({ message: 'Rifa atualizada!' });
    });
});

app.delete('/api/rifas/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM rifa_numeros WHERE rifa_id = ?', [id], (err1) => {
        if (err1) return res.status(500).json({ error: 'Erro ao limpar dados' });
        db.query('DELETE FROM rifas WHERE id = ?', [id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Erro ao deletar' });
            res.status(200).json({ message: 'Rifa deletada!' });
        });
    });
});

app.post('/api/rifas/:id/sortear', verifyToken, (req, res) => {
    const rifaId = req.params.id;
    db.query("SELECT numero, comprador_nome FROM rifa_numeros WHERE rifa_id = ? AND status = 'Pago'", [rifaId], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: "Nenhum número pago encontrado." });
        const vencedor = results[Math.floor(Math.random() * results.length)];
        db.query("UPDATE rifas SET vencedor_numero = ?, data_sorteio = NOW() WHERE id = ?", [vencedor.numero, rifaId], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Erro ao salvar vencedor." });
            res.json({ numero: vencedor.numero, ganhador: vencedor.comprador_nome });
        });
    });
});

// ==========================================
// ROTA NOVO: Ranking Global do Mês Atual
// ==========================================
app.get('/api/ranking-global', (req, res) => {
    // Busca os clientes que mais compraram números pagos no mês atual
    const sql = `
        SELECT comprador_nome, COUNT(numero) as total_numeros
        FROM rifa_numeros
        WHERE status = 'Pago' 
          AND MONTH(data_reserva) = MONTH(CURRENT_DATE()) 
          AND YEAR(data_reserva) = YEAR(CURRENT_DATE())
        GROUP BY comprador_telefone, comprador_nome
        ORDER BY total_numeros DESC
        LIMIT 3
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar ranking global." });
        res.json(results);
    });
});

// ==========================================
// 6. ROTAS DE PAGAMENTO E CHECKOUT (MISSÕES 10 E 11)
// ==========================================
app.post('/api/rifas/:id/pagar', async (req, res) => {
    const rifaId = req.params.id;
    const { numeros, nome, telefone, valorUnitario, tituloRifa, clienteId } = req.body;

    if (!numeros || !numeros.length) return res.status(400).send({ message: "Sem números." });
    limparReservasExpiradas();

    const placeholders = numeros.map(() => '?').join(',');
    db.query(`SELECT * FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders})`, [rifaId, ...numeros], async (err, results) => {
        if (results && results.length > 0) return res.status(409).send({ message: "Números indisponíveis." });

        try {
            const total = Number(valorUnitario) * numeros.length;
            const preference = new Preference(client);
            
            const preferenceData = {
                body: {
                    items: [{ title: `${tituloRifa}`, quantity: 1, unit_price: total, currency_id: 'BRL' }],
                    payer: { name: nome || 'Cliente', email: 'cliente_teste@user.com' },
                    back_urls: { success: 'http://localhost:5173', failure: 'http://localhost:5173', pending: 'http://localhost:5173' },
                    external_reference: `RIFA:${rifaId}|NUMEROS:${numeros.join(',')}`,
                    notification_url: "https://SEU-DOMINIO-AQUI.com.br/api/webhook/mercadopago"
                }
            };

            const prefResponse = await preference.create(preferenceData);
            const values = numeros.map(num => [rifaId, num, clienteId || null, nome, telefone, 'Reservado', prefResponse.id]);
            
            db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [values], (dbErr) => {
                if (dbErr) return res.status(500).send({ message: "Erro no banco." });
                
                // 1. Libera o site para o cliente pagar
                res.json({ link_pagamento: prefResponse.init_point });

                // 2. Envia o Zap Imediato de Cobrança
                const msgCobranca = `*Mentora Tupperware* 🎁\n\nOlá, ${nome}! Sua reserva na rifa *${tituloRifa}* foi recebida!\n\n🎟️ *Números:* ${numeros.join(', ')}\n💰 *Total:* R$ ${total.toFixed(2)}\n\n⚠️ Você tem 15 minutos para pagar. Link:\n${prefResponse.init_point}\n\nBoa sorte! 🍀`;
                enviarMensagemZap(telefone, msgCobranca);

                // --- 🤖 ROBÔ DE CARRINHO ABANDONADO (MISSÃO 11) ---
                // Espera 10 minutos (600.000 ms)
                setTimeout(() => {
                    db.query("SELECT status FROM rifa_numeros WHERE id_pagamento_externo = ?", [prefResponse.id], (errTimer, resultsTimer) => {
                        if (resultsTimer && resultsTimer.length > 0) {
                            const aindaPendente = resultsTimer.some(r => r.status !== 'Pago');
                            if (aindaPendente && telefone) {
                                const msgRecuperacao = `⚠️ *SEU PIX VAI EXPIRAR!* ⚠️\n\nOlá, ${nome}! Notamos que você reservou números, mas o pagamento não foi concluído.\n\nCorre lá e finaliza o PIX antes que seus números sejam liberados. 🏃‍♀️💨\n\n🔗 *Link de Pagamento:* ${prefResponse.init_point}`;
                                enviarMensagemZap(telefone, msgRecuperacao);
                            }
                        }
                    });
                }, 600000);

            });

        } catch (mpError) { 
            res.status(500).send({ message: "Erro no Mercado Pago." }); 
        }
    });
});

// WEBHOOK DO MERCADO PAGO (MISSÃO 10 - Zap de Pós Venda)
app.post('/api/webhook/mercadopago', async (req, res) => {
    res.sendStatus(200);

    try {
        const { type, data } = req.body;
        if (type === 'payment') {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const paymentInfo = await response.json();

            if (paymentInfo.status === 'approved') {
                const externalRef = paymentInfo.external_reference; 
                
                if (externalRef && externalRef.startsWith('RIFA:')) {
                    const partes = externalRef.split('|');
                    const rifaId = partes[0].split(':')[1];
                    const numerosString = partes[1].split(':')[1]; 
                    const numerosArray = numerosString.split(',').map(n => Number(n));
                    const placeholders = numerosArray.map(() => '?').join(',');

                    // 1. Busca os dados do comprador no banco ANTES de atualizar
                    db.query(`SELECT comprador_nome, comprador_telefone FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders}) LIMIT 1`, [rifaId, ...numerosArray], (errBusca, resultsBusca) => {
                        
                        let zapComprador = null;
                        let nomeComprador = 'Cliente';
                        
                        if (resultsBusca && resultsBusca.length > 0) {
                            zapComprador = resultsBusca[0].comprador_telefone;
                            nomeComprador = resultsBusca[0].comprador_nome;
                        }

                        // 2. Atualiza para 'Pago'
                        const sqlUpdate = `UPDATE rifa_numeros SET status = 'Pago' WHERE rifa_id = ? AND numero IN (${placeholders})`;
                        db.query(sqlUpdate, [rifaId, ...numerosArray], (errUpdate) => {
                            if (!errUpdate) {
                                db.query("UPDATE rifas SET numeros_vendidos = numeros_vendidos + ? WHERE id = ?", [numerosArray.length, rifaId]);
                                console.log(`✅ Pagamento Aprovado (Webhook)! Rifa ${rifaId}`);
                                
                                // --- 🤖 ZAP DE PÓS-VENDA (CLIENTE REAL) ---
                                if (zapComprador && zapComprador !== '00000000000') {
                                    const msgSucesso = `🎉 *PAGAMENTO APROVADO!* 🎉\n\nOlá, ${nomeComprador}! Confirmamos o seu pagamento. Seus números da sorte estão garantidos! 🍀\n\nAcompanhe o sorteio na aba "Minha Conta" do nosso site. Boa sorte!`;
                                    enviarMensagemZap(zapComprador, msgSucesso);
                                }
                            }
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error("Erro no Webhook:", error);
    }
});

// SIMULAÇÃO DE PAGAMENTO (TESTES)
app.post('/api/simular-pagamento', (req, res) => {
    const { rifaId, numeros, clienteId, nome, telefone } = req.body;
    const placeholders = numeros.map(() => '?').join(',');
    
    db.query(`DELETE FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders})`, [rifaId, ...numeros], () => {
        const values = numeros.map(num => [rifaId, num, clienteId, nome || 'Teste', telefone || '00000000000', 'Pago', `simulacao_${Date.now()}`]);
        
        db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [values], (err) => {
            if(err) return res.status(500).send(err); 
            
            db.query("UPDATE rifas SET numeros_vendidos = numeros_vendidos + ? WHERE id = ?", [numeros.length, rifaId], () => {
                
                // MENSAGEM PÓS-VENDA DA SIMULAÇÃO
                if (telefone && telefone !== '00000000000') {
                    const msgSucesso = `🎉 *PAGAMENTO APROVADO!* 🎉\n\nOlá, ${nome}! Confirmamos o seu pagamento (Simulação). Seus números da sorte estão garantidos! 🍀`;
                    enviarMensagemZap(telefone, msgSucesso);
                }

                // ALERTA DE RIFA LOTADA (ADMIN)
                db.query("SELECT nome_premio, total_numeros, numeros_vendidos FROM rifas WHERE id = ?", [rifaId], (errRifa, resultsRifa) => {
                    if (resultsRifa && resultsRifa.length > 0) {
                        const rifa = resultsRifa[0];
                        if (rifa.numeros_vendidos >= rifa.total_numeros) {
                            const adminZap = process.env.ADMIN_WHATSAPP;
                            if (adminZap) enviarMensagemZap(adminZap, `🚨 *ALERTA DE RIFA LOTADA!* 🚨\n\nA rifa *"${rifa.nome_premio}"* atingiu 100%! Vá ao painel sortear! 🏆`);
                        }
                    }
                });

                res.send({message:"Ok"});
            });
        });
    });
});

app.listen(PORT, () => { console.log(`🚀 Servidor rodando na porta ${PORT}`); });