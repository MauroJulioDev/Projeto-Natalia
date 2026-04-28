import React, { useState } from 'react';
import { User, Phone, Mail, ArrowRight, GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { Card, Button } from '../components/UI';
import toast from 'react-hot-toast';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export default function Mentoria() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
  });

  // --- MÁSCARA DE TELEFONE AUTOMÁTICA ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setFormData({ ...formData, telefone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TRAVA DE SEGURANÇA: 11 Dígitos
    const numerosTelefone = formData.telefone.replace(/\D/g, '');
    if (numerosTelefone.length !== 11) {
      return toast.error("O telefone deve ter exatamente 11 dígitos (DDD + 9 + Número).");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mentoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: numerosTelefone,
          nivel: 'Interesse em Mentoria' // Identificador pro painel Admin
        })
      });

      if (res.ok) {
        toast.success("Inscrição enviada! A Natália entrará em contato pelo WhatsApp.");
        setFormData({ nome: '', email: '', telefone: '' }); // Limpa o formulário
      } else {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 animate-fade-in">
      <Card className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-0">
        <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mt-10"></div>
          <GraduationCap size={64} className="text-white mx-auto mb-4 drop-shadow-lg" />
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Mentoria Exclusiva</h2>
          <p className="text-pink-100 mt-2 font-medium max-w-md mx-auto">
            Dê o próximo passo na sua carreira. Preencha os dados e receba um acompanhamento direto com a Natália.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-5">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome Completo <span className="text-pink-500">*</span></label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors" size={20} />
              <input required type="text" placeholder="Seu nome completo" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp <span className="text-pink-500">*</span></label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors" size={20} />
              <input required type="tel" placeholder="(00) 00000-0000" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold tracking-wide transition-all" value={formData.telefone} onChange={handlePhoneChange} />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">E-mail (Opcional)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors" size={20} />
              <input type="email" placeholder="seu@email.com" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-5 mt-4 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-pink-600 transition-all flex justify-center items-center gap-2 group">
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={20}/> Quero me Inscrever</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}