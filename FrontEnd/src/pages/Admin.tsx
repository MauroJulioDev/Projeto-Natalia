import React, { useState, useEffect } from 'react';
import { 
  Lock, LogOut, UserPlus, ShoppingBag, GraduationCap, MessageCircle, User, Key, 
  ChevronRight, LayoutDashboard, Search, AlertCircle, Download, Plus, Edit, Trash2, X, Save, Upload, Image as ImageIcon
} from 'lucide-react';
import { Card, Button } from '../components/UI';

// Interfaces simplificadas para o exemplo
interface AdminProps { logout: () => void; }

// ============================================================================
// COMPONENTE: ADMIN DASHBOARD
// ============================================================================
export default function Admin({ logout }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'consultoras' | 'rifas' | 'mentoria'>('consultoras');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Gerenciamento de Rifas
  const [isRifaModalOpen, setIsRifaModalOpen] = useState(false);
  const [editingRifa, setEditingRifa] = useState<any | null>(null);
  
  const [rifaForm, setRifaForm] = useState({ 
    nome_premio: '', 
    total_numeros: '100', 
    valor_numero: '0', 
    imagem_url: '' 
  });

  // Busca dados na API
  const fetchData = () => {
    setLoading(true);
    fetch(`http://localhost:3001/api/${activeTab}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- FUNÇÕES UTILITÁRIAS ---

  const handleZap = (tel: string) => {
    if (!tel) return;
    window.open(`https://wa.me/55${tel.replace(/\D/g, '')}`, '_blank');
  };
  
  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // --- FUNÇÃO: EXPORTAR PARA EXCEL (Melhorada) ---
  const handleExportConsultoras = () => {
    if (data.length === 0) return alert("Não há dados para exportar.");

    // Definição das colunas
    const headers = ["ID", "Nome Completo", "Email", "WhatsApp", "Cidade/UF", "Data de Cadastro"];
    
    // Mapeamento seguro dos dados
    const rows = data.map(row => [
      row.id,
      row.nome,
      row.email,
      row.telefone || '',
      row.cidade || '',
      row.data_cadastro ? new Date(row.data_cadastro).toLocaleString('pt-BR') : '-'
    ]);

    // Função auxiliar para escapar campos CSV (trata aspas e vírgulas dentro do texto)
    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '""';
      const stringField = String(field);
      // Se contém aspas, vírgulas ou quebras de linha, escapa as aspas duplas e envolve o campo
      if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return `"${stringField}"`;
    };

    // Construção do conteúdo CSV com separador padrão (vírgula)
    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    // Criação do Blob com BOM (\uFEFF) para garantir que o Excel abra com acentos corretos (UTF-8)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Criação do link de download dinâmico
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dataAtual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    link.setAttribute("download", `Consultoras_Tupperware_${dataAtual}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FUNÇÕES: GERENCIAMENTO DE RIFAS ---

  const handleOpenRifaModal = (rifa?: any) => {
    if (rifa) {
      setEditingRifa(rifa);
      setRifaForm({
        nome_premio: rifa.nome_premio,
        total_numeros: String(rifa.total_numeros),
        valor_numero: String(rifa.valor_numero),
        imagem_url: rifa.imagem_url || ''
      });
    } else {
      setEditingRifa(null);
      setRifaForm({ nome_premio: '', total_numeros: '100', valor_numero: '10', imagem_url: '' });
    }
    setIsRifaModalOpen(true);
  };

  // Lógica para upload de imagem (Converte arquivo para Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRifaForm({ ...rifaForm, imagem_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteRifa = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta rifa?")) return;

    try {
      await fetch(`http://localhost:3001/api/rifas/${id}`, { method: 'DELETE' });
      setData(data.filter(item => item.id !== id));
    } catch (error) {
      alert("Erro ao excluir rifa.");
    }
  };

  const handleSaveRifa = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingRifa ? 'PUT' : 'POST';
    const url = editingRifa 
      ? `http://localhost:3001/api/rifas/${editingRifa.id}` 
      : `http://localhost:3001/api/rifas`;

    // Converte de volta para número ao salvar
    const payload = {
      ...rifaForm,
      total_numeros: Number(rifaForm.total_numeros),
      valor_numero: Number(rifaForm.valor_numero)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Erro ao salvar");
      
      setIsRifaModalOpen(false);
      fetchData(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao salvar rifa. Verifique a conexão com o servidor.");
    }
  };

  // --- FILTRAGEM E RENDERIZAÇÃO ---

  const filteredData = data.filter((item: any) => {
    const searchStr = searchTerm.toLowerCase();
    const name = (item.nome || item.nome_premio || '').toLowerCase();
    const phone = (item.telefone || '').toLowerCase();
    return name.includes(searchStr) || phone.includes(searchStr);
  });

  const renderTableHeaders = () => {
    switch(activeTab) {
      case 'consultoras':
        return <><th className="p-4 rounded-tl-lg">Nome</th><th className="p-4">WhatsApp</th><th className="p-4">Cidade/UF</th><th className="p-4">Data Cadastro</th><th className="p-4 rounded-tr-lg text-center">Ações</th></>;
      case 'rifas':
        return <><th className="p-4 rounded-tl-lg">Prêmio</th><th className="p-4">Progresso</th><th className="p-4">Valor Nº</th><th className="p-4">Status</th><th className="p-4 rounded-tr-lg text-center">Gerenciar</th></>;
      case 'mentoria':
        return <><th className="p-4 rounded-tl-lg">Interessada</th><th className="p-4">Nível</th><th className="p-4">Dificuldade Principal</th><th className="p-4">Data</th><th className="p-4 rounded-tr-lg text-center">Contato</th></>;
    }
  };

  const renderTableRows = (item: any) => {
    const rowClass = "border-b border-gray-100 hover:bg-gray-50 transition-colors";
    const cellClass = "p-4 text-sm text-gray-700 align-middle";

    switch(activeTab) {
      case 'consultoras':
        return (
          <tr key={item.id} className={rowClass}>
            <td className={cellClass}>
              <div className="font-bold text-gray-900">{item.nome}</div>
              <div className="text-xs text-gray-400">{item.email}</div>
            </td>
            <td className={cellClass}>{item.telefone || '-'}</td>
            <td className={cellClass}>{item.cidade || '-'}</td>
            <td className={cellClass}>{formatDate(item.data_cadastro)}</td>
            <td className={`${cellClass} text-center`}>
              <button 
                onClick={() => handleZap(item.telefone)} 
                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </td>
          </tr>
        );
      case 'rifas':
        const percent = item.total_numeros ? Math.round((item.numeros_vendidos / item.total_numeros) * 100) : 0;
        return (
          <tr key={item.id} className={rowClass}>
            <td className={cellClass}>
              <div className="font-bold text-gray-900">{item.nome_premio}</div>
            </td>
            <td className={cellClass}>
              <div className="w-full max-w-[120px]">
                <div className="flex justify-between text-xs mb-1">
                  <span>{item.numeros_vendidos}/{item.total_numeros}</span>
                  <span className="font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            </td>
            <td className={cellClass}>R$ {Number(item.valor_numero).toFixed(2)}</td>
            <td className={cellClass}>
              <span className={`px-2 py-1 rounded text-xs font-bold ${percent >= 100 ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                {percent >= 100 ? 'Finalizada' : 'Ativa'}
              </span>
            </td>
            <td className={`${cellClass} text-center`}>
              <div className="flex justify-center gap-2">
                <button 
                  onClick={() => handleOpenRifaModal(item)}
                  className="bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100 transition-colors"
                  title="Editar Rifa"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteRifa(item.id)}
                  className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100 transition-colors"
                  title="Excluir Rifa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        );
      case 'mentoria':
        return (
          <tr key={item.id} className={rowClass}>
            <td className={cellClass}>
              <div className="font-bold text-gray-900">{item.nome}</div>
              <div className="text-xs text-gray-400">{item.telefone}</div>
            </td>
            <td className={cellClass}>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs border border-purple-100">
                {item.nivel}
              </span>
            </td>
            <td className={cellClass}>
              <div className="max-w-xs truncate text-gray-600" title={item.dificuldade}>
                {item.dificuldade}
              </div>
            </td>
            <td className={cellClass}>{formatDate(item.data_interesse)}</td>
            <td className={`${cellClass} text-center`}>
              <button 
                onClick={() => handleZap(item.telefone)} 
                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-colors"
              >
                <MessageCircle size={14} /> Chamar
              </button>
            </td>
          </tr>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-pink-600 p-2 rounded-lg text-white shadow-md">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight">Painel Administrativo</h1>
              <p className="text-xs text-gray-500">Mentora Tupperware</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={logout} 
            className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 text-sm py-2 px-4 flex items-center gap-2"
          >
            <LogOut size={16}/> <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* NAVEGAÇÃO E AÇÕES */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          
          {/* TABS */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setActiveTab('consultoras')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'consultoras' ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <UserPlus size={18} /> Consultoras
            </button>
            <button 
              onClick={() => setActiveTab('rifas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'rifas' ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ShoppingBag size={18} /> Rifas
            </button>
            <button 
              onClick={() => setActiveTab('mentoria')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'mentoria' ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <GraduationCap size={18} /> Mentoria
            </button>
          </div>

          {/* AÇÕES DA ABA (Exportar / Adicionar) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {activeTab === 'consultoras' && (
              <Button onClick={handleExportConsultoras} variant="success" className="whitespace-nowrap flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700">
                <Download size={16} /> Exportar Excel
              </Button>
            )}
            
            {activeTab === 'rifas' && (
              <Button onClick={() => handleOpenRifaModal()} variant="primary" className="whitespace-nowrap flex items-center gap-2 text-sm">
                <Plus size={16} /> Nova Rifa
              </Button>
            )}

            {/* BARRA DE BUSCA */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TABELA DE DADOS */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-2"></div>
              <p className="text-sm">Carregando dados...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                    {renderTableHeaders()}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredData.map((item: any) => renderTableRows(item))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-500">Nenhum registro encontrado</p>
              <p className="text-sm">Tente mudar o termo de busca ou verifique a conexão.</p>
            </div>
          )}
        </Card>
      </main>

      {/* MODAL DE GERENCIAMENTO DE RIFAS */}
      {isRifaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsRifaModalOpen(false)}></div>
          <Card className="w-full max-w-lg bg-white relative z-10 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingRifa ? 'Editar Rifa' : 'Nova Rifa'}
              </h3>
              <button onClick={() => setIsRifaModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRifa} className="p-6 space-y-4">
              {/* Campo Nome do Prêmio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Prêmio</label>
                <input 
                  required
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                  placeholder="Ex: Kit Tupperware Premium"
                  value={rifaForm.nome_premio}
                  onChange={e => setRifaForm({...rifaForm, nome_premio: e.target.value})}
                />
              </div>

              {/* Campos Numéricos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total de Números</label>
                  <input 
                    required
                    type="number"
                    min="10"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                    value={rifaForm.total_numeros}
                    onChange={e => setRifaForm({...rifaForm, total_numeros: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Número (R$)</label>
                  <input 
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                    value={rifaForm.valor_numero}
                    onChange={e => setRifaForm({...rifaForm, valor_numero: e.target.value})}
                  />
                </div>
              </div>

              {/* Seção de Imagem (Upload + URL) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Imagem do Prêmio</label>
                
                {/* Preview da Imagem */}
                {rifaForm.imagem_url && (
                  <div className="mb-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                    <img 
                      src={rifaForm.imagem_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Erro+na+Imagem';
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => setRifaForm({...rifaForm, imagem_url: ''})}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Cole uma URL ou envie uma foto ->"
                    value={rifaForm.imagem_url.startsWith('data:') ? '(Imagem carregada do dispositivo)' : rifaForm.imagem_url}
                    onChange={e => setRifaForm({...rifaForm, imagem_url: e.target.value})}
                    disabled={rifaForm.imagem_url.startsWith('data:')}
                  />
                  
                  <label 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 cursor-pointer p-3 rounded-lg transition-colors flex items-center justify-center min-w-[3.5rem] relative" 
                    title="Enviar Foto do Celular/PC"
                  >
                    <Upload size={20} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <ImageIcon size={12}/> Suporta links da web ou fotos da galeria.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <Button type="button" variant="secondary" onClick={() => setIsRifaModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Save size={18} /> Salvar Rifa
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE: ADMIN LOGIN
// ============================================================================
export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-gray-900 to-gray-800 z-0"></div>
      
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-scale-in">
        <div className="bg-white p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-sm border border-pink-100">
              <Lock className="text-pink-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Acesso Restrito</h2>
            <p className="text-gray-500 text-sm mt-1">Digite suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input 
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900" 
                  placeholder="Seu usuário" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Key size={18} />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900" 
                  placeholder="Sua senha" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm animate-shake">
                <AlertCircle size={16} /> Usuário ou senha incorretos.
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 group"
            >
              Entrar no Sistema <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Área exclusiva para administradores da plataforma.<br/>
              Em caso de dúvidas, contate o suporte técnico.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}