import React, { useState } from 'react';
import { User, Package, Ticket, LogOut } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { ClienteUser } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome && email) {
      // CORREÇÃO AQUI:
      // Criamos um objeto completo com um ID gerado (Date.now()) para satisfazer o TypeScript
      const novoUsuario: ClienteUser = {
        id: Date.now(), // Gera um número único (timestamp) como ID provisório
        nome,
        email,
        telefone
      };

      onLogin(novoUsuario);
      redirectAfterLogin();
    }
  };

  if (user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md animate-fade-in">
        <Card className="p-8 text-center bg-white border border-gray-100 shadow-xl rounded-2xl">
          <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
            <User size={48} className="text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold mb-1 text-gray-800">Olá, {user.nome.split(' ')[0]}!</h2>
          <p className="text-gray-500 mb-8 font-medium text-sm">{user.email}</p>
          
          <div className="space-y-4">
            <Button variant="secondary" className="w-full justify-start pl-6 gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200">
              <Package size={18}/> Meus Pedidos
            </Button>
            <Button variant="secondary" className="w-full justify-start pl-6 gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200">
              <Ticket size={18}/> Minhas Rifas
            </Button>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Button onClick={onLogout} variant="danger" className="w-full justify-center gap-2">
                <LogOut size={18}/> Sair da Conta
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-pink-600">Acesse sua Conta</h2>
        <p className="text-gray-600 mt-2">Entre para ver suas rifas e compras.</p>
      </div>
      
      <Card className="p-8 bg-white shadow-xl rounded-2xl border border-pink-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Nome</label>
            <input 
              type="text" required
              value={nome} onChange={e => setNome(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900" 
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Email</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900" 
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Telefone (Opcional)</label>
            <input 
              type="tel"
              value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition text-gray-900" 
              placeholder="(00) 00000-0000"
            />
          </div>
          <Button type="submit" className="w-full py-4 mt-2 shadow-lg">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}