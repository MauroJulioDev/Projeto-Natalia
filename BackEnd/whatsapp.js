const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicia o cliente do WhatsApp (LocalAuth salva a sessão para não precisar ler o QR Code toda hora)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessário para evitar erros em algumas hospedagens
    }
});

// Quando precisar conectar, ele gera um QR Code no terminal do VS Code
client.on('qr', (qr) => {
    console.log('📱 ATENÇÃO: Escaneie o QR Code abaixo com o WhatsApp (Aparelho da Natália):');
    qrcode.generate(qr, { small: true });
});

// Avisa quando o WhatsApp estiver logado e pronto para disparar
client.on('ready', () => {
    console.log('✅ Robô do WhatsApp conectado e pronto para enviar mensagens!');
});

// Liga o motor do WhatsApp
client.initialize();

// Função que vamos exportar para usar no server.js
const enviarMensagemZap = async (telefone, mensagem) => {
    try {
        // Limpa a formatação (tira parênteses, traços e espaços)
        let numeroLimpo = telefone.replace(/\D/g, '');
        
        // Garante que tem o 55 (DDI do Brasil) na frente
        if (!numeroLimpo.startsWith('55')) {
            numeroLimpo = `55${numeroLimpo}`;
        }
        
        // A MÁGICA AQUI: Pede pro WhatsApp verificar se o número existe e qual o ID correto (com ou sem o 9)
        const contatoVerificado = await client.getNumberId(numeroLimpo);
        
        if (contatoVerificado) {
            // Se o WhatsApp achou a pessoa, manda a mensagem pro ID oficial que ele devolveu
            await client.sendMessage(contatoVerificado._serialized, mensagem);
            console.log(`📩 Zap enviado com sucesso para ${numeroLimpo}`);
        } else {
            console.log(`⚠️ Aviso: O número ${telefone} não possui WhatsApp registrado.`);
        }
        
    } catch (error) {
        console.error(`❌ Erro ao enviar Zap para ${telefone}:`, error.message);
    }
};

module.exports = { enviarMensagemZap };