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
// 1. MIDDLEWARES DE SEGURANÇA (NO TOPO!)
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
// 3. ROTAS DE AUTENTICAÇÃO (CLIENTES E ADMIN)
// ==========================================

// Login Exclusivo para o Painel Admin
app.post('/api/auth/admin-login', (req, res) => {
    const { email, senha } = req.body;
    // Autenticação simples para o Admin. Em um cenário ideal, isso viria de uma tabela 'admins' no banco.
    if (email === 'admin' && senha === 'admin123') {
        const token = jwt.sign({ id: 0, role: 'admin' }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: "Credenciais de administrador inválidas." });
    }
});

// Registro Seguro de Cliente (Agora checando se o Telefone já existe)
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, telefone, senha, foto_perfil } = req.body;
    
    // O e-mail agora pode ser opcional, mas o telefone é obrigatório!
    if (!nome || !telefone || !senha) return res.status(400).send({ message: "Preencha nome, telefone e senha." });
    
    try {
        // 👇 MUDANÇA: Agora checamos se o TELEFONE já está em uso, em vez do e-mail
        db.query("SELECT * FROM clientes WHERE telefone = ?", [telefone], async (err, results) => {
            if (err) return res.status(500).send({ message: "Erro no banco." });
            if (results.length > 0) return res.status(409).send({ message: "Este WhatsApp já está cadastrado!" });
            
            // Criptografa a senha antes de salvar
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            const sql = "INSERT INTO clientes (nome, email, telefone, senha, foto_perfil) VALUES (?, ?, ?, ?, ?)";
            db.query(sql, [nome, email || '', telefone, senhaHash, foto_perfil || ''], (err, result) => {
                if (err) {
                    console.error("ERRO DO MYSQL:", err);
                    return res.status(500).json({ message: "Erro ao cadastrar." });
                }
                res.status(201).json({ id: result.insertId, message: "Usuário criado!" });
            });
        });
    } catch (e) {
        res.status(500).json({ message: "Erro interno." });
    }
});

// Login Seguro de Cliente (Agora logando com o TELEFONE)
app.post('/api/auth/login', (req, res) => {
    // 👇 MUDANÇA: Recebemos telefone em vez de e-mail
    const { telefone, senha } = req.body;

    // 👇 MUDANÇA: Buscamos no banco pelo telefone
    db.query("SELECT * FROM clientes WHERE telefone = ?", [telefone], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: "WhatsApp não cadastrado." });

        const user = results[0];

        // Compara a senha digitada com a criptografada no banco
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ message: "Senha incorreta." });

        // Gera o Token de sessão
        const token = jwt.sign({ id: user.id, telefone: user.telefone }, SECRET_KEY, { expiresIn: '2h' });

        res.json({
            token,
            user: { id: user.id, nome: user.nome, email: user.email, foto_perfil: user.foto_perfil, telefone: user.telefone }
        });
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
// 4. ROTAS DO PAINEL ADMIN (CONSULTORAS E MENTORIA)
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
// 5. ROTAS DE GERENCIAMENTO DE RIFAS (CRUD)
// ==========================================
app.get('/api/rifas', (req, res) => {
    const sql = "SELECT * FROM rifas"; 
    db.query(sql, (err, result) => {
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

app.post('/api/rifas', verifyToken, (req, res) => {
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;
    const query = 'INSERT INTO rifas (nome_premio, total_numeros, valor_numero, imagem_url) VALUES (?, ?, ?, ?)';
    db.query(query, [nome_premio, total_numeros, valor_numero, imagem_url], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro no banco de dados' });
        res.status(201).json({ message: 'Rifa cadastrada!', id: result.insertId });
    });
});

app.put('/api/rifas/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { nome_premio, valor_numero, total_numeros, imagem_url } = req.body;
    const query = 'UPDATE rifas SET nome_premio = ?, total_numeros = ?, valor_numero = ?, imagem_url = ? WHERE id = ?';
    db.query(query, [nome_premio, total_numeros, valor_numero, imagem_url, id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar no banco.' });
        res.status(200).json({ message: 'Rifa atualizada com sucesso!' });
    });
});

app.delete('/api/rifas/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM rifa_numeros WHERE rifa_id = ?', [id], (err1) => {
        if (err1) return res.status(500).json({ error: 'Erro ao limpar dados.' });
        db.query('DELETE FROM rifas WHERE id = ?', [id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Erro ao deletar a rifa.' });
            res.status(200).json({ message: 'Rifa deletada com sucesso!' });
        });
    });
});

// ==========================================
// 6. ROTAS DE SORTEIO (COM SEGURANÇA)
// ==========================================
app.post('/api/rifas/:id/sortear', verifyToken, (req, res) => {
    const rifaId = req.params.id;

    const sqlNumeros = "SELECT numero, comprador_nome FROM rifa_numeros WHERE rifa_id = ? AND status = 'Pago'";
    db.query(sqlNumeros, [rifaId], (err, results) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar números." });
        if (results.length === 0) return res.status(400).json({ message: "Nenhum número pago encontrado." });

        const vencedor = results[Math.floor(Math.random() * results.length)];

        const updateSql = "UPDATE rifas SET vencedor_numero = ?, data_sorteio = NOW() WHERE id = ?";
        db.query(updateSql, [vencedor.numero, rifaId], (upErr) => {
            if (upErr) return res.status(500).json({ message: "Erro ao salvar vencedor." });
            res.json({ numero: vencedor.numero, ganhador: vencedor.comprador_nome });
        });
    });
});

// ==========================================
// 7. ROTAS DE PAGAMENTO E CHECKOUT (WEBHOOK PREPARADO)
// ==========================================
app.post('/api/rifas/:id/pagar', async (req, res) => {
    const rifaId = req.params.id;
    const { numeros, nome, telefone, valorUnitario, tituloRifa, clienteId } = req.body;

    if (!numeros || !numeros.length) return res.status(400).send({ message: "Sem números." });

    limparReservasExpiradas();

    const placeholders = numeros.map(() => '?').join(',');
    db.query(`SELECT * FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders})`, [rifaId, ...numeros], async (err, results) => {
        if (results && results.length > 0) return res.status(409).send({ message: "Números já ocupados. Escolha outros." });

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
                    // O BILHETE ESCONDIDO PARA O WEBHOOK
                    external_reference: `RIFA:${rifaId}|NUMEROS:${numeros.join(',')}`,
                    // URL DO SEU WEBHOOK (Quando for para a internet, troque este link)
                    notification_url: "https://SEU-DOMINIO-AQUI.com.br/api/webhook/mercadopago"
                }
            };

            const prefResponse = await preference.create(preferenceData);

            const values = numeros.map(num => [rifaId, num, clienteId || null, nome, telefone, 'Reservado', prefResponse.id]);
            
            // BANCO DE DADOS LIMPO: Inserindo e respondendo apenas 1 vez
            db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [values], (dbErr) => {
                if (dbErr) return res.status(500).send({ message: "Erro ao salvar reserva no banco." });
                
                // 1. Responde para o site liberar a tela e abrir o Mercado Pago
                res.json({ link_pagamento: prefResponse.init_point });

                // 2. Dispara o WhatsApp em segundo plano
                const numerosFormatados = numeros.join(', ');
                const mensagem = `*Mentora Tupperware* 🎁\n\nOlá, ${nome}! Sua reserva na rifa *${tituloRifa}* foi recebida com sucesso!\n\n🎟️ *Números reservados:* ${numerosFormatados}\n💰 *Total:* R$ ${(numeros.length * valorUnitario).toFixed(2)}\n\n⚠️ *Atenção:* Você tem 15 minutos para concluir o pagamento no link abaixo. Caso contrário, os números voltarão a ficar disponíveis.\n\n🔗 *Link de Pagamento:* ${prefResponse.init_point}\n\nBoa sorte! 🍀`;
                
                enviarMensagemZap(telefone, mensagem);
            });

        } catch (mpError) { 
            console.error("Erro MP Detalhado:", mpError); 
            res.status(500).send({ message: "Erro na integração com Mercado Pago." }); 
        }
    });
});

// WEBHOOK DO MERCADO PAGO (Para automatizar a baixa)
app.post('/api/webhook/mercadopago', async (req, res) => {
    // 1. O Mercado Pago exige um OK 200 rápido para não achar que seu servidor caiu
    res.sendStatus(200);

    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            // Verifica o pagamento real na API do Mercado Pago usando a variável segura do .env
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

                    // Atualiza os números para Pago
                    const placeholders = numerosArray.map(() => '?').join(',');
                    const sqlUpdate = `UPDATE rifa_numeros SET status = 'Pago' WHERE rifa_id = ? AND numero IN (${placeholders})`;
                    
                    db.query(sqlUpdate, [rifaId, ...numerosArray], (err) => {
                        if (err) console.error("Erro ao atualizar banco via Webhook:", err);
                        else {
                            // Atualiza a barra de progresso da rifa
                            db.query("UPDATE rifas SET numeros_vendidos = numeros_vendidos + ? WHERE id = ?", [numerosArray.length, rifaId]);
                            console.log(`✅ Pagamento Aprovado! Rifa ${rifaId} | Números [${numerosString}] atualizados.`);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Erro no processamento do Webhook:", error);
    }
});

app.post('/api/simular-pagamento', (req, res) => {
    const { rifaId, numeros, clienteId, nome, telefone } = req.body;
    
    const placeholders = numeros.map(() => '?').join(',');
    
    // 1. Limpa qualquer reserva anterior
    db.query(`DELETE FROM rifa_numeros WHERE rifa_id = ? AND numero IN (${placeholders})`, [rifaId, ...numeros], () => {
        
        // 2. Insere como Pago
        const values = numeros.map(num => [rifaId, num, clienteId, nome || 'Teste', telefone || '00000000000', 'Pago', `simulacao_${Date.now()}`]);
        
        db.query("INSERT INTO rifa_numeros (rifa_id, numero, cliente_id, comprador_nome, comprador_telefone, status, id_pagamento_externo) VALUES ?", [values], (err) => {
            if(err) return res.status(500).send(err); 
            
            // 3. Atualiza a barrinha da Rifa
            db.query("UPDATE rifas SET numeros_vendidos = numeros_vendidos + ? WHERE id = ?", [numeros.length, rifaId], () => {
                
                // 🚀 4. NOVO: CHECAGEM DE 100% VENDIDO
                db.query("SELECT nome_premio, total_numeros, numeros_vendidos FROM rifas WHERE id = ?", [rifaId], (err, results) => {
                    if (results && results.length > 0) {
                        const rifa = results[0];
                        
                        // Se os números vendidos forem iguais (ou maiores) que o total da rifa
                        if (rifa.numeros_vendidos >= rifa.total_numeros) {
                            const adminZap = process.env.ADMIN_WHATSAPP;
                            
                            if (adminZap) {
                                const mensagemAdmin = `🚨 *ALERTA DE RIFA LOTADA!* 🚨\n\nA rifa *"${rifa.nome_premio}"* acabou de atingir 100% de vendas!\n\nAcesse o painel Admin agora para realizar o sorteio e anunciar o vencedor! 🏆`;
                                
                                // Chama o nosso robô para avisar a Natália
                                enviarMensagemZap(adminZap, mensagemAdmin);
                            }
                        }
                    }
                });

                res.send({message:"Ok"});
            });
        });
    });
});

app.listen(PORT, () => { console.log(`🚀 Servidor rodando na porta ${PORT}`); });