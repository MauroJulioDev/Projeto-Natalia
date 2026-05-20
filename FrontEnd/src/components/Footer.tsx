import React from 'react';
import { Code2, Smartphone, Heart, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const meuWhatsApp = "5561999999999"; 
  const mensagem = encodeURIComponent("Olá, Mauro! Vi o sistema de rifas da Natália e achei incrível. Gostaria de fazer um orçamento para criar um projeto para mim também!");
  const linkZap = `https://wa.me/${meuWhatsApp}?text=${mensagem}`;

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t-[4px] border-pink-600 mt-auto w-full z-10 relative">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="text-sm font-medium text-center md:text-left flex flex-col items-center md:items-start gap-2">
          <span className="text-white font-black text-xl tracking-tight">Mentora Tupperware</span>
          <span className="opacity-70">&copy; {new Date().getFullYear()} Todos os direitos reservados.</span>
          
          {/* LINK DE ADMIN OTIMIZADO DENTRO DO FOOTER */}
          <Link to="/admin" className="mt-1 text-gray-600 hover:text-pink-500 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 text-xs font-bold w-fit">
             <Lock size={12}/> Acesso Administrativo
          </Link>
        </div>
        
        <a 
          href={linkZap} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex flex-col sm:flex-row items-center gap-3 bg-gray-800 hover:bg-gray-700 p-3 sm:pr-4 rounded-2xl sm:rounded-full transition-all duration-300 shadow-lg hover:shadow-pink-900/30 border border-gray-700 hover:border-pink-500/50 w-full sm:w-auto"
        >
          <div className="bg-gray-900 p-3 sm:p-2 rounded-full group-hover:scale-110 transition-transform hidden sm:block">
            <Code2 size={20} className="text-pink-500" />
          </div>
          <div className="flex flex-col text-center sm:text-left w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-500 group-hover:text-pink-400 transition-colors">
              Desenvolvido por
            </span>
            <span className="text-white font-bold text-base sm:text-sm">
              Mauro Carvalho
            </span>
          </div>
          <div className="mt-2 sm:mt-0 sm:ml-2 bg-green-500/10 text-green-400 px-4 sm:px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 border border-green-500/20 group-hover:bg-green-500 group-hover:text-white transition-colors w-full sm:w-auto">
            <Smartphone size={16} className="sm:w-3.5 sm:h-3.5" />
            Orçamento Exclusivo
          </div>
        </a>

      </div>
    </footer>
  );
}