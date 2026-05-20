import React, { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle, ShieldCheck, Ticket, CreditCard, Sparkles, Truck } from 'lucide-react';
import { Card } from '../components/UI';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // ⚠️ ATENÇÃO: Coloque o número real da Natália aqui
  const numeroAdmin = "5561998183567"; 

  const faqs = [
    {
      icone: <Ticket className="text-pink-500" size={24} />,
      pergunta: "Como faço para comprar uma rifa?",
      resposta: "É muito simples! Acesse a aba 'Rifas', escolha o prêmio desejado e toque nos números que estão disponíveis (em branco), eles irão para o seu carrinho no final da tela, após selecionar basta escolher seu método de pagamento."
    },
    {
      icone: <Truck className="text-pink-500" size={24} />, // <--- NOVO TÓPICO ESTRATÉGICO
      pergunta: "Como é feita a entrega do produto e quanto custa o frete?",
      resposta: "A entrega é 100% por nossa conta! Enviamos os prêmios para qualquer lugar do Brasil via SEDEX com FRETE GRÁTIS. Assim que o sorteio é realizado, entramos em contato para coletar seu endereço e você recebe o código de rastreamento assim que o produto é postado."
    },
    {
      icone: <CreditCard className="text-pink-500" size={24} />,
      pergunta: "Quais são as formas de pagamento?",
      resposta: "Para garantir a segurança e a rapidez, aceitamos apenas pagamentos via PIX automático e cartões de crédito via Mercado Pago. A liberação dos seus números acontece na mesma hora, após a confirmação de pagamento!"
    },
    {
      icone: <ShieldCheck className="text-pink-500" size={24} />,
      pergunta: "Preciso enviar o comprovante de pagamento?",
      resposta: "Não! Nosso sistema é 100% automatizado. Assim que você realiza o PIX, o sistema identifica e seus números ficam verdes (Pagos) automaticamente na sua aba 'Minha Conta'."
    },
    {
      icone: <Sparkles className="text-pink-500" size={24} />,
      pergunta: "Como sei se eu ganhei o sorteio?",
      resposta: "Os sorteios são avisados nos grupos Geral do WhatsApp e individual do ganhador. Além disso, se você acessar a sua área 'Minha Conta', a rifa aparecerá com um aviso gigante avisando que o seu número foi o sorteado caso ganhe!"
    },
    {
      icone: <MessageCircle className="text-pink-500" size={24} />,
      pergunta: "Meus números sumiram do carrinho, o que houve?",
      resposta: "Para ser justo com todos, os números adicionados ao carrinho ficam reservados por alguns minutos. Se o PIX não for pago neste prazo limite, eles voltam a ficar disponíveis para outras pessoas comprarem."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSuporteDuvida = () => {
    const protocolo = Math.floor(Math.random() * 9999);
    const mensagem = `Olá, Natália! Li as dúvidas frequentes no site, mas ainda preciso de uma ajudinha. Pode me atender? (Ref: #${protocolo})`;
    window.open(`https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 animate-fade-in relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-pink-600 to-purple-800 rounded-b-[3rem] shadow-lg z-0"></div>

      <div className="relative z-10 container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30 rotate-3">
            <HelpCircle className="text-white w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md mb-2">Central de Ajuda</h2>
          <p className="text-pink-100 text-lg">Tire suas dúvidas e participe com segurança.</p>
        </div>

        <Card className="bg-white rounded-3xl shadow-xl overflow-hidden border-0 p-6 md:p-10 mb-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`border rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-pink-200 bg-pink-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-pink-100 hover:bg-gray-50'}`}
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-pink-100' : 'bg-gray-100'}`}>
                        {faq.icone}
                      </div>
                      <span className="font-bold text-gray-800 text-lg pr-4">{faq.pergunta}</span>
                    </div>
                    <ChevronDown className={`shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-pink-600' : ''}`} />
                  </button>
                  
                  <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 pt-0 pl-[72px] text-gray-600 leading-relaxed font-medium">
                      {faq.resposta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bloco de Suporte via WhatsApp */}
        <div className="text-center bg-gray-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-600 rounded-full blur-3xl opacity-30"></div>
          <h3 className="text-2xl font-black text-white mb-2 relative z-10">Ainda tem dúvidas?</h3>
          <p className="text-gray-400 mb-6 relative z-10">Nossa equipe está pronta para te atender no WhatsApp.</p>
          <button 
            onClick={handleSuporteDuvida}
            className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto mx-auto relative z-10"
          >
            <MessageCircle size={22} /> Falar com Suporte
          </button>
        </div>

      </div>
    </div>
  );
}