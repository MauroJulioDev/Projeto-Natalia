import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, Menu, User, Lock, X } from 'lucide-react';
import { ClienteUser } from './types';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Home from './pages/Home';
import Rifas from './pages/Rifas';
import Cadastro from './pages/Cadastro';
import Mentoria from './pages/Mentoria';
import Admin, { AdminLogin } from './pages/Admin';
import MinhaConta from './pages/MinhaConta';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [clientUser, setClientUser] = useState<ClienteUser | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Recupera usuário salvo no navegador
  useEffect(() => {
    const storedUser = localStorage.getItem('tupperware_client_user');
    if (storedUser) setClientUser(JSON.parse(storedUser));
  }, []);

  const handleLogin = (user: ClienteUser) => {
    setClientUser(user);
    localStorage.setItem('tupperware_client_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setClientUser(null);
    localStorage.removeItem('tupperware_client_user');
  };

  // Função de compatibilidade
  const handleNavigation = (page: string) => {
    setMobileMenuOpen(false);
    switch(page) {
      case 'home': navigate('/'); break;
      case 'cadastro': navigate('/seja-consultora'); break;
      case 'rifas': navigate('/rifas'); break;
      case 'mentoria': navigate('/mentoria-vip'); break;
      case 'minha-conta': navigate('/minha-conta'); break;
      case 'admin': navigate('/admin'); break;
      default: navigate('/');
    }
  };

  // Componente de Link do Menu
  const NavLink = ({ to, label }: { to: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
          isActive 
            ? 'bg-pink-700 text-white shadow-md transform scale-105' 
            : 'text-pink-100 hover:text-white hover:bg-pink-500'
        }`}
      >
        {label}
      </Link>
    );
  };

  // --- ROTA DE ADMIN ---
  if (location.pathname === '/admin') {
    return isAdminLogged ? (
      <Admin logout={() => { setIsAdminLogged(false); navigate('/'); }} />
    ) : (
      <AdminLogin onLogin={() => setIsAdminLogged(true)} />
    );
  }

  // --- LAYOUT PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col text-gray-800">
      
      {/* NAVBAR */}
      <nav className="bg-pink-600 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white text-pink-600 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white ml-2">Mentora Tupperware</span>
          </Link>

          <div className="hidden md:flex gap-2 items-center">
            <NavLink to="/" label="Início" />
            <NavLink to="/seja-consultora" label="Seja Consultora" />
            <NavLink to="/rifas" label="Rifas" />
            <NavLink to="/mentoria-vip" label="Mentoria VIP" />
            
            <Link 
              to="/minha-conta" 
              className="ml-2 bg-white text-pink-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-pink-50 flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
                <User size={16}/> {clientUser ? clientUser.nome.split(' ')[0] : 'Minha Conta'}
            </Link>
          </div>

          <button 
            className="md:hidden text-white p-2 hover:bg-pink-700 rounded-lg transition-colors" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-pink-700 p-4 flex flex-col gap-2 shadow-inner border-t border-pink-500 animate-fade-in-down">
            <NavLink to="/" label="Início" />
            <NavLink to="/seja-consultora" label="Seja Consultora" />
            <NavLink to="/rifas" label="Rifas" />
            <NavLink to="/mentoria-vip" label="Mentoria VIP" />
            <div className="border-t border-pink-600 pt-2 mt-2">
              <NavLink to="/minha-conta" label={clientUser ? `Olá, ${clientUser.nome.split(' ')[0]}` : "Acessar Minha Conta"} />
            </div>
          </div>
        )}
      </nav>

      {/* CONTEÚDO (ROTAS) */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home changePage={handleNavigation} />} />
          <Route path="/seja-consultora" element={<Cadastro />} />
          <Route path="/rifas" element={<Rifas clientUser={clientUser} onRedirectLogin={() => navigate('/minha-conta')} />} />
          <Route path="/mentoria-vip" element={<Mentoria />} />
          <Route path="/minha-conta" element={
            <MinhaConta 
              user={clientUser} 
              onLogin={handleLogin} 
              onLogout={handleLogout} 
              redirectAfterLogin={() => navigate('/rifas')}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-10 border-t-4 border-pink-600 text-center text-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="opacity-80">&copy; {new Date().getFullYear()} Mentora Tupperware. Todos os direitos reservados.</p>
              
              <Link to="/admin" className="text-gray-600 hover:text-pink-500 transition-colors inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-800">
                <Lock size={14}/> Acesso Administrativo
              </Link>
            </div>
          </div>
      </footer>
    </div>
  );
}