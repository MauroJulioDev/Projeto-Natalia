import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, Menu, User, X } from 'lucide-react';
import { ClienteUser } from './types';
import toast, { Toaster } from 'react-hot-toast';
import Consultora from './pages/Consultora';
import Footer from './components/Footer';

// --- IMPORTAÇÃO DAS PÁGINAS ---
import Home from './pages/Home';
import Rifas from './pages/Rifas';
import Cadastro from './pages/Cadastro';
import Mentoria from './pages/Mentoria';
import Admin, { AdminLogin } from './pages/Admin';
import MinhaConta from './pages/MinhaConta';
import Faq from './pages/Faq';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [clientUser, setClientUser] = useState<ClienteUser | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- SISTEMA DE EXPIRAÇÃO POR INATIVIDADE (30 MINUTOS) ---
  const TEMPO_LIMITE_INATIVIDADE = 30 * 60 * 1000;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetarTempo = () => {
      clearTimeout(timeoutId);
      if (clientUser || isAdminLogged) {
        timeoutId = setTimeout(() => {
          setClientUser(null);
          localStorage.removeItem('tupperware_client_user');
          setIsAdminLogged(false);
          localStorage.removeItem('admin_token');
          toast.error("Sua sessão expirou por inatividade. Faça login novamente.", { duration: 5000 });
          navigate('/');
        }, TEMPO_LIMITE_INATIVIDADE);
      }
    };

    window.addEventListener('mousemove', resetarTempo);
    window.addEventListener('keydown', resetarTempo);
    window.addEventListener('click', resetarTempo);
    window.addEventListener('scroll', resetarTempo);
    resetarTempo();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetarTempo);
      window.removeEventListener('keydown', resetarTempo);
      window.removeEventListener('click', resetarTempo);
      window.removeEventListener('scroll', resetarTempo);
    };
  }, [clientUser, isAdminLogged, navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem('tupperware_client_user');
    if (storedUser) setClientUser(JSON.parse(storedUser));
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) setIsAdminLogged(true);
  }, []);

  const handleLogin = (user: ClienteUser) => {
    setClientUser(user);
    localStorage.setItem('tupperware_client_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setClientUser(null);
    localStorage.removeItem('tupperware_client_user');
  };

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

  // Componente de Link do Menu (Otimizado para toque)
  const NavLink = ({ to, label }: { to: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        className={`text-base md:text-sm font-medium px-5 py-3 md:py-2 rounded-xl md:rounded-full transition-all duration-200 active:scale-95 ${
          isActive 
            ? 'bg-pink-800 md:bg-pink-700 text-white shadow-md md:transform md:scale-105' 
            : 'text-pink-100 hover:text-white hover:bg-pink-500 bg-pink-700/50 md:bg-transparent'
        }`}
      >
        {label}
      </Link>
    );
  };

  // --- ROTA DE ADMIN ---
  if (location.pathname === '/admin') {
    return isAdminLogged ? (
      <Admin logout={() => { 
        setIsAdminLogged(false); 
        localStorage.removeItem('admin_token'); 
        navigate('/'); 
      }} />
    ) : (
      <AdminLogin onLogin={() => setIsAdminLogged(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col text-gray-800">
      
      <nav className="bg-pink-600 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 md:h-20 flex justify-between items-center relative">
          
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white text-pink-600 p-2 md:p-2.5 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag size={22} className="md:w-6 md:h-6" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white ml-1.5 md:ml-2">Nathy Tupper</span>
          </Link>

          <div className="hidden md:flex gap-2 items-center">
            <NavLink to="/" label="Início" />
            <NavLink to="/seja-consultora" label="Seja Consultora" />
            <NavLink to="/rifas" label="Sorteios" />
            <NavLink to="/mentoria-vip" label="Mentoria VIP" />
            <NavLink to="/faq" label="Dúvidas" />
            
            <Link 
              to="/minha-conta" 
              className="ml-4 bg-white text-pink-600 px-6 py-2.5 rounded-full font-black text-sm hover:bg-pink-50 flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
                <User size={18} strokeWidth={2.5}/> {clientUser ? clientUser.nome.split(' ')[0] : 'Minha Conta'}
            </Link>
          </div>

          <button 
            className="md:hidden text-white p-2.5 bg-pink-700 hover:bg-pink-800 rounded-xl transition-colors shadow-inner active:scale-95" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MENU MOBILE OTIMIZADO (PAINEL SUSPENSO ABSOLUTO) */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[100%] left-0 w-full bg-pink-600 border-t border-pink-500 shadow-2xl shadow-pink-900/50 animate-fade-in-down z-40 pb-6 rounded-b-[2rem]">
            <div className="p-4 flex flex-col gap-3">
              <NavLink to="/" label="Início" />
              <NavLink to="/seja-consultora" label="Seja Consultora" />
              <NavLink to="/rifas" label="Sorteios" />
              <NavLink to="/mentoria-vip" label="Mentoria VIP" />
              
              <div className="border-t border-pink-500/50 pt-4 mt-2">
                <Link 
                  to="/minha-conta" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-pink-700 w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
                >
                  <User size={24} strokeWidth={2.5}/> {clientUser ? `Olá, ${clientUser.nome.split(' ')[0]}` : "Acessar Minha Conta"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home changePage={handleNavigation} />} />
          <Route path="/seja-consultora" element={<Cadastro />} />
          <Route path="/rifas" element={<Rifas clientUser={clientUser} onRedirectLogin={() => navigate('/minha-conta')} />} />
          <Route path="/mentoria-vip" element={<Mentoria />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/minha-conta" element={
            <MinhaConta user={clientUser} onLogin={handleLogin} onLogout={handleLogout} redirectAfterLogin={() => navigate('/rifas')} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/consultora" element={<Consultora />} />
        </Routes>
      </main>

      <Toaster position="top-right" reverseOrder={false} />
      <Footer/>
    </div>
  );
}