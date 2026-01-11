export const formatPhoneNumber = (value: string) => {
  // 1. Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  // 2. Limita a 11 dígitos (DDD + 9 números)
  const limited = numbers.slice(0, 11);

  // 3. Aplica a formatação progressiva
  if (limited.length === 0) return "";
  
  // Apenas DDD: (XX
  if (limited.length <= 2) return `(${limited}`;
  
  // DDD + Parte do número: (XX) XXXXX
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  
  // Completo: (XX) XXXXX-XXXX
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};