import React, { useState, useEffect, FormEvent } from 'react';
import { Ticket, X, ShoppingBag, AlertCircle, Check, Gift, Calendar, Trophy, Medal, Flame, Clock, Sparkles, Crown } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Rifa, NumeroRifa, ClienteUser } from '../types';
import toast from 'react-hot-toast';

interface RifasProps {
  clientUser: ClienteUser | null;
  onRedirectLogin: () => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export default function Rifas({ clientUser, onRedirectLogin }: RifasProps) {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [selectedRifa, setSelectedRifa] = useState<Rifa | null>(null);
  const [numerosOcupados, setNumerosOcupados] = useState<NumeroRifa[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
  const [ranking, setRanking] = useState<any[]>([]); // Ranking da Rifa Específica
  const [globalRanking, setGlobalRanking] = useState<any[]>([]); // Ranking Global do Mês
  
  const [compradorInfo, setCompradorInfo] = useState({ nome: '', telefone: '' });
  const [pagamentoStatus, setPagamentoStatus] = useState<'idle' | 'loading'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const formatarReal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Pega o nome do mês atual para mostrar no pódio
  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });

  useEffect(() => { 
    if (clientUser) {
      setCompradorInfo({ 
        nome: clientUser.nome, 
        telefone: clientUser.telefone || '' 
      }); 
    }
  }, [clientUser]);
  
  useEffect(() => { 
    // Busca Rifas
    fetch(`${API_URL}/api/rifas`)
      .then(r => r.json())
      .then(setRifas)
      .catch(err => { 
        console.error(err); 
        setErrorMsg("Não foi possível carregar as rifas no momento."); 
      }); 
      
    // Busca o Ranking Global do Mês
    fetch(`${API_URL}/api/ranking-global`)
      .then(r => r.json())
      .then(setGlobalRanking)
      .catch(err => console.log("Sem dados de ranking global", err));
  }, []);

  // --- BUSCA OS NÚMEROS E O RANKING QUANDO ABRE A RIFA ---
  useEffect(() => { 
    if (selectedRifa) {
      // 1. Busca os números ocupados
      fetch(`${API_URL}/api/rifas/${selectedRifa.id}/numeros`)
        .then(r => r.json())
        .then(setNumerosOcupados);
        
      // 2. Busca o Ranking dos Top 3 da rifa
      fetch(`${API_URL}/api/rifas/${selectedRifa.id}/ranking`)
        .then(r => r.json())
        .then(setRanking)
        .catch(() => setRanking([]));
    }
  }, [selectedRifa]);

  const toggleNumber = (num: number) => {
    // BLOQUEIO: Não deixa selecionar se a rifa já acabou
    if (selectedRifa?.vencedor_numero !== null && selectedRifa?.vencedor_numero !== undefined) return;

    if (selectedNumbers.includes(num)) setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    else setSelectedNumbers([...selectedNumbers, num]);
  };

  const handlePagar = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!clientUser) { 
      onRedirectLogin(); 
      return; 
    }
    
    if (!selectedRifa || selectedNumbers.length === 0) return;
    
    setPagamentoStatus('loading');
    toast.loading("Processando reserva...", { id: 'pagamento' }); 
    
    try {
        const body = { 
          numeros: selectedNumbers, 
          nome: compradorInfo.nome, 
          telefone: compradorInfo.telefone, 
          valorUnitario: selectedRifa.valor_numero, 
          tituloRifa: selectedRifa.nome_premio, 
          clienteId: clientUser.id 
        };
        
        const res = await fetch(`${API_URL}/api/rifas/${selectedRifa.id}/pagar`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(body) 
        });
        
        const data = await res.json();
        
        if (res.status === 409) {
           throw new Error(data.message); 
        }

        if (data.link_pagamento) {
          toast.success("Redirecionando para o Mercado Pago...", { id: 'pagamento' });
          window.location.href = data.link_pagamento;
        } else {
          throw new Error(data.message || "Erro ao gerar link de pagamento");
        }
        
    } catch (err: any) { 
      toast.error(err.message || "Ocorreu um erro ao processar o pagamento.", { id: 'pagamento' });
      setPagamentoStatus('idle');
      if (selectedRifa) {
        fetch(`${API_URL}/api/rifas/${selectedRifa.id}/numeros`)
          .then(r => r.json())
          .then(setNumerosOcupados);
      }
    }
  };

  const handleSimular = async () => {
      if(!selectedRifa || !selectedNumbers.length || !clientUser) return;
      try {
        await fetch(`${API_URL}/api/simular-pagamento`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ 
            rifaId: selectedRifa.id, 
            numeros: selectedNumbers,
            clienteId: clientUser.id,
            nome: compradorInfo.nome,         
            telefone: compradorInfo.telefone  
          }) 
        });
        toast.success("Pagamento Simulado com Sucesso!"); 
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch(e) { 
        toast.error("Erro na simulação do pagamento."); 
      }
  };

  const renderGrid = () => {
    if (!selectedRifa) return null;
    const grid: JSX.Element[] = [];
    const isSorteada = selectedRifa.vencedor_numero !== null && selectedRifa.vencedor_numero !== undefined;
    
    for (let i = 1; i <= selectedRifa.total_numeros; i++) {
        const ocupado = numerosOcupados.find(n => n.numero === i);
        const isSelected = selectedNumbers.includes(i);
        
        let baseClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border shadow-sm";
        let statusClass = "bg-white hover:bg-pink-50 hover:border-pink-300 cursor-pointer border-gray-200 text-gray-600";
        
        if (isSorteada) {
            // Se já foi sorteada, aplica visual neutro e destaca apenas o vencedor
            if (ocupado && ocupado.status === 'Pago') {
                statusClass = i === selectedRifa.vencedor_numero 
                    ? "bg-yellow-400 text-yellow-900 border-yellow-500 ring-2 ring-yellow-400 ring-offset-2 scale-110 shadow-lg cursor-default z-10" 
                    : "bg-gray-100 text-gray-400 border-transparent cursor-default";
            } else {
                statusClass = "bg-white text-gray-300 border-gray-100 cursor-default opacity-50";
            }
        } else {
            // Lógica normal de compra
            if (ocupado) {
              statusClass = ocupado.status === 'Pago' 
                ? "bg-gray-100 text-gray-300 cursor-not-allowed border-transparent" 
                : "bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed";
            } else if (isSelected) {
              statusClass = "bg-pink-600 text-white border-pink-600 transform scale-110 shadow-md ring-2 ring-pink-200";
            }
        }
        
        grid.push(
          <div 
            key={i} 
            onClick={() => !ocupado && toggleNumber(i)} 
            className={`${baseClass} ${statusClass}`}
          >
            {ocupado && ocupado.status === 'Pago' ? (isSorteada && i === selectedRifa.vencedor_numero ? <Trophy size={16}/> : <Check size={16}/>) : i}
          </div>
        );
    }
    return grid;
  };

  if (errorMsg) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100 max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
        <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">Erro de Conexão</h3>
        <p className="text-gray-500 font-medium mb-6">{errorMsg}</p>
        <Button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white rounded-xl py-4 shadow-lg">Tentar Novamente</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 animate-fade-in">
      
      <div className="text-center mb-10">
        <div className="inline-block p-4 rounded-3xl bg-pink-100 mb-6 shadow-inner shadow-pink-200">
          <Gift className="w-10 h-10 text-pink-600" />
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
          Rifas & Prêmios
        </h2>
        <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Escolha seus números da sorte e concorra a kits exclusivos.
        </p>
      </div>

      {/* ========================================================= */}
      {/* RANKING GLOBAL (CLIENTES DO MÊS) */}
      {/* ========================================================= */}
      {globalRanking.length > 0 && (
        <div className="container mx-auto max-w-4xl mb-16 animate-fade-in-down">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-600 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
             
             <div className="bg-white/95 backdrop-blur-md rounded-[2.2rem] p-8 md:p-10 relative z-10 border border-white/50">
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center justify-center gap-3 tracking-tight">
                    <Crown className="text-yellow-500 w-8 h-8 md:w-10 md:h-10 drop-shadow-md" />
                    Top Clientes de <span className="capitalize text-pink-600">{mesAtual}</span>
                  </h3>
                  <p className="text-gray-500 font-medium mt-2 text-sm md:text-base">Os maiores compradores do mês! Quem será que leva o brinde surpresa?</p>
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8">
                  {globalRanking.map((user, idx) => (
                    <div key={idx} className="w-full md:w-auto bg-gray-50 flex flex-col items-center p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex-1 max-w-[280px]">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-white text-2xl mb-4 shadow-lg
                           ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-yellow-200 scale-110 ring-4 ring-yellow-100' : 
                             idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-200' : 
                             'bg-gradient-to-br from-orange-300 to-orange-500 shadow-orange-200'}`}>
                           {idx + 1}º
                        </div>
                        <span className="font-black text-gray-800 text-xl tracking-tight text-center truncate w-full">
                          {user.comprador_nome.split(' ')[0]} {user.comprador_nome.split(' ').length > 1 ? user.comprador_nome.split(' ')[1].charAt(0) + '.' : ''}
                        </span>
                        <div className="mt-3 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-xl font-bold text-sm border border-pink-200 flex items-center gap-1.5">
                           <Ticket size={14}/> {user.total_numeros} cotas
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VITRINE DE RIFAS */}
      {/* ========================================================= */}
      <div className="container mx-auto max-w-6xl mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {rifas.map(rifa => {
            const porcentagem = Math.min((rifa.numeros_vendidos / rifa.total_numeros) * 100, 100);
            const isSorteada = rifa.vencedor_numero !== null && rifa.vencedor_numero !== undefined;

            const renderBadge = () => {
              if (isSorteada) return <div className="absolute top-4 left-4 bg-gradient-to-r from-gray-900 to-gray-800 text-yellow-400 border border-gray-700 px-4 py-2 rounded-2xl text-[10px] md:text-xs font-black shadow-xl flex items-center gap-2 z-20 tracking-widest uppercase backdrop-blur-md"><Trophy size={16} className="text-yellow-500"/> Sorteio Realizado</div>;
              if (porcentagem >= 100) return <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 px-4 py-2 rounded-2xl text-[10px] md:text-xs font-black shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2 z-20 tracking-widest uppercase"><Clock size={16} className="animate-spin-slow" /> Aguardando Sorteio</div>;
              if (porcentagem >= 80) return <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-2xl text-[10px] md:text-xs font-black shadow-[0_5px_20px_rgba(225,29,72,0.4)] flex items-center gap-2 z-20 tracking-widest uppercase border border-red-400"><Flame size={16} className="animate-pulse" /> Últimos Números!</div>;
              if (porcentagem < 20) return <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-2xl text-[10px] md:text-xs font-black shadow-lg shadow-purple-500/30 flex items-center gap-2 z-20 tracking-widest uppercase border border-purple-400/50"><Sparkles size={16} className="text-purple-200" /> Lançamento</div>;
              return null; 
            };

            return (
              <Card key={rifa.id} className={`group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(219,39,119,0.2)] transition-all duration-500 border-0 rounded-[2rem] overflow-hidden flex flex-col relative bg-white`}>
                 
                 {renderBadge()}

                 <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img 
                      src={rifa.imagem_url || "https://placehold.co/600x400/pink/white?text=Premio+Tupperware"} 
                      alt={rifa.nome_premio}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isSorteada ? 'grayscale-[0.4] opacity-90' : ''}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                    
                    {isSorteada && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/90 text-green-700 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-2xl transform -rotate-6 border border-green-200 text-lg">
                          <Trophy size={24} /> ENCERRADA
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-lg font-black shadow-xl text-gray-900 flex items-center gap-2 z-10 border border-white/40">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apenas</span> 
                      {formatarReal(Number(rifa.valor_numero))}
                    </div>
                 </div>
                 
                 <div className="p-8 flex flex-col flex-grow relative">
                    <h3 className="font-black text-2xl text-gray-900 mb-3 line-clamp-2 tracking-tight leading-tight">{rifa.nome_premio}</h3>
                    
                    {isSorteada ? (
                      <div className="mb-8 p-4 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center">
                        <div className="text-green-800 font-bold text-sm">Número Ganhador:</div>
                        <span className="text-3xl font-black text-green-600 bg-white px-4 py-1 rounded-xl shadow-sm border border-green-100">#{rifa.vencedor_numero}</span>
                      </div>
                    ) : (
                      <div className="mb-8">
                        <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                          <span>Progresso</span>
                          <span className={porcentagem >= 80 ? 'text-pink-600' : ''}>{Math.round(porcentagem)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 relative ${porcentagem >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-purple-600'}`} style={{width: `${porcentagem}%`}}>
                             <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/30 to-transparent"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button 
                        onClick={() => {setSelectedRifa(rifa); setSelectedNumbers([]);}} 
                        className={`w-full transition-all duration-300 flex items-center justify-center gap-2 py-4 text-base font-bold shadow-lg rounded-xl ${isSorteada ? 'bg-gray-800 hover:bg-gray-900 text-white' : 'bg-gray-900 hover:bg-pink-600 text-white hover:shadow-pink-200/50'}`}
                      >
                        {isSorteada ? <><Trophy size={20}/> Ver Resultado e Ranking</> : <><Ticket size={20}/> Escolher Números</>}
                      </Button>
                    </div>
                 </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE COMPRA / RESULTADO */}
      {/* ========================================================= */}
      {selectedRifa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setSelectedRifa(null)}></div>

            <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-white/20">
                
                <div className="bg-gradient-to-r from-pink-600 to-purple-700 text-white p-8 flex justify-between items-center z-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                      <h3 className="font-black text-2xl md:text-3xl tracking-tight">{selectedRifa.nome_premio}</h3>
                      <p className="text-pink-100 text-sm opacity-90 mt-1 font-medium">
                        {selectedRifa.vencedor_numero !== null && selectedRifa.vencedor_numero !== undefined 
                          ? 'Sorteio Finalizado. Obrigado por participar!' 
                          : 'Toque nos números para selecionar'}
                      </p>
                    </div>
                    <button onClick={() => setSelectedRifa(null)} className="relative z-10 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-md">
                      <X size={24}/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50">
                      
                      <div className="flex flex-wrap gap-3 md:gap-4 justify-center pb-10">
                        {renderGrid()}
                      </div>

                      {/* --- PÓDIO DA RIFA --- */}
                      {ranking.length > 0 && (
                        <div className="max-w-md mx-auto mt-4 mb-10 animate-fade-in-down">
                          <div className="flex items-center justify-center gap-2 mb-6">
                            <Trophy size={28} className="text-yellow-500 drop-shadow-md" />
                            <h4 className="font-black text-gray-800 text-xl md:text-2xl tracking-tight">Top 3 Compradores</h4>
                          </div>
                          <div className="space-y-3">
                            {ranking.map((user, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:scale-105 transition-transform">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg text-lg
                                       ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-yellow-200' : 
                                         idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-200' : 
                                         'bg-gradient-to-br from-orange-300 to-orange-500 shadow-orange-200'}`}>
                                       {idx + 1}º
                                    </div>
                                    <span className="font-bold text-gray-700 text-lg">
                                      {user.comprador_nome.split(' ')[0]} {user.comprador_nome.split(' ').length > 1 ? user.comprador_nome.split(' ')[1].charAt(0) + '.' : ''}
                                    </span>
                                 </div>
                                 <div className="bg-pink-50 text-pink-700 px-4 py-2 rounded-xl font-black text-sm border border-pink-100">
                                    {user.total_numeros} cotas
                                 </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="md:w-[400px] bg-white border-l border-gray-100 flex flex-col shadow-2xl z-20">
                        {selectedRifa.vencedor_numero !== null && selectedRifa.vencedor_numero !== undefined ? (
                            
                            /* --- TELA DE RESULTADO DO SORTEIO (ESCONDE O CARRINHO) --- */
                            <div className="flex-1 p-8 bg-gray-50/30 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Trophy size={48} className="text-yellow-500" />
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Sorteio Encerrado</h4>
                                <p className="text-gray-500 mb-8 font-medium">Esta rifa já foi sorteada e não aceita mais participantes.</p>
                                
                                <div className="bg-white border-2 border-green-100 p-8 rounded-[2rem] shadow-xl shadow-green-100/50 w-full animate-bounce-in">
                                    <p className="text-xs font-black text-green-800 uppercase tracking-widest mb-3">Número Ganhador</p>
                                    <span className="text-6xl font-black text-green-500 tracking-tighter">#{selectedRifa.vencedor_numero}</span>
                                </div>
                            </div>

                        ) : (

                            /* --- CARRINHO DE COMPRAS NORMAL --- */
                            <>
                                <div className="p-8 border-b border-gray-50 bg-white z-10">
                                   <h4 className="font-black text-gray-900 flex items-center gap-3 text-xl tracking-tight">
                                     <div className="p-2 bg-pink-50 rounded-xl"><ShoppingBag size={24} className="text-pink-600"/></div> 
                                     Seu Carrinho
                                   </h4>
                                </div>

                                <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
                                    {selectedNumbers.length > 0 ? (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 animate-pulse shadow-sm">
                                              <Calendar size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                                <strong className="block mb-1 text-sm text-blue-900">Tempo Esgotando!</strong> 
                                                Conclua o pagamento em até 15 minutos para garantir estes números.
                                              </p>
                                            </div>

                                            <div>
                                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Números Escolhidos</p>
                                              <div className="flex flex-wrap gap-2">
                                                {selectedNumbers.map(n => (
                                                  <span key={n} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-xl text-sm font-black border border-pink-200 shadow-sm">#{n}</span>
                                                ))}
                                              </div>
                                            </div>
                                            
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                              <div className="flex justify-between items-center mb-3 text-sm font-bold text-gray-500">
                                                <span>Quantidade</span>
                                                <span className="text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{selectedNumbers.length} cotas</span>
                                              </div>
                                              
                                              <div className="border-t border-dashed border-gray-200 my-4"></div>

                                              <div className="flex justify-between items-end">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Total a pagar</span>
                                                <span className="text-3xl font-black text-green-600 tracking-tighter">{formatarReal(selectedNumbers.length * selectedRifa.valor_numero)}</span>
                                              </div>
                                            </div>

                                            <form onSubmit={handlePagar} className="space-y-5 pt-4">
                                                {!clientUser && (
                                                  <div className="bg-yellow-50 text-yellow-800 p-4 text-sm rounded-2xl border border-yellow-200 flex items-start gap-3 shadow-sm">
                                                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-yellow-600"/>
                                                    <span className="font-medium">Para sua segurança, faça login no topo da página para finalizar.</span>
                                                  </div>
                                                )}
                                                
                                                <div className="space-y-4">
                                                  <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome no Bilhete</label>
                                                    <input required readOnly className="w-full p-4 bg-gray-100 border-0 rounded-2xl text-gray-500 cursor-not-allowed font-bold outline-none" value={compradorInfo.nome} />
                                                  </div>
                                                  <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp Recebedor</label>
                                                    <input required readOnly className="w-full p-4 bg-gray-100 border-0 rounded-2xl text-gray-500 cursor-not-allowed font-bold outline-none" value={compradorInfo.telefone} />
                                                  </div>
                                                </div>

                                                <Button 
                                                  type="submit" 
                                                  className="w-full py-5 text-lg font-black bg-green-500 hover:bg-green-600 shadow-xl shadow-green-200 rounded-2xl transition-all" 
                                                  disabled={pagamentoStatus === 'loading'}
                                                >
                                                  {pagamentoStatus === 'loading' ? 'Processando...' : (clientUser ? 'Pagar com PIX' : 'Fazer Login')}
                                                </Button>
                                            </form>
                                            
                                            <div className="pt-4 text-center">
                                              <button onClick={handleSimular} className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-pink-500 transition-colors">
                                                [Modo Teste] Simular Aprovação
                                              </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60 px-8 text-center">
                                          <Ticket size={64} className="mb-6 stroke-1"/>
                                          <p className="font-medium text-lg text-gray-400">Seu carrinho está vazio.</p>
                                          <p className="text-sm mt-2">Toque nos números à esquerda para adicionar.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}