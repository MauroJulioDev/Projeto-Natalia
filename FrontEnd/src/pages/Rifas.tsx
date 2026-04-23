import React, { useState, useEffect, FormEvent } from 'react';
import { Ticket, X, ShoppingBag, AlertCircle, Check, Gift, Calendar, Trophy, Medal } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Rifa, NumeroRifa, ClienteUser } from '../types';
import toast from 'react-hot-toast'; // <-- Injetor de Notificações Importado!

interface RifasProps {
  clientUser: ClienteUser | null;
  onRedirectLogin: () => void;
}

// Configuração do .env para a URL da API
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export default function Rifas({ clientUser, onRedirectLogin }: RifasProps) {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [selectedRifa, setSelectedRifa] = useState<Rifa | null>(null);
  const [numerosOcupados, setNumerosOcupados] = useState<NumeroRifa[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [compradorInfo, setCompradorInfo] = useState({ nome: '', telefone: '' });
  const [pagamentoStatus, setPagamentoStatus] = useState<'idle' | 'loading'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const formatarReal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

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
      .then(setRifas)
      .catch(err => { 
        console.error(err); 
        setErrorMsg("Não foi possível carregar as rifas no momento."); 
      }); 
  }, []);

  useEffect(() => { 
    if (selectedRifa) {
      fetch(`${API_URL}/api/rifas/${selectedRifa.id}/numeros`)
        .then(r => r.json())
        .then(setNumerosOcupados);
    }
  }, [selectedRifa]);

  const toggleNumber = (num: number) => {
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
    toast.loading("Processando reserva...", { id: 'pagamento' }); // Toast de carregamento
    
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
            clienteId: clientUser.id 
          }) 
        });
        toast.success("Pagamento Simulado com Sucesso!"); 
        // Aguarda 1.5s para a cliente ler a notificação antes de recarregar a tela
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
    
    for (let i = 1; i <= selectedRifa.total_numeros; i++) {
        const ocupado = numerosOcupados.find(n => n.numero === i);
        const isSelected = selectedNumbers.includes(i);
        
        let baseClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border shadow-sm";
        let statusClass = "bg-white hover:bg-pink-50 hover:border-pink-300 cursor-pointer border-gray-200 text-gray-600";
        
        if (ocupado) {
          statusClass = ocupado.status === 'Pago' 
            ? "bg-gray-100 text-gray-300 cursor-not-allowed border-transparent" 
            : "bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed";
        } else if (isSelected) {
          statusClass = "bg-pink-600 text-white border-pink-600 transform scale-110 shadow-md ring-2 ring-pink-200";
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erro de Conexão</h3>
        <p className="text-gray-600">{errorMsg}</p>
        <Button onClick={() => window.location.reload()} className="mt-6 w-full">Tentar Novamente</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 animate-fade-in">
      
      <div className="text-center mb-12">
        <div className="inline-block p-3 rounded-full bg-pink-100 mb-4">
          <Gift className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Rifas & Prêmios
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Escolha seus números da sorte e concorra a kits Tupperware exclusivos.
        </p>
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rifas.map(rifa => {
            const porcentagem = Math.min((rifa.numeros_vendidos / rifa.total_numeros) * 100, 100);
            const isSorteada = rifa.vencedor_numero !== null;

            return (
              <Card key={rifa.id} className={`group hover:shadow-2xl transition-all duration-300 border-t-4 ${isSorteada ? 'border-green-500' : 'border-pink-500'} overflow-hidden flex flex-col`}>
                 <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img 
                      src={rifa.imagem_url || "https://placehold.co/600x400/pink/white?text=Premio+Tupperware"} 
                      alt={rifa.nome_premio}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isSorteada ? 'grayscale-[0.5]' : ''}`} 
                    />
                    
                    {isSorteada && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-black flex items-center gap-2 shadow-xl transform -rotate-3 border-2 border-green-600">
                          <Trophy size={20} /> SORTEADA
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold shadow-lg text-pink-700 flex items-center gap-1">
                      {formatarReal(Number(rifa.valor_numero))}
                    </div>
                 </div>
                 
                 <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-1">{rifa.nome_premio}</h3>
                    
                    {isSorteada ? (
                      <div className="mb-6 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-bold text-sm mb-1">
                          <Medal size={16} /> Número Vencedor:
                        </div>
                        <span className="text-2xl font-black text-green-600">#{rifa.vencedor_numero}</span>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                          <span>{Math.round(porcentagem)}% vendido</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-1000" style={{width: `${porcentagem}%`}}></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button 
                        disabled={isSorteada}
                        onClick={() => {setSelectedRifa(rifa); setSelectedNumbers([]);}} 
                        className={`w-full transition-colors duration-300 flex items-center justify-center gap-2 py-3 shadow-md ${isSorteada ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-pink-600 text-white'}`}
                      >
                        {isSorteada ? 'Rifa Encerrada' : <><Ticket size={18}/> Escolher Números</>}
                      </Button>
                    </div>
                 </div>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedRifa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRifa(null)}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                
                <div className="bg-gradient-to-r from-pink-600 to-purple-700 text-white p-6 flex justify-between items-center z-10">
                    <div>
                      <h3 className="font-bold text-xl md:text-2xl">{selectedRifa.nome_premio}</h3>
                      <p className="text-pink-100 text-sm opacity-90">Escolha seus números abaixo</p>
                    </div>
                    <button onClick={() => setSelectedRifa(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                      <X size={24}/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
                      <div className="flex flex-wrap gap-3 justify-center pb-20">
                        {renderGrid()}
                      </div>
                    </div>

                    <div className="md:w-96 bg-white border-l border-gray-100 flex flex-col shadow-xl z-20">
                        <div className="p-6 border-b border-gray-100">
                           <h4 className="font-bold text-gray-800 flex items-center gap-2">
                             <ShoppingBag size={20} className="text-pink-600"/> Resumo do Pedido
                           </h4>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {selectedNumbers.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 border border-blue-100 animate-pulse">
                                      <Calendar size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                      <p className="text-[11px] text-blue-700 leading-tight">
                                        <strong>Reserva Temporária:</strong> Seus números ficarão reservados por 15 minutos. Conclua o pagamento para garantir sua vaga!
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-sm text-gray-500 mb-2 font-medium">Números selecionados:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedNumbers.map(n => (
                                          <span key={n} className="bg-pink-50 text-pink-700 px-2 py-1 rounded text-xs font-bold border border-pink-100">#{n}</span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="text-gray-600">Quantidade</span>
                                        <span className="font-semibold">{selectedNumbers.length}</span>
                                      </div>
                                      
                                      <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center text-lg font-bold text-pink-600">
                                        <span>Total</span>
                                        <span>{formatarReal(selectedNumbers.length * selectedRifa.valor_numero)}</span>
                                      </div>
                                    </div>

                                    <form onSubmit={handlePagar} className="space-y-4">
                                        {!clientUser && (
                                          <div className="bg-yellow-50 text-yellow-800 p-3 text-sm rounded-lg border border-yellow-200 flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>
                                            <span>Faça login para finalizar sua compra.</span>
                                          </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                          <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Nome Completo</label>
                                            <input required readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" value={compradorInfo.nome} />
                                          </div>
                                          <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">WhatsApp</label>
                                            <input required readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" value={compradorInfo.telefone} />
                                          </div>
                                        </div>

                                        <Button 
                                          type="submit" 
                                          className="w-full py-4 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg transition-all" 
                                          disabled={pagamentoStatus === 'loading'}
                                        >
                                          {pagamentoStatus === 'loading' ? 'Processando...' : (clientUser ? 'Finalizar Pagamento' : 'Fazer Login')}
                                        </Button>
                                    </form>
                                    
                                    <button onClick={handleSimular} className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
                                      (Modo Teste) Simular Pagamento Aprovado
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                  <Ticket size={48} className="mb-4 stroke-1"/>
                                  <p>Escolha seus números na cartela.</p>
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