import { useState } from 'react';

export default function CriarRifa() {
  // Ajustado para os nomes reais que a sua vitrine espera
  const [nomePremio, setNomePremio] = useState('');
  const [valorNumero, setValorNumero] = useState('');
  const [totalNumeros, setTotalNumeros] = useState('100'); // Padrão de 100 números
  const [imagemUrl, setImagemUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/rifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_premio: nomePremio,
          valor_numero: parseFloat(valorNumero),
          total_numeros: parseInt(totalNumeros),
          imagem_url: imagemUrl,
          numeros_vendidos: 0 // Começa com 0
        }),
      });

      if (response.ok) {
        alert('Rifa criada com sucesso no Banco de Dados!');
        setNomePremio(''); setValorNumero(''); setImagemUrl('');
      } else {
        alert('Ocorreu um erro ao criar a rifa.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão. Verifique se o Backend está rodando.');
    }
  };

  return (
    <div className="bg-white p-8 border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Criar Nova Rifa</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Nome do Prêmio</label>
          <input type="text" placeholder="Ex: Kit Tupperware" className="w-full border p-2 rounded bg-gray-50" value={nomePremio} onChange={(e) => setNomePremio(e.target.value)} required />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Valor do Número (R$)</label>
            <input type="number" step="0.01" placeholder="Ex: 15.00" className="w-full border p-2 rounded bg-gray-50" value={valorNumero} onChange={(e) => setValorNumero(e.target.value)} required />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Total de Números</label>
            <input type="number" placeholder="Ex: 100" className="w-full border p-2 rounded bg-gray-50" value={totalNumeros} onChange={(e) => setTotalNumeros(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Link da Imagem (Opcional)</label>
          <input type="text" placeholder="https://link-da-foto.com/foto.jpg" className="w-full border p-2 rounded bg-gray-50" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} />
        </div>

        <button type="submit" className="mt-4 bg-pink-600 text-white font-bold py-3 px-4 rounded hover:bg-pink-700 transition shadow-md">
          Cadastrar Rifa
        </button>
      </form>
    </div>
  );
}