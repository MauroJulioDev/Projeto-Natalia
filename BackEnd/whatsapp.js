const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔄 Iniciando cliente WhatsApp...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/root/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer'
        ],
		protocolTimeout: 60000 // 60 segundos
    }
});

client.on('qr', (qr) => {
    console.log('📱 QR CODE PARA ESCANEAR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
});

client.initialize();

const enviarMensagemZap = async (telefone, mensagem) => {
    try {
        if (!telefone) {
            console.log("⚠️ Aviso: Tentativa de envio sem número.");
            return false;
        }

        let numeroLimpo = telefone.replace(/\D/g, '');
        if (!numeroLimpo.startsWith('55')) {
            numeroLimpo = `55${numeroLimpo}`;
        }

        const contatoVerificado = await client.getNumberId(numeroLimpo);

        if (contatoVerificado) {
            await client.sendMessage(contatoVerificado._serialized, mensagem);
            console.log(`✅ Mensagem enviada para ${telefone}`);
            return true;
        } else {
            console.log(`❌ Número não encontrado: ${telefone}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        return false;
    }
};

module.exports = { enviarMensagemZap };
