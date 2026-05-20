import React, { useState, FormEvent } from 'react';
import { CheckCircle, AlertCircle, User, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { formatPhoneNumber } from '../utils/format';

export default function Cadastro() {
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cidade: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ⚠️ ATENÇÃO: Coloque o número real da Natália aqui (DDI + DDD + Número)
  const numeroAdmin = "5561999999999"; 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await fetch('http://localhost:3001/api/consultoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Erro desconhecido ao salvar.');

      // 1. Muda a tela para Sucesso
      setStatus('success');
      
      // --- SISTEMA ANTI-BLOQUEIO (SPINTAX + PROTOCOLO) ---
      // Sorteia um "Oi" diferente a cada clique
      const saudacoes = ["Olá, Natália!", "Oi, Natália!", "Oie Natália, tudo bem?", "Olá!"];
      const saudacaoSorteada = saudacoes[Math.floor(Math.random() * saudacoes.length)];

      // Gera um protocolo único usando números aleatórios + os segundos atuais
      const protocolo = Math.floor(Math.random() * 9999) + "-" + new Date().getSeconds();

      // A mensagem agora é 100% exclusiva e nunca será lida como Spam pelo WhatsApp
      const mensagem = `${saudacaoSorteada} Acabei de fazer meu cadastro no site para ser uma consultora. Meu nome é ${formData.nome} e vim pedir a aprovação da minha conta! (Protocolo: #${protocolo})`;
      // --------------------------------------------------

      const urlWhatsApp = `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensagem)}`;

      // 3. Tenta forçar a abertura do WhatsApp automaticamente (em uma nova aba)
      window.open(urlWhatsApp, '_blank');

      // OBS: Não limpamos o formData aqui para podermos usar o nome no botão de "backup" da tela de sucesso.
    } catch (error: any) {
      console.error("Erro no envio:", error);
      setErrorMessage(error.message || "Erro de conexão com o servidor.");
      setStatus('error');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  const resetarFormulario = () => {
    setFormData({ nome: '', email: '', telefone: '', cidade: '' });
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 animate-fade-in relative overflow-hidden">
      
      {/* Background Decorativo no Topo */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-pink-600 to-purple-800 rounded-b-[50px] z-0 shadow-lg"></div>

      <div className="relative z-10 w-full max-w-2xl">
        
        {/* Cabeçalho do Formulário */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">
            Faça parte da Equipe
          </h2>
          <p className="text-pink-100 text-lg opacity-90 font-light">
            Preencha seus dados abaixo e inicie sua jornada de sucesso hoje mesmo.
          </p>
        </div>

        <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-10">
            
            {status === 'success' ? (
              // TELA DE SUCESSO E REDIRECIONAMENTO WHATSAPP
              <div className="text-center py-8 animate-scale-in flex flex-col items-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">Cadastro Recebido!</h3>
                <p className="text-gray-500 mb-8 text-base max-w-md mx-auto">
                  Sua solicitação foi registrada. Se o seu WhatsApp não abriu automaticamente, clique no botão abaixo para falar com a Natália e agilizar sua aprovação.
                </p>
                
                {/* BOTÃO DE BACKUP COM PROTOCOLO ÚNICO */}
                <a 
                  href={`https://wa.me/${numeroAdmin}?text=${encodeURIComponent(`Olá, Natália! Sou a ${formData.nome}. Meu cadastro de consultora foi concluído no site e aguardo aprovação! (Ref: #${Math.floor(Math.random() * 9999)}-${new Date().getSeconds()})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-sm py-4 mb-6 text-lg font-black bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <Send size={24} /> Enviar Mensagem Agora
                </a>

                <button 
                  onClick={resetarFormulario}
                  className="text-sm font-bold text-gray-400 hover:text-pink-500 underline transition-colors"
                >
                  Voltar e fazer outro cadastro
                </button>
              </div>
            ) : (
              // FORMULÁRIO
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Campo Nome */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                    </div>
                    <input 
                      required 
                      type="text" 
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm" 
                      placeholder="Ex: Maria da Silva" 
                      value={formData.nome} 
                      onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Campo Telefone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">WhatsApp</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                      </div>
                      <input 
                        required 
                        type="tel" 
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm" 
                        placeholder="(00) 00000-0000" 
                        value={formData.telefone} 
                        onChange={handlePhoneChange} 
                      />
                    </div>
                  </div>

                  {/* Campo Cidade */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Cidade/UF</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                      </div>
                      <input 
                        required 
                        type="text" 
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm" 
                        placeholder="Ex: São Paulo - SP" 
                        value={formData.cidade} 
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                {/* Campo Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                    </div>
                    <input 
                      required 
                      type="email" 
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 hover:bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm" 
                      placeholder="seu@email.com" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Botão de Envio */}
                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg font-black bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded-xl shadow-xl shadow-pink-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4" 
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    <>
                      Quero ser Consultora <Send size={20} />
                    </>
                  )}
                </Button>

                {/* Mensagem de Erro */}
                {status === 'error' && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl animate-shake shadow-sm">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Ocorreu um erro ao enviar.</p>
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-center text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">
                  Seus dados estão 100% seguros
                </p>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}