import React, { useState } from 'react';
import { User, Package, Ticket, LogOut, Mail, Phone, ArrowRight, Loader2, UserCircle } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { ClienteUser } from '../types';
import { formatPhoneNumber } from '../utils/format';

interface MinhaContaProps {
  user: ClienteUser | null;
  onLogin: (user: ClienteUser) => void;
  onLogout: () => void;
  redirectAfterLogin: () => void;
}

export default function MinhaConta({ user, onLogin, onLogout, redirectAfterLogin }: MinhaContaProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (nome && email) {
      try {
        // Fluxo Profissional: Registro/Login
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, telefone, senha: '123' }),
        });

        const data = await response.json();

        let usuarioFinal: ClienteUser;

        if (response.status === 409) {
          const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha: '123' }),
          });
          usuarioFinal = await loginRes.json();
        } else {
          usuarioFinal = { id: data.id, nome, email, telefone };
        }

        onLogin(usuarioFinal);
        redirectAfterLogin();

      } catch (error: any) {
        alert("Erro ao acessar: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhoneNumber(e.target.value));
  };

  // --- TELA: USUÁRIO JÁ LOGADO ---
  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50/50">
        <Card className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden border-0">
          <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-8 text-center">
            <div className="relative inline-block">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/50 shadow-inner">
                    <UserCircle size={56} className="text-white" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Bem-vinda, {user.nome.split(' ')[0]}!</h2>
            <p className="text-pink-100 opacity-80 text-sm">{user.email}</p>
          </div>
          
          <div className="p-8 space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-pink-50 rounded-2xl transition-all group border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-pink-600"><Package size={20}/></div>
                <span className="font-semibold text-gray-700">Meus Pedidos</span>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-pink-50 rounded-2xl transition-all group border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-pink-600"><Ticket size={20}/></div>
                <span className="font-semibold text-gray-700">Minhas Rifas</span>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
            </button>
            
            <div className="pt-6">
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
              >
                <LogOut size={18}/> Sair da Conta
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- TELA: FORMULÁRIO DE ACESSO ---
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acesse sua Área</h2>
            <p className="text-gray-500 mt-2">Para comprar rifas e ver seus prêmios</p>
        </div>
        
        <Card className="p-8 bg-white shadow-2xl rounded-3xl border-0 relative overflow-hidden">
          {/* Detalhe visual de fundo */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" required
                  value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900 placeholder:text-gray-300" 
                  placeholder="Como podemos te chamar?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900 placeholder:text-gray-300" 
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">WhatsApp (Opcional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="tel"
                  value={telefone} onChange={handlePhoneChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900 placeholder:text-gray-300" 
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 mt-4 shadow-xl bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Acessar Agora"}
            </Button>
          </form>
        </Card>
        <p className="text-center text-gray-400 text-xs mt-6">
            Ambiente seguro e criptografado.
        </p>
      </div>
    </div>
  );
}