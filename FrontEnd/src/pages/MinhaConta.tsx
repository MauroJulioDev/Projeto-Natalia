import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Lock, Phone, User, Eye, EyeOff, LogIn, UserPlus, LogOut, Ticket, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Clock, Trophy, AlertCircle } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { ClienteUser } from '../types';
import toast from 'react-hot-toast';

interface MinhaContaProps {
  user: ClienteUser | null;
  onLogin: (user: ClienteUser) => void;
  onLogout: () => void;
  redirectAfterLogin: () => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export default function MinhaConta({ user, onLogin, onLogout, redirectAfterLogin }: MinhaContaProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  });

  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/api/clientes/${user.id}/historico`)
        .then(res => res.json())
        .then(data => setHistorico(data || []))
        .catch(() => toast.error("Erro ao carregar histórico."));
    }
  }, [user]);

  // =======================================================================
  // LÓGICA DE AGRUPAMENTO
  // =======================================================================
  const rifasAgrupadas = useMemo(() => {
    const grupos: Record<string, any> = {};
    
    historico.forEach(item => {
      if (!grupos[item.nome_premio]) {
        grupos[item.nome_premio] = {
          nome_premio: item.nome_premio,
          imagem_url: item.imagem_url,
          vencedor_numero: item.vencedor_numero, // <-- Agora pegamos o ganhador!
          numeros_pagos: [],
          numeros_reservados: []
        };
      }
      
      if (item.status === 'Pago') {
        grupos[item.nome_premio].numeros_pagos.push(item.numero);
      } else {
        grupos[item.nome_premio].numeros_reservados.push(item.numero);
      }
    });
    
    return Object.values(grupos).map((rifa: any) => ({
      ...rifa,
      numeros_pagos: rifa.numeros_pagos.sort((a: number, b: number) => a - b),
      numeros_reservados: rifa.numeros_reservados.sort((a: number, b: number) => a - b)
    }));
  }, [historico]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setFormData({ ...formData, telefone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numerosTelefone = formData.telefone.replace(/\D/g, '');
    if (numerosTelefone.length !== 11) return toast.error("O telefone deve ter exatamente 11 dígitos.");
    if (formData.senha.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");

    setIsLoading(true);
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          telefone: numerosTelefone,
          foto_perfil: ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (isLoginMode) {
          toast.success(`Bem-vindo de volta, ${data.user.nome.split(' ')[0]}!`);
          onLogin(data.user);
          redirectAfterLogin();
        } else {
          toast.success("Conta criada com sucesso! Faça login.");
          setIsLoginMode(true);
          setFormData({ ...formData, senha: '' });
        }
      } else {
        toast.error(data.message || "Erro de autenticação.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // =======================================================================
  // TELA 1: USUÁRIO LOGADO
  // =======================================================================
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30 shadow-xl">
                  <User size={48} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">Olá, {user.nome.split(' ')[0]}!</h2>
                  <p className="text-pink-100 flex items-center gap-2 mt-1 opacity-90"><Phone size={16}/> {user.telefone}</p>
                </div>
              </div>
              <Button onClick={onLogout} className="relative z-10 bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-none flex items-center gap-2 py-3 px-6 rounded-2xl transition-all">
                <LogOut size={18}/> Sair
              </Button>
            </div>

            {/* Histórico */}
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
                <Ticket className="text-pink-600 w-8 h-8" /> Minhas Participações
              </h3>
              
              {rifasAgrupadas.length > 0 ? (
                <div className="space-y-6">
                  {rifasAgrupadas.map((rifa, idx) => {
                    const isSorteada = rifa.vencedor_numero !== null && rifa.vencedor_numero !== undefined;
                    const clienteGanhou = isSorteada && rifa.numeros_pagos.includes(rifa.vencedor_numero);

                    return (
                      <Card key={idx} className={`overflow-hidden flex flex-col md:flex-row border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${isSorteada && !clienteGanhou ? 'opacity-80 grayscale-[20%]' : ''}`}>
                        
                        {/* Lado Esquerdo: Imagem */}
                        <div className="w-full md:w-56 h-56 md:h-auto bg-gray-100 relative shrink-0 overflow-hidden">
                          <img 
                            src={rifa.imagem_url || 'https://placehold.co/400x400/pink/white?text=Premio+Tupperware'} 
                            alt={rifa.nome_premio} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                          {clienteGanhou && (
                            <div className="absolute inset-0 bg-yellow-500/40 backdrop-blur-[2px] flex items-center justify-center">
                              <Trophy size={64} className="text-white drop-shadow-lg animate-bounce" />
                            </div>
                          )}
                        </div>

                        {/* Lado Direito: Informações */}
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-white relative">
                          <h4 className="text-xl md:text-2xl font-black text-gray-800 mb-6 pr-4">{rifa.nome_premio}</h4>
                          
                          {/* AVISOS DE SORTEIO */}
                          {clienteGanhou ? (
                            <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-yellow-200 animate-pulse">
                              <h5 className="font-black flex items-center gap-2 text-lg"><Trophy size={20} /> PARABÉNS, VOCÊ GANHOU!</h5>
                              <p className="text-sm font-medium mt-1">Seu número da sorte <strong>#{rifa.vencedor_numero}</strong> foi o grande vencedor!</p>
                            </div>
                          ) : isSorteada ? (
                            <div className="mb-6 bg-gray-100 border border-gray-200 p-4 rounded-2xl text-gray-600 flex items-start gap-3">
                              <AlertCircle size={20} className="shrink-0 mt-0.5" />
                              <div>
                                <h5 className="font-bold text-gray-800">Sorteio Encerrado</h5>
                                <p className="text-sm mt-1">O número vencedor desta rifa foi o <strong>#{rifa.vencedor_numero}</strong>.</p>
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-5">
                            {/* Números Pagos */}
                            {rifa.numeros_pagos.length > 0 && (
                              <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <CheckCircle2 size={16} className="text-green-500"/> Seus Números Pagos
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {rifa.numeros_pagos.map((n: number) => (
                                    <span key={n} className={`font-black px-4 py-2 rounded-xl text-sm border shadow-sm transition-all
                                      ${n === rifa.vencedor_numero 
                                        ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-200 ring-2 ring-yellow-400 ring-offset-2' 
                                        : 'bg-green-100 text-green-700 border-green-200'}`}>
                                      #{n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Números Reservados */}
                            {rifa.numeros_reservados.length > 0 && (
                              <div className={rifa.numeros_pagos.length > 0 ? "pt-4 border-t border-gray-100" : ""}>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Clock size={16} className="text-yellow-500"/> Aguardando Pagamento
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {rifa.numeros_reservados.map((n: number) => (
                                    <span key={n} className="bg-yellow-50 text-yellow-600 font-bold px-4 py-2 rounded-xl text-sm border border-yellow-200 opacity-80 cursor-help">
                                      #{n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <Ticket size={64} className="mx-auto text-gray-300 mb-6 stroke-1"/>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Cartela Vazia</h3>
                  <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">Você ainda não escolheu nenhum número. Que tal participar agora?</p>
                  <Button onClick={redirectAfterLogin} className="bg-pink-600 px-8 py-4 text-lg font-bold">Ver Rifas Disponíveis</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // TELA 2: LOGIN / CADASTRO
  // =======================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 animate-fade-in">
      <div className="w-full max-w-5xl flex bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-pink-600 via-pink-700 to-purple-800 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white leading-tight mb-6 tracking-tighter">Sua sorte começa <br/><span className="text-pink-200">aqui e agora.</span></h2>
            <p className="text-pink-100 text-lg">Crie sua conta para participar e acompanhar seus números da sorte.</p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl">
            <ShieldCheck size={32} className="text-pink-200 mb-4" />
            <h3 className="text-white font-bold mb-2">Segurança Garantida</h3>
            <p className="text-pink-100 text-sm">Seus dados e pagamentos processados com criptografia pelo Mercado Pago.</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 md:p-14 relative bg-white">
          <div className="max-w-md mx-auto">
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-10">
              <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isLoginMode ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Já tenho conta</button>
              <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${!isLoginMode ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Criar nova conta</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-down">
              {!isLoginMode && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome Completo <span className="text-pink-500">*</span></label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600" size={20} />
                    <input required type="text" placeholder="Seu nome" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp (Login) <span className="text-pink-500">*</span></label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600" size={20} />
                  <input required type="tel" placeholder="(00) 00000-0000" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold" value={formData.telefone} onChange={handlePhoneChange} />
                </div>
              </div>
              {!isLoginMode && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">E-mail (Opcional)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600" size={20} />
                    <input type="email" placeholder="seu@email.com" className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Senha <span className="text-pink-500">*</span></label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600" size={20} />
                  <input required type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" className="w-full pl-12 pr-12 py-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-medium" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full py-4 mt-6 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-pink-600 transition-all flex justify-center items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : (isLoginMode ? <><LogIn size={20}/> Entrar</> : <><UserPlus size={20}/> Cadastrar</>)}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}