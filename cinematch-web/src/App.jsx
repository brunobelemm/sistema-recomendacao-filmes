import { useState, useEffect } from 'react';
import CardFilme from './components/CardFilme';

export default function App() {
  const [descricao, setDescricao] = useState('');
  const [recomendados, setRecomendados] = useState([]);
  const [topAvaliados, setTopAvaliados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const API_BASE = (import.meta.env.VITE_API_URL || 'https://sistema-recomendacao-filmes.onrender.com') + '/api/filmes';

  useEffect(() => {
    fetch(`${API_BASE}/top-avaliados`) .then((res) => { if (!res.ok) throw new Error('Falha ao conectar com a API Java'); return res.json(); }) .then((data) => setTopAvaliados(data)) .catch(() => setErro('Verifique se o servidor Spring Boot está rodando na porta 8080.')); }, []);  const buscarRecomendacao = async (e) => { e.preventDefault(); if (!descricao.trim()) return;  setCarregando(true); setErro('');  try { const response = await fetch(`${API_BASE}/recomendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao }),
      });

      if (!response.ok) throw new Error('Erro ao processar recomendação');
      const data = await response.json();
      setRecomendados(data);
    } catch (err) {
      setErro('Não foi possível obter recomendações. Confira o back-end.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
            Cine<span className="text-white">Match</span>
          </h1>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
            Java Spring Boot + React
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-14">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            O que você quer assistir hoje?
          </h2>
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            Descreva o clima, gênero ou história (ex: <em>"quero um filme de ficção científica no espaço com suspense"</em> ou <em>"comédia leve para rir muito"</em>).
          </p>

          <form onSubmit={buscarRecomendacao} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o filme ideal para agora..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={carregando}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl transition cursor-pointer"
            >
              {carregando ? 'Analisando...' : 'Recomendar Filmes'}
            </button>
          </form>

          {erro && (
            <p className="mt-4 text-sm text-rose-400 bg-rose-950/40 border border-rose-800/50 px-4 py-2.5 rounded-lg">
              {erro}
            </p>
          )}
        </section>

        {recomendados.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-indigo-400">
                Recomendados para o seu pedido
              </h3>
              <button
                onClick={() => setRecomendados([])}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Limpar busca
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recomendados.map((filme) => (
                <CardFilme key={filme.id} filme={filme} mostrarScore />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white">
            Mais Bem Avaliados pela Crítica e Público
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {topAvaliados.slice(0, 8).map((filme) => (
              <CardFilme key={filme.id} filme={filme} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}