import React, { useState, useEffect, FormEvent } from 'react';
import { Ticket, X, ShoppingBag, AlertCircle, Check, DollarSign, Calendar, Gift } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Rifa, NumeroRifa, ClienteUser } from '../types';
import { formatPhoneNumber } from '../utils/format';

interface RifasProps {
  clientUser: ClienteUser | null;
  onRedirectLogin: () => void;
}

export default function Rifas({ clientUser, onRedirectLogin }: RifasProps) {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [selectedRifa, setSelectedRifa] = useState<Rifa | null>(null);
  const [numerosOcupados, setNumerosOcupados] = useState<NumeroRifa[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [compradorInfo, setCompradorInfo] = useState({ nome: '', telefone: '' });
  const [pagamentoStatus, setPagamentoStatus] = useState<'idle' | 'loading'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza dados do usuário logado
  useEffect(() => { 
    if (clientUser) {
      setCompradorInfo({ nome: clientUser.nome, telefone: clientUser.telefone || '' }); 
    }
  }, [clientUser]);
  
  // Carrega as rifas
  useEffect(() => { 
    fetch('http://localhost:3001/api/rifas')
      .then(r => r.json())
      .then(setRifas)
      .catch(err => { console.error(err); setErrorMsg("Não foi possível carregar as rifas no momento."); }); 
  }, []);

  // Carrega números quando uma rifa é selecionada
  useEffect(() => { 
    if (selectedRifa) {
      fetch(`http://localhost:3001/api/rifas/${selectedRifa.id}/numeros`)
        .then(r => r.json())
        .then(setNumerosOcupados);
    }
  }, [selectedRifa]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    else setSelectedNumbers([...selectedNumbers, num]);
  };

  const handlePhoneChangeRifa = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompradorInfo({ ...compradorInfo, telefone: formatPhoneNumber(e.target.value) });
  };

  const handlePagar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientUser) { onRedirectLogin(); return; }
    if (!selectedRifa || selectedNumbers.length === 0) return;
    
    setPagamentoStatus('loading');
    try {
        const body = { 
          numeros: selectedNumbers, 
          nome: compradorInfo.nome, 
          telefone: compradorInfo.telefone, 
          valorUnitario: selectedRifa.valor_numero, 
          tituloRifa: selectedRifa.nome_premio, 
          clienteId: clientUser.id 
        };
        
        const res = await fetch(`http://localhost:3001/api/rifas/${selectedRifa.id}/pagar`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(body) 
        });
        
        const data = await res.json();
        
        if (data.link_pagamento) window.location.href = data.link_pagamento;
        else throw new Error(data.message || "Erro ao gerar pagamento");
        
    } catch (err: any) { 
      alert(err.message); 
      setPagamentoStatus('idle'); 
    }
  };

  // Função para dev/teste
  const handleSimular = async () => {
      if(!selectedRifa || !selectedNumbers.length) return;
      try {
        await fetch('http://localhost:3001/api/simular-pagamento', { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ rifaId: selectedRifa.id, numeros: selectedNumbers }) 
        });
        alert("Simulação de Pagamento Aprovada! A página será recarregada."); 
        window.location.reload();
      } catch(e) { alert("Erro na simulação."); }
  };

  // Renderiza a grade de números
  const renderGrid = () => {
    if (!selectedRifa) return null;
    const grid: JSX.Element[] = [];
    
    for (let i = 1; i <= selectedRifa.total_numeros; i++) {
        const ocupado = numerosOcupados.find(n => n.numero === i);
        const isSelected = selectedNumbers.includes(i);
        
        // Lógica de Estilo dos Números
        let baseClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border shadow-sm";
        let statusClass = "bg-white hover:bg-pink-50 hover:border-pink-300 cursor-pointer border-gray-200 text-gray-600"; // Disponível
        
        if (ocupado) {
          statusClass = ocupado.status === 'Pago' 
            ? "bg-gray-100 text-gray-300 cursor-not-allowed border-transparent shadow-none" // Pago (invisível/desabilitado visualmente)
            : "bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed"; // Reservado
        } else if (isSelected) {
          statusClass = "bg-pink-600 text-white border-pink-600 transform scale-110 shadow-md ring-2 ring-pink-200"; // Selecionado
        }
        
        grid.push(
          <div 
            key={i} 
            onClick={() => !ocupado && toggleNumber(i)} 
            className={`${baseClass} ${statusClass}`}
          >
            {ocupado && ocupado.status === 'Pago' ? <Check size={16}/> : i}
          </div>
        );
    }
    return grid;
  };

  if (errorMsg) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-100 max-w-md">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Ops!</h3>
        <p className="text-gray-600">{errorMsg}</p>
        <Button onClick={() => window.location.reload()} className="mt-6 w-full">Tentar Novamente</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 animate-fade-in">
      
      {/* Cabeçalho da Página */}
      <div className="text-center mb-12">
        <div className="inline-block p-3 rounded-full bg-pink-100 mb-4">
          <Gift className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Rifas & Prêmios
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Escolha seus números da sorte e concorra a kits Tupperware exclusivos. Boa sorte!
        </p>
      </div>

      {/* Grid de Rifas */}
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rifas.map(rifa => {
            const porcentagem = Math.min((rifa.numeros_vendidos / rifa.total_numeros) * 100, 100);
            
            return (
              <Card key={rifa.id} className="group hover:shadow-2xl transition-all duration-300 border-t-4 border-pink-500 overflow-hidden flex flex-col">
                 <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img 
                      src={rifa.imagem_url || "https://placehold.co/600x400/pink/white?text=Premio+Tupperware"} 
                      alt={rifa.nome_premio}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold shadow-lg text-pink-700 flex items-center gap-1">
                      <DollarSign size={14} className="stroke-[3]" />
                      {Number(rifa.valor_numero).toFixed(2)}
                    </div>
                 </div>
                 
                 <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-1" title={rifa.nome_premio}>
                      {rifa.nome_premio}
                    </h3>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>{Math.round(porcentagem)}% vendido</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{width: `${porcentagem}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <Button 
                        onClick={() => {setSelectedRifa(rifa); setSelectedNumbers([]);}} 
                        className="w-full bg-gray-900 hover:bg-pink-600 text-white transition-colors duration-300 flex items-center justify-center gap-2 py-3 shadow-md"
                      >
                        <Ticket size={18}/> Escolher Números
                      </Button>
                    </div>
                 </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE NÚMEROS */}
      {selectedRifa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop com Blur */}
            <div 
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setSelectedRifa(null)}
            ></div>

            {/* Conteúdo do Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-700 text-white p-6 flex justify-between items-center shadow-md z-10">
                    <div>
                      <h3 className="font-bold text-xl md:text-2xl">{selectedRifa.nome_premio}</h3>
                      <p className="text-pink-100 text-sm opacity-90">Selecione seus números da sorte abaixo</p>
                    </div>
                    <button 
                      onClick={() => setSelectedRifa(null)}
                      className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      <X size={24}/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    
                    {/* Área Esquerda: Grid de Números */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
                      
                      {/* Legenda */}
                      <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-gray-300 bg-white"></div> Disponível</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-pink-600"></div> Selecionado</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-200"></div> Reservado</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-gray-200"></div> Vendido</div>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-center pb-20">
                        {renderGrid()}
                      </div>
                    </div>

                    {/* Área Direita: Carrinho / Checkout */}
                    <div className="md:w-96 bg-white border-l border-gray-100 flex flex-col shadow-xl z-20">
                        <div className="p-6 border-b border-gray-100">
                           <h4 className="font-bold text-gray-800 flex items-center gap-2">
                             <ShoppingBag size={20} className="text-pink-600"/> Resumo do Pedido
                           </h4>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {selectedNumbers.length > 0 ? (
                                <div className="space-y-6">
                                    <div>
                                      <p className="text-sm text-gray-500 mb-2">Números selecionados:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedNumbers.map(n => (
                                          <span key={n} className="bg-pink-50 text-pink-700 px-2 py-1 rounded text-xs font-bold border border-pink-100">
                                            #{n}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-600">Quantidade</span>
                                        <span className="font-semibold">{selectedNumbers.length}</span>
                                      </div>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-600">Valor Unitário</span>
                                        <span className="font-semibold">R$ {Number(selectedRifa.valor_numero).toFixed(2)}</span>
                                      </div>
                                      <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center text-lg font-bold text-pink-600">
                                        <span>Total</span>
                                        <span>R$ {(selectedNumbers.length * selectedRifa.valor_numero).toFixed(2)}</span>
                                      </div>
                                    </div>

                                    <form onSubmit={handlePagar} className="space-y-4">
                                        {!clientUser && (
                                          <div className="bg-yellow-50 text-yellow-800 p-3 text-sm rounded-lg border border-yellow-200 flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>
                                            <span>Faça login ou preencha seus dados para continuar.</span>
                                          </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Seu Nome</label>
                                            <input 
                                              required
                                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-500" 
                                              value={compradorInfo.nome} 
                                              onChange={e=>setCompradorInfo({...compradorInfo, nome:e.target.value})} 
                                              disabled={!!clientUser} 
                                              placeholder="Digite seu nome completo" 
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Seu WhatsApp</label>
                                            <input 
                                              required
                                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-500" 
                                              value={compradorInfo.telefone} 
                                              onChange={handlePhoneChangeRifa} 
                                              disabled={!!clientUser} 
                                              placeholder="(00) 00000-0000" 
                                            />
                                          </div>
                                        </div>

                                        <Button 
                                          type="submit" 
                                          className="w-full py-4 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all" 
                                          disabled={pagamentoStatus === 'loading'}
                                        >
                                          {pagamentoStatus === 'loading' ? 'Processando...' : (clientUser ? 'Finalizar Compra' : 'Pagar Agora')}
                                        </Button>
                                    </form>
                                    
                                    {/* Botão de Simulação (Apenas Dev) */}
                                    <button onClick={handleSimular} className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
                                      (Modo Teste) Simular Pagamento Aprovado
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                  <Ticket size={48} className="mb-4 stroke-1"/>
                                  <p>Selecione números na cartela para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}