import React, { useState, FormEvent } from 'react';
import { CheckCircle, Star, TrendingUp, Users, Award, ArrowRight, User, Phone, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { formatPhoneNumber } from '../utils/format';

export default function Mentoria() {
  // --- LÓGICA DO FORMULÁRIO ---
  const [formData, setFormData] = useState({ nome: '', telefone: '', nivel: '', dificuldade: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('http://localhost:3001/api/mentoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao enviar aplicação.');

      setStatus('success');
      setFormData({ nome: '', telefone: '', nivel: '', dificuldade: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  // --- RENDERIZAÇÃO DA PÁGINA ---
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 pb-16">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white pt-20 pb-48 px-4 overflow-hidden">
        {/* Decorativos de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 animate-fade-in-up">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold tracking-wide text-yellow-50">VAGAS LIMITADAS PARA CONSULTORAS</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Mentoria de Liderança <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              Alta Performance
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto mb-4 leading-relaxed font-light">
            Preencha a aplicação abaixo para concorrer a uma vaga na minha próxima turma de mentoria VIP.
          </p>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL (Grid) --- */}
      <div className="container mx-auto px-4 -mt-32 relative z-20">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* COLUNA ESQUERDA: Benefícios (Visual) */}
          <div className="space-y-6 hidden lg:block">
             <Card className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-l-4 border-yellow-500">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" />
                  O que você vai dominar:
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg text-purple-600 flex-shrink-0"><Users size={24} /></div>
                    <div>
                      <h4 className="font-bold text-gray-800">Recrutamento Magnético</h4>
                      <p className="text-sm text-gray-600">Como atrair novas consultoras sem ser chata.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-pink-100 p-3 rounded-lg text-pink-600 flex-shrink-0"><Award size={24} /></div>
                    <div>
                      <h4 className="font-bold text-gray-800">Gestão de Metas</h4>
                      <p className="text-sm text-gray-600">Planejamento estratégico para bater metas todo mês.</p>
                    </div>
                  </div>
                </div>
             </Card>

             {/* Prova Social Rápida */}
             <div className="bg-purple-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex gap-1 text-yellow-400 mb-3">
                    <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                  </div>
                  <p className="italic mb-4 text-purple-100">"Essa mentoria mudou minha visão de negócio. Hoje lidero 30 mulheres e minha renda triplicou."</p>
                  <p className="font-bold text-sm">— Juliana M., Consultora Ouro</p>
                </div>
             </div>
          </div>

          {/* COLUNA DIREITA: Formulário (Funcional) */}
          <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
             <div className="bg-gray-50 p-6 border-b border-gray-100 text-center">
               <h2 className="text-2xl font-bold text-gray-800">Aplicação para Mentoria</h2>
               <p className="text-sm text-gray-500 mt-1">Conte-me sobre o seu momento atual</p>
             </div>

             <div className="p-8">
               {status === 'success' ? (
                 <div className="text-center py-10 animate-scale-in">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <CheckCircle className="w-10 h-10 text-green-600" />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-800 mb-2">Aplicação Enviada!</h3>
                   <p className="text-gray-500 mb-8">
                     Recebi seus dados com sucesso. Minha equipe analisará seu perfil e entrará em contato pelo WhatsApp se você for selecionada.
                   </p>
                   <Button 
                     variant="outline" 
                     className="w-full border-gray-300 text-gray-600 hover:bg-gray-50" 
                     onClick={() => setStatus('idle')}
                   >
                     Enviar nova aplicação
                   </Button>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="space-y-5">
                   
                   {/* Nome */}
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                         <User size={20} />
                       </div>
                       <input 
                         required 
                         className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none" 
                         placeholder="Seu nome" 
                         value={formData.nome} 
                         onChange={e => setFormData({...formData, nome:e.target.value})} 
                       />
                     </div>
                   </div>

                   {/* WhatsApp */}
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                         <Phone size={20} />
                       </div>
                       <input 
                         required 
                         className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none" 
                         placeholder="(00) 00000-0000" 
                         value={formData.telefone} 
                         onChange={handlePhoneChange} 
                       />
                     </div>
                   </div>

                   {/* Nível */}
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Nível Atual na Tupperware</label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                         <Star size={20} />
                       </div>
                       <select 
                         required
                         className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none appearance-none" 
                         value={formData.nivel} 
                         onChange={e => setFormData({...formData, nivel:e.target.value})}
                       >
                         <option value="" disabled>Selecione seu nível...</option>
                         <option value="Iniciante">Iniciante / Consultora Nova</option>
                         <option value="Intermediário">Já vendo bem, mas não lidero</option>
                         <option value="Líder">Líder de Grupo / Empresária</option>
                       </select>
                     </div>
                   </div>

                   {/* Dificuldade */}
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Qual sua maior dificuldade hoje?</label>
                     <div className="relative">
                       <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                         <HelpCircle size={20} />
                       </div>
                       <textarea 
                         required
                         placeholder="Ex: Não consigo recrutar, tenho vergonha de vender no Instagram..." 
                         className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none resize-none" 
                         value={formData.dificuldade} 
                         onChange={e => setFormData({...formData, dificuldade:e.target.value})}
                       ></textarea>
                     </div>
                   </div>

                   {/* Botão Submit */}
                   <Button 
                     type="submit" 
                     className="w-full py-4 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1" 
                     disabled={status === 'loading'}
                   >
                     {status === 'loading' ? 'Enviando Aplicação...' : 'Aplicar para a Mentoria'} <ArrowRight size={20} className="ml-2 inline" />
                   </Button>

                   {/* Mensagem de Erro */}
                   {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm justify-center">
                        <AlertCircle size={16} /> Erro ao enviar. Tente novamente.
                      </div>
                   )}
                 </form>
               )}
             </div>
          </Card>

        </div>
      </div>
    </div>
  );
}