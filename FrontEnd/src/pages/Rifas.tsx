import React, { useState, useEffect, FormEvent } from 'react';
import { Ticket, X, ShoppingBag, AlertCircle, Check, Gift, Calendar, Trophy, Medal, Flame, Clock, Sparkles, Crown, ChevronDown, ChevronUp } from 'lucide-react';
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
  
  const [ranking, setRanking] = useState<any[]>([]); 
  const [globalRanking, setGlobalRanking] = useState<any[]>([]); 
  
  const [compradorInfo, setCompradorInfo] = useState({ nome: '', telefone: '' });
  const [pagamentoStatus, setPagamentoStatus] = useState<'idle' | 'loading'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // --- NOVO ESTADO: Controle de visualização do histórico ---
  const [mostrarTodasEncerradas, setMostrarTodasEncerradas] = useState(false);

  const formatarReal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

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
    fetch(`${API_URL}/api/rifas`)
      .then(r => r.json())
      .then((data: Rifa[]) => {
        const rifasOrdenadas = data.sort((a, b) => {
          const aEncerrada = a.vencedor_numero !== null && a.vencedor_numero !== undefined;
          const bEncerrada = b.vencedor_numero !== null && b.vencedor_numero !== undefined;
          if (aEncerrada && !bEncerrada) return 1;
          if (!aEncerrada && bEncerrada) return -1;
          return b.id - a.id;
        });
        setRifas(rifasOrdenadas);
      })
      .catch(err => { 
        console.error(err); 
        setErrorMsg("Não foi possível carregar as rifas no momento."); 
      }); 
      
    fetch(`${API_URL}/api/ranking-global`)
      .then(r => r.json())
      .then(setGlobalRanking)
      .catch(err => console.log("Sem dados de ranking global", err));
  }, []);

  useEffect(() => { 
    if (selectedRifa) {
      fetch(`${API_URL}/api/rifas/${selectedRifa.id}/numeros`)
        .then(r => r.json())
        .then(setNumerosOcupados);
        
      fetch(`${API_URL}/api/rifas/${selectedRifa.id}/ranking`)
        .then(r => r.json())
        .then(setRanking)
        .catch(() => setRanking([]));
    }
  }, [selectedRifa]);

  const toggleNumber = (num: number) => {
    if (selectedRifa?.vencedor_numero !== null && selectedRifa?.vencedor_numero !== undefined) return;
    if (selectedNumbers.includes(num)) setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    else setSelectedNumbers([...selectedNumbers, num]);
  };

  const handlePagar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientUser) { onRedirectLogin(); return; }
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
        
        if (res.status === 409) throw new Error(data.message); 

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

  const renderGrid = () => {
    if (!selectedRifa) return null;
    const grid: JSX.Element[] = [];
    const isSorteada = selectedRifa.vencedor_numero !== null && selectedRifa.vencedor_numero !== undefined;
    
    for (let i = 1; i <= selectedRifa.total_numeros; i++) {
        const ocupado = numerosOcupados.find(n => n.numero === i);
        const isSelected = selectedNumbers.includes(i);
        
        let baseClass = "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border shadow-sm";
        let statusClass = "bg-white hover:bg-pink-50 hover:border-pink-300 cursor-pointer border-gray-200 text-gray-600";
        
        if (isSorteada) {
            if (ocupado && ocupado.status === 'Pago') {
                statusClass = i === selectedRifa.vencedor_numero 
                    ? "bg-yellow-400 text-yellow-900 border-yellow-500 ring-2 ring-yellow-400 ring-offset-2 scale-110 shadow-lg cursor-default z-10" 
                    : "bg-gray-100 text-gray-400 border-transparent cursor-default";
            } else {
                statusClass = "bg-white text-gray-300 border-gray-100 cursor-default opacity-50";
            }
        } else {
            if (ocupado) {
              statusClass = ocupado.status === 'Pago' 
                ? "bg-gray-100 text-gray-300 cursor-not-allowed border-transparent" 
                : "bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed";
            } else if (isSelected) {
              statusClass = "bg-pink-600 text-white border-pink-600 transform scale-110 shadow-md ring-2 ring-pink-200";
            }
        }
        
        grid.push(
          <div key={i} onClick={() => !ocupado && toggleNumber(i)} className={`${baseClass} ${statusClass}`}>
            {ocupado && ocupado.status === 'Pago' ? (isSorteada && i === selectedRifa.vencedor_numero ? <Trophy size={16}/> : <Check size={16}/>) : i}
          </div>
        );
    }
    return grid;
  };

  if (errorMsg) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-red-100 max-w-md w-full">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
        <h3 className="text-2xl font-black text-gray-800 mb-2">Erro de Conexão</h3>
        <p className="text-gray-500 font-medium mb-6">{errorMsg}</p>
        <Button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white rounded-xl py-4 shadow-lg">Tentar Novamente</Button>
      </div>
    </div>
  );

  // --- FILTRO INTELIGENTE DE EXIBIÇÃO (MINIMIZAÇÃO DE RIFAS ANTIGAS) ---
  const rifasAbertas = rifas.filter(r => r.vencedor_numero === null || r.vencedor_numero === undefined);
  const rifasEncerradas = rifas.filter(r => r.vencedor_numero !== null && r.vencedor_numero !== undefined);
  
  // Se tiver 5 ou mais encerradas, mostramos apenas 5 por padrão (para dar Prova Social) e escondemos o resto
  const limiteEncerradas = rifasEncerradas.length >= 5 ? 5 : rifasEncerradas.length;
  
  const rifasVisiveis = [
    ...rifasAbertas,
    ...(mostrarTodasEncerradas ? rifasEncerradas : rifasEncerradas.slice(0, limiteEncerradas))
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-8 md:py-12 px-4 animate-fade-in">
      
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-block p-3 md:p-4 rounded-3xl bg-pink-100 mb-4 md:mb-6 shadow-inner shadow-pink-200">
          <Gift className="w-8 h-8 md:w-10 md:h-10 text-pink-600" />
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-3 md:mb-4 tracking-tighter">
          Sorteios e Eventos
        </h2>
        <p className="text-gray-500 text-base md:text-xl font-medium max-w-2xl mx-auto px-2">
          Escolha seus números da sorte e concorra a produtos especiais e exclusivos.
        </p>
      </div>

      {globalRanking.length > 0 && (
        <div className="container mx-auto max-w-4xl mb-12 md:mb-16 animate-fade-in-down">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-600 rounded-[2rem] md:rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="bg-white/95 backdrop-blur-md rounded-[1.8rem] md:rounded-[2.2rem] p-6 md:p-10 relative z-10 border border-white/50">
                <div className="text-center mb-6 md:mb-8">
                  <h3 className="text-xl md:text-3xl font-black text-gray-900 flex flex-wrap items-center justify-center gap-2 md:gap-3 tracking-tight">
                    <Crown className="text-yellow-500 w-6 h-6 md:w-10 md:h-10 drop-shadow-md" />
                    Top Clientes de <span className="capitalize text-pink-600">{mesAtual}</span>
                  </h3>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                  {globalRanking.map((user, idx) => (
                    <div key={idx} className="w-full md:w-auto bg-gray-50 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm md:hover:-translate-y-2 transition-all flex-1">
                        <div className="flex items-center gap-3 md:flex-col">
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-white text-lg md:text-2xl md:mb-2 shadow-lg
                             ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-yellow-200 md:scale-110 ring-2 md:ring-4 ring-yellow-100' : 
                               idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 
                               'bg-gradient-to-br from-orange-300 to-orange-500'}`}>
                             {idx + 1}º
                          </div>
                          <span className="font-black text-gray-800 text-lg md:text-xl tracking-tight text-left md:text-center">
                            {user.comprador_nome.split(' ')[0]} {user.comprador_nome.split(' ').length > 1 ? user.comprador_nome.split(' ')[1].charAt(0) + '.' : ''}
                          </span>
                        </div>
                        <div className="bg-pink-100 text-pink-700 px-3 md:px-4 py-1.5 rounded-xl font-bold text-xs md:text-sm border border-pink-200 whitespace-nowrap">
                           {user.total_numeros} cotas
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {/* Mapeando as rifas VISÍVEIS de forma inteligente */}
          {rifasVisiveis.map(rifa => {
            const porcentagem = Math.min((rifa.numeros_vendidos / rifa.total_numeros) * 100, 100);
            const isSorteada = rifa.vencedor_numero !== null && rifa.vencedor_numero !== undefined;

            const renderBadge = () => {
              if (isSorteada) return <div className="absolute top-4 left-4 bg-gradient-to-r from-gray-900 to-gray-800 text-yellow-400 border border-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black shadow-xl flex items-center gap-1.5 z-20 tracking-widest uppercase"><Trophy size={14}/> Sorteio Realizado</div>;
              if (porcentagem >= 100) return <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black shadow-lg flex items-center gap-1.5 z-20 tracking-widest uppercase"><Clock size={14} className="animate-spin-slow" /> Aguardando</div>;
              if (porcentagem >= 80) return <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black shadow-lg flex items-center gap-1.5 z-20 tracking-widest uppercase"><Flame size={14} className="animate-pulse" /> Últimos Números!</div>;
              return null; 
            };

            return (
              <Card key={rifa.id} className="group hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border-0 rounded-[2rem] overflow-hidden flex flex-col relative bg-white">
                 {renderBadge()}
                 <div className="relative h-56 md:h-64 overflow-hidden bg-gray-100">
                    <img src={rifa.imagem_url || "https://placehold.co/600x400/pink/white?text=Premio"} alt={rifa.nome_premio} className={`w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-700 ${isSorteada ? 'grayscale-[0.4] opacity-90' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
                    {isSorteada && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/90 text-green-700 px-5 py-2 rounded-xl font-black flex items-center gap-2 shadow-2xl transform -rotate-6 border border-green-200">
                          <Trophy size={20} /> ENCERRADA
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-base md:text-lg font-black shadow-lg text-gray-900 flex items-center gap-2 z-10 border border-white/40">
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apenas</span> 
                      {formatarReal(Number(rifa.valor_numero))}
                    </div>
                 </div>
                 
                 <div className="p-6 md:p-8 flex flex-col flex-grow relative">
                    <h3 className="font-black text-xl md:text-2xl text-gray-900 mb-3 line-clamp-2 leading-tight">{rifa.nome_premio}</h3>
                    
                    {isSorteada ? (
                      <div className="mb-6 p-3 md:p-4 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center">
                        <div className="text-green-800 font-bold text-xs md:text-sm">Número Ganhador:</div>
                        <span className="text-2xl md:text-3xl font-black text-green-600 bg-white px-3 py-1 rounded-xl shadow-sm">#{rifa.vencedor_numero}</span>
                      </div>
                    ) : (
                      <div className="mb-6 md:mb-8">
                        <div className="flex justify-between text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                          <span>Progresso</span>
                          <span className={porcentagem >= 80 ? 'text-pink-600' : ''}>{Math.round(porcentagem)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 relative ${porcentagem >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-pink-500 to-purple-600'}`} style={{width: `${porcentagem}%`}}></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button onClick={() => {setSelectedRifa(rifa); setSelectedNumbers([]);}} className={`w-full flex items-center justify-center gap-2 py-3 md:py-4 text-sm md:text-base font-bold shadow-lg rounded-xl ${isSorteada ? 'bg-gray-800 text-white' : 'bg-gray-900 hover:bg-pink-600 text-white'}`}>
                        {isSorteada ? <><Trophy size={18}/> Ver Resultado</> : <><Ticket size={18}/> Escolher Números</>}
                      </Button>
                    </div>
                 </div>
              </Card>
            );
          })}
        </div>

        {/* BOTÃO DE EXPANDIR (Aparece apenas se tiver 5 ou mais rifas encerradas) */}
        {rifasEncerradas.length >= 5 && (
          <div className="mt-12 flex justify-center animate-fade-in">
            <button 
              onClick={() => setMostrarTodasEncerradas(!mostrarTodasEncerradas)}
              className="bg-white border-2 border-pink-100 text-pink-600 hover:bg-pink-50 hover:border-pink-300 px-8 py-3.5 rounded-full font-black text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95"
            >
              {mostrarTodasEncerradas ? (
                <><ChevronUp size={18}/> Ocultar sorteios antigos</>
              ) : (
                <><ChevronDown size={18}/> Ver histórico completo ({rifasEncerradas.length} sorteios)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MODAL OTIMIZADO PARA MOBILE (FULL SCREEN) */}
      {selectedRifa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4">
            <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" onClick={() => setSelectedRifa(null)}></div>

            <div className="relative bg-white md:rounded-[2.5rem] shadow-2xl max-w-5xl w-full h-[100dvh] md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                
                <div className="bg-gradient-to-r from-pink-600 to-purple-700 text-white p-5 md:p-8 flex justify-between items-center z-10 relative">
                    <div className="relative z-10 pr-4">
                      <h3 className="font-black text-lg md:text-3xl tracking-tight leading-tight line-clamp-2">{selectedRifa.nome_premio}</h3>
                      <p className="text-pink-100 text-xs md:text-sm mt-1 font-medium">
                        {selectedRifa.vencedor_numero !== null ? 'Sorteio Finalizado.' : 'Toque nos números para selecionar'}
                      </p>
                    </div>
                    <button onClick={() => setSelectedRifa(null)} className="relative z-10 bg-white/20 p-2.5 md:p-3 rounded-xl md:rounded-full flex-shrink-0 active:scale-90 transition-transform">
                      <X size={24}/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50 pb-[240px] md:pb-10 custom-scrollbar">
                      
                      <div className="flex flex-wrap gap-2.5 md:gap-4 justify-center">
                        {renderGrid()}
                      </div>

                      {ranking.length > 0 && (
                        <div className="max-w-md mx-auto mt-8 mb-4 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                            <Trophy size={24} className="text-yellow-500" />
                            <h4 className="font-black text-gray-800 text-lg md:text-2xl">Top 3 Compradores</h4>
                          </div>
                          <div className="space-y-2.5">
                            {ranking.map((user, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-md text-base
                                       ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-orange-300 to-orange-500'}`}>
                                       {idx + 1}º
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm md:text-base">
                                      {user.comprador_nome.split(' ')[0]} {user.comprador_nome.split(' ').length > 1 ? user.comprador_nome.split(' ')[1].charAt(0) + '.' : ''}
                                    </span>
                                 </div>
                                 <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg font-black text-xs border border-pink-200">
                                    {user.total_numeros} cotas
                                 </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="absolute md:static bottom-0 left-0 w-full md:w-[400px] bg-white border-t md:border-l md:border-t-0 border-gray-200 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] md:shadow-2xl z-30 flex flex-col">
                        {selectedRifa.vencedor_numero !== null && selectedRifa.vencedor_numero !== undefined ? (
                            <div className="p-6 md:p-8 bg-gray-50 flex flex-col items-center justify-center text-center h-full">
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4"><Trophy className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" /></div>
                                <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-4">Sorteio Encerrado</h4>
                                <div className="bg-white border-2 border-green-100 p-6 rounded-3xl shadow-xl w-full">
                                    <p className="text-[10px] md:text-xs font-black text-green-800 uppercase tracking-widest mb-2">Número Ganhador</p>
                                    <span className="text-5xl md:text-6xl font-black text-green-500">#{selectedRifa.vencedor_numero}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 md:p-8 flex-1 flex flex-col">
                                <div className="hidden md:flex border-b border-gray-100 pb-6 mb-6">
                                   <h4 className="font-black text-gray-900 flex items-center gap-3 text-xl">
                                     <div className="p-2 bg-pink-50 rounded-xl"><ShoppingBag size={24} className="text-pink-600"/></div> Seu Carrinho
                                   </h4>
                                </div>

                                {selectedNumbers.length > 0 ? (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex justify-between items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                          <div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total a pagar</span>
                                            <span className="text-sm font-bold text-gray-600">{selectedNumbers.length} cota(s)</span>
                                          </div>
                                          <span className="text-3xl md:text-4xl font-black text-green-600 tracking-tighter">{formatarReal(selectedNumbers.length * selectedRifa.valor_numero)}</span>
                                        </div>

                                        <form onSubmit={handlePagar} className="space-y-3">
                                            {!clientUser && (
                                              <div className="bg-yellow-50 text-yellow-800 p-3 text-xs rounded-xl border border-yellow-200 flex gap-2">
                                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-600"/>
                                                <span className="font-medium">Faça login para finalizar a compra.</span>
                                              </div>
                                            )}

                                            <Button type="submit" className="w-full py-4 md:py-5 text-lg md:text-xl font-black bg-green-500 hover:bg-green-600 shadow-xl shadow-green-200 rounded-[1.25rem]" disabled={pagamentoStatus === 'loading'}>
                                              {pagamentoStatus === 'loading' ? 'Processando...' : (clientUser ? 'Pagar com PIX' : 'Fazer Login')}
                                            </Button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="h-[120px] md:h-full flex flex-col items-center justify-center text-gray-300">
                                      <p className="font-bold text-gray-400">Carrinho Vazio</p>
                                      <p className="text-xs mt-1">Selecione os números acima.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}