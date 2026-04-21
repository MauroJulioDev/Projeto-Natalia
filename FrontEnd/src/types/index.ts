// No seu arquivo de types (Ex: src/types.ts)

export interface Rifa {
  id: number;
  nome_premio: string;
  valor_numero: number;
  total_numeros: number;
  numeros_vendidos: number;
  imagem_url?: string;
  descricao?: string;
  // ADICIONE ESTAS DUAS LINHAS ABAIXO:
  vencedor_numero?: number | null; 
  data_sorteio?: string | null;
}

export interface NumeroRifa {
  numero: number;
  status: 'Reservado' | 'Pago';
  comprador_nome: string;
}

export interface Consultora {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  data_cadastro: string;
}

export interface MentoriaLead {
  id: number;
  nome: string;
  telefone: string;
  nivel: string;
  dificuldade: string;
  data_interesse: string;
}

export interface ClienteUser {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

export interface HistoricoItem {
  numero: number;
  status: string;
  data_reserva: string;
  nome_premio: string;
  valor_numero: number;
  imagem_url: string;
}