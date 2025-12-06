// Arquivo: App.tsx
// Versão Final: Sistema Completo (Máscaras, Pagamento MP, Admin, Validações)
import React, { useState, FormEvent, useEffect } from 'react';
import { UserPlus, ShoppingBag, GraduationCap, Menu, X, Instagram, Facebook, MessageCircle, CheckCircle, AlertCircle, Lock, LogOut, Database, Ticket, CreditCard } from 'lucide-react';

// --- DEFINIÇÃO DE TIPOS ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'danger';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

interface HomeProps {
  changePage: (page: string) => void;
}

interface NavLinkProps {
  page: string;
  label: string;
}

interface Rifa {
  id: number;
  nome_premio: string;
  valor_numero: number;
  imagem_url: string;
  status: 'Aberta' | 'Encerrada';
  numeros_vendidos: number;
  total_numeros: number;
}

interface NumeroRifa {
  numero: number;
  status: 'Reservado' | 'Pago';
  comprador_nome: string;
}

interface Consultora {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  data_cadastro: string;
}

interface MentoriaLead {
  id: number;
  nome: string;
  telefone: string;
  nivel: string;
  dificuldade: string;
  data_interesse: string;
}

// --- FUNÇÃO DE MÁSCARA DE TELEFONE ---
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);
  if (limited.length === 0) return "";
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

// --- COMPONENTES DE UI ---

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", type = "button", className = "", disabled = false }: ButtonProps) => {
  const baseStyle = "px-4 py-2 rounded font-semibold transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200",
    outline: "border-2 border-pink-600 text-pink-600 hover:bg-pink-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- PÁGINAS DO SISTEMA ---

// 1. Home Page
const Home = ({ changePage }: HomeProps) => (
  <div className="animate-fade-in">
    <div className="relative bg-gradient-to-br from-pink-600 to-purple-700 text-white py-24 px-4 text-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-md">Sua Jornada de Sucesso Começa Aqui</h1>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-pink-100">
          Como Mentora Tupperware, guio você rumo à independência financeira e realização profissional.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Button variant="secondary" className="text-lg py-3 px-8" onClick={() => changePage('cadastro')}>
            Quero ser Consultora
          </Button>
          <Button variant="outline" className="text-lg py-3 px-8 bg-transparent text-white border-white hover:bg-white hover:text-pink-600" onClick={() => changePage('rifas')}>
            Ver Prêmios e Rifas
          </Button>
        </div>
      </div>
    </div>

    <div className="container mx-auto py-16 px-4 grid md:grid-cols-3 gap-8 -mt-16 relative z-20">
      <Card className="text-center p-8 hover:-translate-y-2 transition-transform duration-300">
        <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="text-pink-600 w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-800">Recrutamento</h3>
        <p className="text-gray-600 mb-6">Cadastre-se na minha equipe e receba treinamento exclusivo para vender muito.</p>
        <Button variant="primary" className="w-full" onClick={() => changePage('cadastro')}>Saiba Mais</Button>
      </Card>

      <Card className="text-center p-8 hover:-translate-y-2 transition-transform duration-300">
        <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="text-purple-600 w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-800">Rifas Tupperware</h3>
        <p className="text-gray-600 mb-6">Participe das rifas semanais e concorra a kits completos por um valor simbólico.</p>
        <Button variant="primary" className="w-full" onClick={() => changePage('rifas')}>Comprar Números</Button>
      </Card>

      <Card className="text-center p-8 hover:-translate-y-2 transition-transform duration-300">
        <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="text-yellow-600 w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-800">Mentoria VIP</h3>
        <p className="text-gray-600 mb-6">Para líderes que desejam escalar seus ganhos e gerenciar grandes equipes.</p>
        <Button variant="primary" className="w-full" onClick={() => changePage('mentoria')}>Aplicar Agora</Button>
      </Card>
    </div>
  </div>
);

// 2. Página de Cadastro
const Cadastro = () => {
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cidade: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

      if (!response.ok) {
        throw new Error(data.message || 'Erro desconhecido ao salvar.');
      }

      setStatus('success');
      setFormData({ nome: '', email: '', telefone: '', cidade: '' });
    } catch (error: any) {
      console.error("Erro no envio:", error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h2 className="text-3xl font-bold text-pink-700 mb-2 text-center">Faça parte da Equipe</h2>
      <p className="text-center text-gray-600 mb-8">Preencha seus dados para receber o catálogo e iniciar seu cadastro.</p>
      
      <Card className="p-8">
        {status === 'success' ? (
          <div className="text-center py-8 animate-fade-in">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Cadastro Recebido!</h3>
            <p className="text-gray-600 mb-6">Seus dados foram salvos com sucesso. Em breve entrarei em contato.</p>
            <Button variant="primary" onClick={() => setStatus('idle')}>Novo Cadastro</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Nome Completo</label>
              <input 
                required
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
                placeholder="Ex: Maria da Silva"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">WhatsApp</label>
                <input 
                  required
                  type="tel" 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
                  placeholder="(61) 99999-9999"
                  value={formData.telefone}
                  onChange={handlePhoneChange}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Cidade e Estado</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
                  placeholder="Ex: São Paulo - SP"
                  value={formData.cidade}
                  onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">E-mail</label>
              <input 
                required
                type="email" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Quero ser Consultora'}
            </Button>
            
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded p-4 flex flex-col items-center justify-center gap-1 text-center animate-fade-in">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertCircle size={20} />
                  <span>Erro ao cadastrar</span>
                </div>
                <p className="text-red-500 text-sm">
                  {errorMessage || "Verifique sua conexão e tente novamente."}
                </p>
              </div>
            )}
          </form>
        )}
      </Card>
    </div>
  );
};

// 3. RIFAS
const Rifas = () => {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRifa, setSelectedRifa] = useState<Rifa | null>(null);
  const [numerosOcupados, setNumerosOcupados] = useState<NumeroRifa[]>([]);
  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null);
  
  const [compradorInfo, setCompradorInfo] = useState({ nome: '', telefone: '' });
  const [pagamentoStatus, setPagamentoStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    fetch('http://localhost:3001/api/rifas')
      .then(res => res.json())
      .then(data => { setRifas(data); setLoading(false); })
      .catch(err => console.error("Erro busca rifa", err));
  }, []);

  useEffect(() => {
    if (selectedRifa) {
      fetch(`http://localhost:3001/api/rifas/${selectedRifa.id}/numeros`)
        .then(res => res.json())
        .then(data => setNumerosOcupados(data));
    }
  }, [selectedRifa]);

  const handleOpenRifa = (rifa: Rifa) => {
    setSelectedRifa(rifa);
    setNumeroSelecionado(null);
    setPagamentoStatus('idle');
  };

  const handlePhoneChangeRifa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value); 
    setCompradorInfo({ ...compradorInfo, telefone: formatted });
  };

  const handlePagar = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRifa || !numeroSelecionado) return;
    setPagamentoStatus('loading');

    try {
        const response = await fetch(`http://localhost:3001/api/rifas/${selectedRifa.id}/pagar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                numero: numeroSelecionado,
                nome: compradorInfo.nome,
                telefone: compradorInfo.telefone,
                valor: selectedRifa.valor_numero,
                tituloRifa: selectedRifa.nome_premio
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Erro ao gerar pagamento");
        }

        const data = await response.json();
        
        if (data.link_pagamento) {
            window.location.href = data.link_pagamento;
        } else {
            throw new Error("Link de pagamento não gerado");
        }

    } catch (err: any) {
        alert(err.message);
        setPagamentoStatus('idle');
    }
  };

  const handleSimularPagamento = async () => {
      if(!selectedRifa || !numeroSelecionado) return;
      await fetch('http://localhost:3001/api/simular-pagamento', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ rifaId: selectedRifa.id, numero: numeroSelecionado })
      });
      alert("Simulação: Pagamento Aprovado! A página vai recarregar.");
      window.location.reload();
  };

  const renderGrid = () => {
    if (!selectedRifa) return null;
    const grid = [];
    for (let i = 1; i <= selectedRifa.total_numeros; i++) {
        const ocupado = numerosOcupados.find(n => n.numero === i);
        let bgClass = "bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-500 cursor-pointer"; 
        
        if (ocupado) {
            bgClass = ocupado.status === 'Pago' 
                ? "bg-red-500 text-white border-red-500 cursor-not-allowed" 
                : "bg-yellow-400 text-yellow-900 border-yellow-400 cursor-not-allowed opacity-80"; 
        } else if (numeroSelecionado === i) {
            bgClass = "bg-green-600 text-white border-green-600 ring-2 ring-green-300 scale-110 shadow-lg"; 
        }

        grid.push(
            <div key={i} onClick={() => !ocupado && setNumeroSelecionado(i)}
                className={`w-10 h-10 md:w-12 md:h-12 border-2 rounded-lg flex items-center justify-center font-bold text-sm md:text-base transition-all duration-200 ${bgClass}`}>
                {i}
            </div>
        );
    }
    return grid;
  };

  return (
    <div className="container mx-auto py-12 px-4 relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-purple-700">Rifas Interativas</h2>
        <p className="text-gray-600">Compre seu número e pague com Pix ou Cartão.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rifas.map(rifa => (
          <Card key={rifa.id} className="flex flex-col h-full hover:shadow-xl transition duration-300">
             <div className="relative">
                <img src={rifa.imagem_url || "https://placehold.co/600x400"} alt={rifa.nome_premio} className="w-full h-56 object-cover" />
                <span className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                   {rifa.numeros_vendidos}/{rifa.total_numeros} Vendidos
                </span>
             </div>
             <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{rifa.nome_premio}</h3>
                <p className="text-3xl font-bold text-pink-600 mb-4">R$ {Number(rifa.valor_numero).toFixed(2)}</p>
                <Button onClick={() => handleOpenRifa(rifa)} className="mt-auto w-full">
                    <Ticket className="w-5 h-5" /> Ver Números
                </Button>
             </div>
          </Card>
        ))}
      </div>

      {selectedRifa && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-pink-600 text-white p-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{selectedRifa.nome_premio}</h3>
                    <button onClick={() => setSelectedRifa(null)} className="hover:bg-pink-700 p-2 rounded-full"><X /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-gray-50 flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <p className="font-bold text-gray-700 mb-4 flex gap-4 text-sm">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-400"></div> Livre</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Reservado (Aguardando)</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Pago (Confirmado)</span>
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center content-start">
                            {renderGrid()}
                        </div>
                    </div>

                    <div className="md:w-80 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                        <h4 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Checkout Seguro</h4>
                        
                        {numeroSelecionado ? (
                            <form onSubmit={handlePagar} className="space-y-4">
                                <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                                    <p className="text-sm text-gray-600">Número Escolhido</p>
                                    <p className="text-4xl font-bold text-green-600">{numeroSelecionado}</p>
                                    <p className="text-sm font-bold mt-1 text-gray-700">Valor: R$ {Number(selectedRifa.valor_numero).toFixed(2)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">Seu Nome</label>
                                    <input required type="text" className="w-full border rounded p-2 text-sm"
                                        value={compradorInfo.nome}
                                        onChange={e => setCompradorInfo({...compradorInfo, nome: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">Seu WhatsApp</label>
                                    <input required type="tel" className="w-full border rounded p-2 text-sm"
                                        placeholder="(61) 99999-9999"
                                        value={compradorInfo.telefone}
                                        onChange={handlePhoneChangeRifa}
                                    />
                                </div>

                                <Button type="submit" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pagamentoStatus === 'loading'}>
                                    {pagamentoStatus === 'loading' ? 'Gerando Link...' : 'Pagar com Pix/Cartão'}
                                </Button>
                                <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                                    <Lock size={10} /> Pagamento processado via Mercado Pago
                                </p>

                                <div className="pt-4 border-t mt-4">
                                    <button type="button" onClick={handleSimularPagamento} className="text-xs text-gray-400 hover:text-green-600 underline w-full text-center">
                                        (Dev) Simular Pagamento Aprovado
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <Ticket className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Selecione um número.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// 4. Página de Mentoria
const Mentoria = () => {
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

      if (!response.ok) throw new Error('Erro na API');

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

  return (
    <div className="animate-fade-in">
      <div className="bg-gray-900 text-white py-20 px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-yellow-400">Mentoria Liderança de Elite</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Transforme sua atividade na Tupperware em um negócio milionário. Aprenda gestão, liderança e estratégias avançadas.
        </p>
      </div>

      <div className="container mx-auto py-16 px-4 grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-pink-700 mb-4">Para quem é esta mentoria?</h3>
            <p className="text-gray-600">
              Esta mentoria é exclusiva para consultoras que já vendem, mas se sentem estagnadas e querem dar o próximo passo para se tornarem Líderes e Distribuidoras.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">O que você vai dominar:</h3>
            <ul className="space-y-4">
              {[
                "Mindset de Empresária: Saindo do amadorismo",
                "Recrutamento Ativo: Como atrair 10 novas consultoras/mês",
                "Gestão de Estoque Inteligente (Pare de perder dinheiro)",
                "Marketing Digital: Venda para o Brasil todo"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm border-l-4 border-pink-500">
                  <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <Card className="p-8 bg-gradient-to-b from-pink-50 to-white border-t-4 border-pink-500">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Aplicação para Mentoria</h3>
          <p className="text-gray-500 mb-6 text-sm">As vagas são limitadas. Preencha para agendarmos uma entrevista.</p>
          
          {status === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">Aplicação enviada!</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setStatus('idle')}>Nova Aplicação</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                required
                type="text" 
                placeholder="Seu Nome Completo" 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 outline-none" 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
              <input 
                required
                type="tel" 
                placeholder="Seu WhatsApp" 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 outline-none" 
                value={formData.telefone}
                onChange={handlePhoneChange}
              />
              <select 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 outline-none bg-white text-gray-600"
                value={formData.nivel}
                onChange={(e) => setFormData({...formData, nivel: e.target.value})}
              >
                <option value="">Qual seu nível atual?</option>
                <option value="Iniciante">Consultora Iniciante</option>
                <option value="Líder">Líder de Grupo</option>
                <option value="Distribuidora">Distribuidora</option>
              </select>
              <textarea 
                placeholder="Qual sua maior dificuldade hoje na Tupperware?" 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 outline-none h-32"
                value={formData.dificuldade}
                onChange={(e) => setFormData({...formData, dificuldade: e.target.value})}
              ></textarea>
              <Button type="submit" variant="primary" className="w-full text-lg py-4" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : 'Enviar Aplicação'}
              </Button>
              {status === 'error' && <p className="text-red-500 text-center text-sm">Erro ao enviar. O servidor está ligado?</p>}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

// 5. Painel de Administração
const Admin = ({ logout }: { logout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'consultoras' | 'rifas' | 'mentoria'>('consultoras');
  const [consultoras, setConsultoras] = useState<Consultora[]>([]);
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [mentoria, setMentoria] = useState<MentoriaLead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resConsultoras = await fetch('http://localhost:3001/api/consultoras');
      if (resConsultoras.ok) setConsultoras(await resConsultoras.json());

      const resRifas = await fetch('http://localhost:3001/api/rifas');
      if (resRifas.ok) setRifas(await resRifas.json());

      const resMentoria = await fetch('http://localhost:3001/api/mentoria');
      if (resMentoria.ok) setMentoria(await resMentoria.json());

    } catch (err) {
      console.error("Erro ao buscar dados do admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleZap = (tel: string, nome: string) => {
    const cleanTel = tel.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanTel}?text=Olá ${nome}, vi seu cadastro no meu site!`, '_blank');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock className="text-pink-600" /> Painel Administrativo
          </h2>
          <p className="text-sm text-gray-500">Gerencie seus contatos e vendas</p>
        </div>
        <Button variant="danger" onClick={logout} className="text-sm">
          <LogOut size={16} /> Sair
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('consultoras')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${activeTab === 'consultoras' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <UserPlus size={16} className="inline mr-2" /> Novas Consultoras ({consultoras.length})
        </button>
        <button 
          onClick={() => setActiveTab('rifas')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${activeTab === 'rifas' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <ShoppingBag size={16} className="inline mr-2" /> Rifas Ativas ({rifas.length})
        </button>
        <button 
          onClick={() => setActiveTab('mentoria')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${activeTab === 'mentoria' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <GraduationCap size={16} className="inline mr-2" /> Interessados Mentoria ({mentoria.length})
        </button>
        <button onClick={fetchData} className="ml-auto p-2 text-gray-500 hover:text-gray-800" title="Atualizar dados">
          <Database size={20} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados...</div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
              {activeTab === 'consultoras' && (
                <tr>
                  <th className="p-4 border-b">Data</th>
                  <th className="p-4 border-b">Nome</th>
                  <th className="p-4 border-b">WhatsApp</th>
                  <th className="p-4 border-b">Cidade</th>
                  <th className="p-4 border-b">Ação</th>
                </tr>
              )}
              {activeTab === 'rifas' && (
                <tr>
                  <th className="p-4 border-b">Prêmio</th>
                  <th className="p-4 border-b">Valor</th>
                  <th className="p-4 border-b">Vendas</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Total Arrecadado</th>
                </tr>
              )}
              {activeTab === 'mentoria' && (
                <tr>
                  <th className="p-4 border-b">Data</th>
                  <th className="p-4 border-b">Nome</th>
                  <th className="p-4 border-b">Nível</th>
                  <th className="p-4 border-b">Dificuldade</th>
                  <th className="p-4 border-b">Ação</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'consultoras' && consultoras.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-500">{formatDate(c.data_cadastro)}</td>
                  <td className="p-4 font-medium">{c.nome}<div className="text-xs text-gray-400">{c.email}</div></td>
                  <td className="p-4">{c.telefone}</td>
                  <td className="p-4">{c.cidade}</td>
                  <td className="p-4">
                    <button onClick={() => handleZap(c.telefone, c.nome)} className="text-green-600 hover:text-green-800 text-sm font-bold flex items-center gap-1">
                      <MessageCircle size={16} /> Chamar
                    </button>
                  </td>
                </tr>
              ))}

              {activeTab === 'rifas' && rifas.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{r.nome_premio}</td>
                  <td className="p-4">R$ {Number(r.valor_numero).toFixed(2)}</td>
                  <td className="p-4">{r.numeros_vendidos} / {r.total_numeros}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'Aberta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-700">R$ {(r.numeros_vendidos * r.valor_numero).toFixed(2)}</td>
                </tr>
              ))}

              {activeTab === 'mentoria' && mentoria.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-500">{formatDate(m.data_interesse)}</td>
                  <td className="p-4 font-medium">{m.nome}</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{m.nivel || 'N/A'}</span></td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={m.dificuldade}>{m.dificuldade}</td>
                  <td className="p-4">
                    <button onClick={() => handleZap(m.telefone, m.nome)} className="text-green-600 hover:text-green-800 text-sm font-bold flex items-center gap-1">
                      <MessageCircle size={16} /> Entrevistar
                    </button>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'consultoras' && consultoras.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cadastro encontrado.</td></tr>}
              {activeTab === 'rifas' && rifas.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma rifa cadastrada.</td></tr>}
              {activeTab === 'mentoria' && mentoria.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum interesse em mentoria ainda.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// 6. Login do Admin
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-pink-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acesso Restrito</h2>
          <p className="text-gray-500">Entre com suas credenciais de mentora.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Usuário</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded p-3 focus:border-pink-500 outline-none"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Senha</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded p-3 focus:border-pink-500 outline-none"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">Usuário ou senha incorretos.</p>}
          <Button type="submit" variant="primary" className="w-full">Entrar no Painel</Button>
        </form>
        <button onClick={() => window.location.reload()} className="w-full mt-4 text-center text-sm text-gray-500 hover:text-pink-600">
          Voltar para o Site
        </button>
      </Card>
    </div>
  );
};

// --- APP PRINCIPAL E NAVEGAÇÃO ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <Home changePage={setCurrentPage} />;
      case 'cadastro': return <Cadastro />;
      case 'rifas': return <Rifas />;
      case 'mentoria': return <Mentoria />;
      case 'admin': 
        return isAdminLogged ? (
          <Admin logout={() => setIsAdminLogged(false)} />
        ) : (
          <AdminLogin onLogin={() => setIsAdminLogged(true)} />
        );
      default: return <Home changePage={setCurrentPage} />;
    }
  };

  const NavLink = ({ page, label }: NavLinkProps) => (
    <button 
      onClick={() => { setCurrentPage(page); setMobileMenuOpen(false); }}
      className={`text-sm md:text-base font-medium px-3 py-2 rounded-md transition duration-200 ${currentPage === page ? 'bg-pink-700 text-white shadow-inner' : 'text-pink-100 hover:bg-pink-500 hover:text-white'}`}
    >
      {label}
    </button>
  );

  if (currentPage === 'admin') {
    return renderPage();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col text-gray-800">
      <nav className="bg-pink-600 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentPage('home')}>
            <div className="bg-white text-pink-600 p-2 rounded-full shadow-md group-hover:rotate-12 transition duration-300">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Mentora Tupperware</span>
          </div>

          <div className="hidden md:flex gap-2">
            <NavLink page="home" label="Início" />
            <NavLink page="cadastro" label="Seja Consultora" />
            <NavLink page="rifas" label="Rifas & Prêmios" />
            <NavLink page="mentoria" label="Mentoria VIP" />
          </div>

          <div className="md:hidden text-white">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-pink-700 border-t border-pink-500 animate-slide-down">
            <div className="flex flex-col p-4 gap-2">
              <NavLink page="home" label="Início" />
              <NavLink page="cadastro" label="Seja Consultora" />
              <NavLink page="rifas" label="Rifas & Prêmios" />
              <NavLink page="mentoria" label="Mentoria VIP" />
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {renderPage()}
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12 border-t-4 border-pink-600">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="text-pink-500" /> Mentora Tupperware
            </h4>
            <p className="mb-4 max-w-sm">Levando oportunidade e desenvolvimento profissional para mulheres em todo o Brasil. Junte-se à nossa força de vendas.</p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">Acesso Rápido</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage('cadastro')} className="hover:text-pink-400 transition">Cadastro</button></li>
              <li><button onClick={() => setCurrentPage('rifas')} className="hover:text-pink-400 transition">Rifas</button></li>
              <li><button onClick={() => setCurrentPage('mentoria')} className="hover:text-pink-400 transition">Mentoria</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><MessageCircle size={16} /> (11) 99999-9999</li>
              <li className="flex items-center gap-2"><Instagram size={16} /> @suamentora</li>
              <li className="flex items-center gap-2"><Facebook size={16} /> /suamentoratupperware</li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-gray-800 text-sm flex justify-between items-center px-4">
          <span>&copy; {new Date().getFullYear()} Mentora Tupperware. Todos os direitos reservados.</span>
          <button onClick={() => setCurrentPage('admin')} className="text-gray-700 hover:text-white text-xs flex items-center gap-1 transition">
             <Lock size={12} /> Área Restrita
          </button>
        </div>
      </footer>
    </div>
  );
}