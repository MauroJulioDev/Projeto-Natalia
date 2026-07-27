import React from 'react';
import { Code2, Smartphone, Heart, Lock, Instagram, MessageCircle, Gift, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  // 🔥 LINKS PARA SUBSTITUIR
  const instagramUrl = 'https://www.instagram.com/nathy_tupper?igsh=MTlzZWlzZW40NzZidQ==';
  const grupoRifasUrl = 'https://chat.whatsapp.com/HIiA755F4wI0HGJCrKC0Ee';

  // 🔥 CORRIGIDO: Número do WhatsApp (sem o https://wa.me/)
  const whatsappSuporte = '5561981492755';
  const mensagemSuporte = encodeURIComponent("Olá, Natália! Estou com problemas poderia me ajudar?");
  const linkZapSuporte = `https://wa.me/${whatsappSuporte}?text=${mensagemSuporte}`;

  // (MANTIDO) Link do desenvolvedor
  const meuWhatsApp = "5561981339472"; 
  const mensagem = encodeURIComponent("Olá, Mauro! Vi o sistema de rifas da Natália e achei incrível. Gostaria de fazer um orçamento para criar um projeto para mim também!");
  const linkZap = `https://wa.me/${meuWhatsApp}?text=${mensagem}`;

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t-[4px] border-pink-600 mt-auto w-full z-10 relative">
      <div className="container mx-auto px-4 flex flex-col gap-8">
        
        {/* LINHA 1: Logo + Links Rápidos + Redes Sociais */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo e descrição */}
          <div className="text-center md:text-left">
            <span className="text-white font-black text-2xl tracking-tight">Nathy Tupper</span>
            <p className="text-gray-500 text-sm mt-1">Sorteios, mentoria e oportunidades de negócio.</p>
          </div>

          {/* Links Rápidos */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/rifas" className="hover:text-pink-400 transition-colors">Sorteios</Link>
            <Link to="/seja-consultora" className="hover:text-pink-400 transition-colors">Seja Consultora</Link>
            <Link to="/mentoria-vip" className="hover:text-pink-400 transition-colors">Mentoria VIP</Link>
            <Link to="/faq" className="hover:text-pink-400 transition-colors">Dúvidas</Link>
          </div>

          {/* Redes Sociais e Grupo */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Grupo de Rifas */}
            <a
              href={grupoRifasUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full transition-all text-sm font-bold"
            >
              <Users size={18} />
              Grupo de Rifas
            </a>
            {/* Instagram */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white px-4 py-2 rounded-full transition-all text-sm font-bold"
            >
              <Instagram size={18} />
              Instagram
            </a>
            {/* WhatsApp Suporte */}
            <a
              href={linkZapSuporte}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full transition-all text-sm font-bold"
            >
              <MessageCircle size={18} />
              Suporte
            </a>
          </div>
        </div>

        {/* LINHA 2: Desenvolvedor + Admin */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6">
          
          {/* Admin */}
          <Link to="/admin" className="text-gray-600 hover:text-pink-500 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 text-xs font-bold">
            <Lock size={12}/> Acesso Administrativo
          </Link>

          {/* Copyright */}
          <span className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Nathy Tupper. Todos os direitos reservados.
          </span>

          {/* Desenvolvedor */}
          <a 
            href={linkZap} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-2 pr-4 rounded-full transition-all shadow-lg hover:shadow-pink-900/30 border border-gray-700 hover:border-pink-500/50"
          >
            <div className="bg-gray-900 p-2 rounded-full group-hover:scale-110 transition-transform">
              <Code2 size={16} className="text-pink-500" />
            </div>
            <span className="text-white font-bold text-sm">Mauro Carvalho</span>
            <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-500/20 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Smartphone size={14} />
              Orçamento
            </div>
          </a>
        </div>

      </div>
    </footer>
  );
}