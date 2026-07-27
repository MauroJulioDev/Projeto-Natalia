import React, { useState, useEffect } from 'react';
import {
  Lock, LogOut, UserPlus, ShoppingBag, GraduationCap, MessageCircle, User, Key,
  ChevronRight, LayoutDashboard, Search, AlertCircle, Download, Plus, Edit, Trash2, X, Save, Upload, Image as ImageIcon,
  Trophy, Medal, Loader2, Sparkles, CheckCircle, Crown,
} from 'lucide-react';
import { Card, Button } from '../components/UI';
import toast from 'react-hot-toast';

interface AdminProps { logout: () => void; }

const API_URL = (import.meta as any).env.VITE_API_URL || 'https://nataliaemiliatupper.cloud';

// ==========================================
// COMPONENTE DE LOGIN DO ADMIN
// ==========================================
export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, senha: pass })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Login realizado com sucesso! Bem-vinda.');
        onLogin();
      } else {
        toast.error(data.message || 'Credenciais incorretas.');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative z-10 border-0">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-pink-200 rotate-6">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Área de Gestão</h2>
          <p className="text-gray-400 font-medium">Acesso Restrito</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            required
            className="w-full p-5 bg-gray-50 text-gray-900 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-bold"
            placeholder="E-mail Admin"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            required
            type="password"
            className="w-full p-5 bg-gray-50 text-gray-900 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-bold"
            placeholder="Senha"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-pink-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-pink-700 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'ENTRAR NO SISTEMA'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function Admin({ logout }: AdminProps) {
  // Estados de Controle Geral
  const [activeTab, setActiveTab] = useState<'consultoras' | 'rifas' | 'mentoria'>('consultoras');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Rifa Modal
  const [isRifaModalOpen, setIsRifaModalOpen] = useState(false);
  const [editingRifa, setEditingRifa] = useState<any | null>(null);
  const [rifaForm, setRifaForm] = useState({
    nome_premio: '',
    total_numeros: '100',
    valor_numero: '10',
    imagem_url: ''
  });
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error' | 'warning'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Estados do Ranking no Admin
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [rifaParaRanking, setRifaParaRanking] = useState<any | null>(null);

  // Estados do Sorteio
  const [showSorteioModal, setShowSorteioModal] = useState(false);
  const [rifaParaSortear, setRifaParaSortear] = useState<any | null>(null);
  const [sorteando, setSorteando] = useState(false);
  const [resultadoSorteio, setResultadoSorteio] = useState<{ numero: number; ganhador: string; premio: string } | null>(null);

  const handleVerRanking = async (rifa: any) => {
    setRifaParaRanking(rifa);
    setShowRankingModal(true);
    try {
      const res = await fetch(`${API_URL}/api/rifas/${rifa.id}/ranking`);
      const data = await res.json();
      setRankingData(data);
    } catch(e) { toast.error("Erro ao carregar ranking"); }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/${activeTab}`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error('Sessão expirada');
      }
      const data = await res.json();
      setData(data);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      if (error.message === 'Sessão expirada') {
        handleLogout();
      }
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    logout();
  };

  // ==========================================
  // FUNÇÃO DE UPLOAD DE IMAGEM COM VALIDAÇÃO
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    // 🔥 VALIDAÇÃO DE FORMATO
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!formatosPermitidos.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, GIF ou WEBP.');
      setUploadStatus({
        type: 'error',
        message: `Formato ${file.type} não é suportado. Use JPG, PNG, GIF ou WEBP.`
      });
      e.target.value = '';
      return;
    }

    // 🔥 VALIDAÇÃO DE TAMANHO (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 50MB.');
      setUploadStatus({
        type: 'error',
        message: `Arquivo ${file.name} tem ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 50MB.`
      });
      e.target.value = '';
      return;
    }

    setUploadStatus({ type: 'loading', message: 'Carregando imagem...' });

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setRifaForm({ ...rifaForm, imagem_url: base64 });
      setImagemPreview(base64); // 🔥 SALVA O PREVIEW
      setUploadStatus({ type: 'success', message: `Imagem ${file.name} carregada!` });
      setTimeout(() => setUploadStatus({ type: 'idle', message: '' }), 3000);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler a imagem.');
      setUploadStatus({ type: 'error', message: 'Erro ao ler o arquivo.' });
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // FUNÇÃO PARA SALVAR RIFA
  // ==========================================
  const handleSaveRifa = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 VALIDAÇÃO DO VALOR TOTAL
    const total = Number(rifaForm.valor_numero) * Number(rifaForm.total_numeros);
    if (total <= 1) {
      toast.error('O valor total da rifa (valor do número × total de números) deve ser maior que R$ 1,00');
      setUploadStatus({ type: 'error', message: 'Valor total deve ser maior que R$ 1,00' });
      return;
    }

    // 🔥 VALIDAÇÃO DA IMAGEM (se for base64 e for muito grande)
    let imagemUrl = rifaForm.imagem_url;
    if (imagemUrl && imagemUrl.startsWith('data:image')) {
      // Se a imagem for muito grande, pode substituir por placeholder ou manter
      // Aqui mantemos a imagem, pois já validamos o tamanho
    }

    setUploadStatus({ type: 'loading', message: 'Salvando rifa...' });

    const method = editingRifa ? 'PUT' : 'POST';
    const url = editingRifa ? `${API_URL}/api/rifas/${editingRifa.id}` : `${API_URL}/api/rifas`;

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...rifaForm,
          total_numeros: Number(rifaForm.total_numeros),
          valor_numero: Number(rifaForm.valor_numero),
          imagem_url: imagemUrl || ''
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingRifa ? "Rifa atualizada!" : "Rifa criada com sucesso!");
        setUploadStatus({ type: 'success', message: data.message || 'Rifa salva!' });
        setIsRifaModalOpen(false);
        setImagemPreview(null);
        setRifaForm({ nome_premio: '', total_numeros: '100', valor_numero: '10', imagem_url: '' });
        fetchData();
      } else {
        toast.error(data.error || "Erro ao salvar rifa. Verifique sua permissão.");
        setUploadStatus({ type: 'error', message: data.error || 'Erro desconhecido' });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro de conexão ao salvar rifa.");
      setUploadStatus({ type: 'error', message: 'Erro de conexão com o servidor' });
    }
  };

  // ==========================================
  // FUNÇÃO PARA ABRIR MODAL DE EDIÇÃO
  // ==========================================
  const openRifaModal = (rifa?: any) => {
    if (rifa) {
      setEditingRifa(rifa);
      setRifaForm({
        nome_premio: rifa.nome_premio,
        total_numeros: String(rifa.total_numeros),
        valor_numero: String(rifa.valor_numero),
        imagem_url: rifa.imagem_url || ''
      });
      setImagemPreview(rifa.imagem_url && rifa.imagem_url.startsWith('data:') ? rifa.imagem_url : null);
    } else {
      setEditingRifa(null);
      setRifaForm({ nome_premio: '', total_numeros: '100', valor_numero: '10', imagem_url: '' });
      setImagemPreview(null);
    }
    setIsRifaModalOpen(true);
  };

  // ==========================================
  // FUNÇÃO PARA EXCLUIR RIFA
  // ==========================================
  const handleDeleteRifa = async (id: number) => {
    if (!window.confirm("Excluir esta rifa permanentemente?")) return;
    try {
      const res = await fetch(`${API_URL}/api/rifas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success("Rifa excluída do sistema.");
        fetchData();
      } else {
        toast.error("Erro ao excluir. Verifique sua permissão.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
  };

  // ==========================================
  // FUNÇÃO PARA REALIZAR SORTEIO
  // ==========================================
  const handleRealizarSorteio = async () => {
    if (!rifaParaSortear) return;
    setSorteando(true);
    try {
      const res = await fetch(`${API_URL}/api/rifas/${rifaParaSortear.id}/sortear`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Sorteio realizado com sucesso!');
        setResultadoSorteio({
          numero: data.numero,
          ganhador: data.ganhador,
          premio: rifaParaSortear.nome_premio
        });
        setShowSorteioModal(false);
        fetchData();
      } else {
        toast.error(data.message || 'Erro ao realizar sorteio.');
      }
    } catch (error) {
      toast.error('Erro de conexão com o servidor.');
    } finally {
      setSorteando(false);
      setRifaParaSortear(null);
    }
  };

  // ==========================================
  // FUNÇÃO PARA ABRIR MODAL DE SORTEIO
  // ==========================================
  const openSorteioModal = (rifa: any) => {
    setRifaParaSortear(rifa);
    setShowSorteioModal(true);
  };

  // ==========================================
  // FUNÇÃO PARA ENVIAR MENSAGEM PARA O CLIENTE
  // ==========================================
  const handleContatoWhatsApp = (telefone: string, nome: string) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const saudacoes = ["Oi", "Olá", "Tudo bem?", "Oie"];
    const saudacao = saudacoes[Math.floor(Math.random() * saudacoes.length)];
    const codigo = Math.floor(Math.random() * 999);
    const mensagem = `${saudacao}${nome ? ` ${nome.split(' ')[0]},` : ','} sou a Natália! Tudo certo por aí? (Atendimento #${codigo})`;
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // ==========================================
  // RENDERIZAÇÃO DAS LINHAS DA TABELA
  // ==========================================
  const renderRow = (item: any) => {
    const baseClass = "p-4 text-sm text-gray-700 align-middle border-b border-gray-50";

    if (activeTab === 'consultoras') {
      return (
        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
          <td className={baseClass}>
            <div className="font-bold text-gray-900">{item.nome}</div>
            <div className="text-xs text-gray-400">{item.email}</div>
          </td>
          <td className={baseClass}>{item.telefone}</td>
          <td className={baseClass}>{item.cidade || '-'}</td>
          <td className={`${baseClass} text-center`}>
            <button
              onClick={() => handleContatoWhatsApp(item.telefone, item.nome)}
              className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors"
            >
              <MessageCircle size={16} />
            </button>
          </td>
        </tr>
      );
    }

    if (activeTab === 'rifas') {
      const porcentagem = item.total_numeros ? Math.min(Math.round(item.numeros_vendidos / item.total_numeros * 100), 100) : 0;
      const isSorteada = item.vencedor_numero !== null;

      return (
        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
          <td className={baseClass}>
            <div className="font-bold text-gray-900">{item.nome_premio}</div>
            <div className="text-[10px] text-pink-500 font-bold tracking-widest">ID: {item.id}</div>
          </td>
          <td className={baseClass}>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${porcentagem >= 100 ? 'bg-green-500' : 'bg-pink-500'}`}
                  style={{ width: `${porcentagem}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500">{porcentagem}%</span>
            </div>
          </td>
          <td className={baseClass}>
            {isSorteada ? (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 font-bold text-xs">
                <Trophy size={14} /> Ganhador: #{item.vencedor_numero}
              </div>
            ) : porcentagem >= 100 ? (
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-black text-[10px] animate-pulse">
                <Sparkles size={12} /> PRONTA PARA SORTEIO
              </span>
            ) : (
              <span className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Em andamento</span>
            )}
          </td>
          <td className={`${baseClass} text-center`}>
            <div className="flex justify-center gap-2">
              {!isSorteada && porcentagem >= 100 && (
                <button
                  onClick={() => openSorteioModal(item)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 transition-all transform hover:scale-105"
                >
                  <Trophy size={14} /> Sortear
                </button>
              )}
              <button
                onClick={() => handleVerRanking(item)}
                title="Ver Top Compradores"
                className="text-yellow-600 hover:bg-yellow-50 p-2 rounded-lg transition-colors"
              >
                <Medal size={16} />
              </button>
              <button
                onClick={() => openRifaModal(item)}
                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteRifa(item.id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (activeTab === 'mentoria') {
      return (
        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
          <td className={baseClass}>
            <div className="font-bold text-gray-900">{item.nome}</div>
          </td>
          <td className={baseClass}>
            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{item.nivel}</span>
          </td>
          <td className={baseClass}>{new Date(item.data_interesse).toLocaleDateString()}</td>
          <td className={`${baseClass} text-center`}>
            <button
              onClick={() => handleContatoWhatsApp(item.telefone, item.nome)}
              className="text-green-600 hover:text-green-800"
            >
              <MessageCircle size={18} />
            </button>
          </td>
        </tr>
      );
    }

    return null;
  };

  // ==========================================
  // FILTRO DE DADOS
  // ==========================================
  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.nome || item.nome_premio || '').toLowerCase().includes(term);
  });

  // ==========================================
  // RENDERIZAÇÃO DOS CABEÇALHOS DA TABELA
  // ==========================================
  const renderTableHeaders = () => {
    switch (activeTab) {
      case 'consultoras':
        return (
          <tr>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Consultora</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">WhatsApp</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Cidade/UF</th>
            <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black text-gray-400">Ações</th>
          </tr>
        );
      case 'rifas':
        return (
          <tr>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Prêmio / ID</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Progresso Vendas</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Status / Vencedor</th>
            <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black text-gray-400">Gerenciar</th>
          </tr>
        );
      case 'mentoria':
        return (
          <tr>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Interessada</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Nível</th>
            <th className="p-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Data</th>
            <th className="p-4 text-center text-[10px] uppercase tracking-widest font-black text-gray-400">Contato</th>
          </tr>
        );
      default:
        return null;
    }
  };

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-pink-600 p-2 rounded-xl text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="font-bold text-gray-800 hidden sm:block">Painel Natália Tupperware</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tabs e Ações */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab('consultoras')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'consultoras' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Consultoras
            </button>
            <button
              onClick={() => setActiveTab('rifas')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'rifas' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Rifas
            </button>
            <button
              onClick={() => setActiveTab('mentoria')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'mentoria' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Mentoria
            </button>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {activeTab === 'rifas' && (
              <Button
                onClick={() => openRifaModal()}
                className="flex items-center gap-2 bg-gray-900 hover:bg-pink-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> Nova Rifa
              </Button>
            )}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-pink-600 mb-2" size={40} />
              <p className="text-gray-400 font-medium">Carregando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-black text-gray-400">
                  {renderTableHeaders()}
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.length > 0 ? (
                    filteredData.map(item => renderRow(item))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">
                        Nenhum resultado encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* MODAL DE RIFA (CRIAR/EDITAR) */}
      {isRifaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white relative z-10 animate-scale-in rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-gray-800 text-xl tracking-tight">
                {editingRifa ? 'Editar Rifa' : 'Lançar Nova Rifa'}
              </h3>
              <button
                onClick={() => {
                  setIsRifaModalOpen(false);
                  setImagemPreview(null);
                  setRifaForm({ nome_premio: '', total_numeros: '100', valor_numero: '10', imagem_url: '' });
                }}
                className="text-gray-400 hover:text-pink-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveRifa} className="p-8 space-y-6">
              {/* 🔥 CAIXA DE FEEDBACK */}
              {uploadStatus.type !== 'idle' && (
                <div className={`p-4 rounded-xl ${
                  uploadStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                  uploadStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                  uploadStatus.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {uploadStatus.type === 'loading' && <Loader2 className="animate-spin" size={20} />}
                    {uploadStatus.type === 'success' && <CheckCircle size={20} className="text-green-600" />}
                    {uploadStatus.type === 'error' && <AlertCircle size={20} className="text-red-600" />}
                    {uploadStatus.type === 'warning' && <AlertCircle size={20} className="text-yellow-600" />}
                    <span className="font-medium">{uploadStatus.message}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nome do Prêmio</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold"
                    value={rifaForm.nome_premio}
                    onChange={(e) => setRifaForm({ ...rifaForm, nome_premio: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Qtd Números</label>
                    <input
                      type="number"
                      required
                      className="w-full p-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold"
                      value={rifaForm.total_numeros}
                      onChange={(e) => setRifaForm({ ...rifaForm, total_numeros: e.target.value })}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full p-4 bg-gray-50 text-gray-900 border-0 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none font-bold"
                      value={rifaForm.valor_numero}
                      onChange={(e) => setRifaForm({ ...rifaForm, valor_numero: e.target.value })}
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Foto do Prêmio</label>
                  <div className="flex gap-2 items-start">
                    <input
                      className="flex-1 p-4 bg-gray-50 text-gray-900 border-0 rounded-2xl text-sm outline-none"
                      placeholder="Link da imagem ou selecione um arquivo..."
                      value={rifaForm.imagem_url.startsWith('data:') ? 'Imagem carregada' : rifaForm.imagem_url}
                      onChange={(e) => {
                        setRifaForm({ ...rifaForm, imagem_url: e.target.value });
                        setImagemPreview(null);
                      }}
                    />
                    <label className="bg-pink-50 text-pink-600 p-4 rounded-2xl cursor-pointer hover:bg-pink-100 transition-colors flex items-center gap-2">
                      <Upload size={20} />
                      <span className="text-sm font-bold hidden sm:inline">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {/* 🔥 PREVIEW DA IMAGEM */}
                  {imagemPreview && (
                    <div className="mt-4 relative">
                      <div className="relative inline-block">
                        <img
                          src={imagemPreview}
                          alt="Preview da imagem"
                          className="max-h-48 rounded-xl shadow-md border border-gray-200 object-contain"
                        />
                        <button
                          onClick={() => {
                            setImagemPreview(null);
                            setRifaForm({ ...rifaForm, imagem_url: '' });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Pré-visualização da imagem carregada.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsRifaModalOpen(false);
                    setImagemPreview(null);
                    setRifaForm({ nome_premio: '', total_numeros: '100', valor_numero: '10', imagem_url: '' });
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold shadow-lg bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={uploadStatus.type === 'loading'}
                >
                  {uploadStatus.type === 'loading' ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Salvar Rifa'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL DE SORTEIO */}
      {showSorteioModal && rifaParaSortear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border border-gray-100">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/20 rounded-full blur-2xl -ml-10 -mb-10" />
              <Trophy size={64} className="text-white mx-auto mb-4 drop-shadow-lg animate-bounce" />
              <h3 className="text-3xl font-black text-white drop-shadow-md tracking-tight">Realizar Sorteio</h3>
            </div>
            <div className="p-8 text-center bg-white">
              <p className="text-gray-500 font-medium mb-3 uppercase tracking-widest text-xs">Rifa Selecionada:</p>
              <p className="text-2xl font-black text-gray-800 mb-8 bg-gray-50 py-4 px-2 rounded-2xl border-2 border-dashed border-gray-200 line-clamp-2">
                {rifaParaSortear.nome_premio}
              </p>
              <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-2xl text-sm mb-8 flex items-start gap-3 text-left shadow-sm">
                <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={20} />
                <p>
                  <strong className="font-black">Ação Irreversível:</strong> O sistema escolherá um número aleatório entre os compradores. O vencedor não poderá ser alterado depois.
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowSorteioModal(false);
                    setRifaParaSortear(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none border-none py-4 font-bold rounded-xl"
                  disabled={sorteando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRealizarSorteio}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-200 border-none py-4 font-black rounded-xl transform transition hover:-translate-y-1"
                  disabled={sorteando}
                >
                  {sorteando ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Sortear Agora! 🏆'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO RANKING */}
      {showRankingModal && rifaParaRanking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border border-gray-100">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-center">
              <Medal size={48} className="text-white mx-auto mb-2 drop-shadow-lg" />
              <h3 className="text-2xl font-black text-white drop-shadow-md">Top Compradores</h3>
              <p className="text-yellow-100 text-sm mt-1">{rifaParaRanking.nome_premio}</p>
            </div>
            <div className="p-6 bg-gray-50">
              {rankingData.length > 0 ? (
                <div className="space-y-3">
                  {rankingData.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm ${
                          idx === 0 ? 'bg-yellow-400' :
                          idx === 1 ? 'bg-gray-400' :
                          'bg-orange-400'
                        }`}>
                          {idx + 1}º
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 block text-sm">{user.comprador_nome}</span>
                          <span className="text-xs text-pink-600 font-bold">{user.total_numeros} cotas compradas</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleContatoWhatsApp(user.comprador_telefone, user.comprador_nome)}
                        title={`Mensagem para ${user.comprador_nome}`}
                        className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4 font-medium">Nenhum número pago ainda.</p>
              )}
              <Button
                onClick={() => setShowRankingModal(false)}
                className="w-full mt-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl shadow-none"
              >
                Fechar Ranking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO RESULTADO DO SORTEIO */}
      {resultadoSorteio && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pink-950/60 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-sm bg-white relative z-10 animate-bounce-in rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(219,39,119,0.4)] border-0">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 p-10 text-center relative">
              <Trophy size={90} className="text-white mx-auto mb-4 drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)] animate-pulse" />
              <h3 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">TEMOS UM VENCEDOR!</h3>
            </div>
            <div className="p-10 text-center">
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-2">{resultadoSorteio.premio}</p>
              <div className="text-7xl font-black text-gray-900 mb-4 tracking-tighter">#{resultadoSorteio.numero}</div>
              <div className="bg-pink-50 py-3 px-6 rounded-2xl inline-block border border-pink-100">
                <p className="text-xs text-pink-400 font-bold uppercase mb-1">Ganhador(a)</p>
                <h4 className="text-xl font-black text-pink-700">{resultadoSorteio.ganhador}</h4>
              </div>
              <Button
                onClick={() => setResultadoSorteio(null)}
                className="mt-10 w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl"
              >
                FECHAR E COMEMORAR!
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}