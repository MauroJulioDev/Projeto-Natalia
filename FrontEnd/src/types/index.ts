export interface Rifa {
  id: number;
  nome_premio: string;
  valor_numero: number;
  imagem_url: string;
  status: 'Aberta' | 'Encerrada';
  numeros_vendidos: number;
  total_numeros: number;
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