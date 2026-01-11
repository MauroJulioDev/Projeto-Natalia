import React from 'react';
import { UserPlus, ShoppingBag, GraduationCap, Star, ArrowRight } from 'lucide-react';
import { Card, Button } from '../components/UI';

interface HomeProps {
  changePage: (page: string) => void;
}

export default function Home({ changePage }: HomeProps) {
  return (
    <div className="animate-fade-in flex flex-col min-h-screen bg-gray-50">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-pink-600 via-pink-700 to-purple-800 text-white py-24 lg:py-32 px-4 text-center overflow-hidden">
        {/* Efeito de fundo sutil (opcional) */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold tracking-wide border border-white/30 text-pink-50 shadow-sm">
            Liderança & Sucesso
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-md">
            Sua Jornada de <span className="text-pink-200">Sucesso</span>
          </h1>
          
          <p className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto text-pink-100 font-light leading-relaxed">
            Como Mentora Tupperware, guio você passo a passo rumo à independência financeira e realização pessoal.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <Button 
              variant="secondary" 
              className="bg-white text-pink-700 hover:bg-pink-50 border-transparent font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1"
              onClick={() => changePage('cadastro')}
            >
              Quero ser Consultora
            </Button>
            <Button 
              variant="outline" 
              className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-pink-700 font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1"
              onClick={() => changePage('rifas')}
            >
              Ver Rifas Disponíveis
            </Button>
          </div>
        </div>
      </div>

      {/* --- CARDS SECTION --- */}
      <div className="container mx-auto px-4 -mt-20 relative z-20 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Recrutamento */}
          <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-t-4 border-pink-500 flex flex-col items-center text-center group h-full">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-pink-200 transition-colors shadow-inner">
              <UserPlus className="text-pink-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Seja Consultora</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-grow">
              Cadastre-se na minha equipe e conquiste sua independência financeira com lucros incríveis.
            </p>
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2" onClick={() => changePage('cadastro')}>
              Saiba Mais <ArrowRight size={18} />
            </Button>
          </Card>

          {/* Card 2: Rifas */}
          <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-t-4 border-purple-500 flex flex-col items-center text-center group h-full">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors shadow-inner">
              <ShoppingBag className="text-purple-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Rifas Exclusivas</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-grow">
              Participe dos nossos sorteios mensais e concorra a kits Tupperware completos e exclusivos.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2" onClick={() => changePage('rifas')}>
              Comprar Números <ArrowRight size={18} />
            </Button>
          </Card>

          {/* Card 3: Mentoria */}
          <Card className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-t-4 border-yellow-500 flex flex-col items-center text-center group h-full">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-yellow-200 transition-colors shadow-inner">
              <GraduationCap className="text-yellow-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Mentoria VIP</h3>
            <p className="text-gray-600 mb-8 leading-relaxed flex-grow">
              Desenvolva habilidades de liderança e aprenda a gerenciar equipes de alta performance.
            </p>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2" onClick={() => changePage('mentoria')}>
              Aplicar Agora <ArrowRight size={18} />
            </Button>
          </Card>

        </div>
      </div>

      {/* --- SEÇÃO EXTRA: DEPOIMENTOS OU BENEFÍCIOS (Opcional, preenche visualmente a página) --- */}
      <div className="bg-white py-16 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">Por que fazer parte?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-4">
              <Star className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h4 className="font-bold text-xl mb-2 text-gray-800">Reconhecimento</h4>
              <p className="text-gray-500">Prêmios exclusivos, viagens e eventos incríveis.</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 font-bold text-2xl">$</div>
              <h4 className="font-bold text-xl mb-2 text-gray-800">Lucratividade</h4>
              <p className="text-gray-500">Até 100% de lucro nas vendas e bônus de equipe.</p>
            </div>
            <div className="p-4">
              <UserPlus className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h4 className="font-bold text-xl mb-2 text-gray-800">Networking</h4>
              <p className="text-gray-500">Conecte-se com mulheres empreendedoras de sucesso.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}