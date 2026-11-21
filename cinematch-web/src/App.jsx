import { useState, useEffect } from 'react';
import CardFilme from './components/CardFilme';

export default function App() {
  const [descricao, setDescricao] = useState('');
  const [recomendados, setRecomendados] = useState([]);
  const [topAvaliados, setTopAvaliados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [ondeAssistir, setOndeAssistir] = useState(null);
  const [carregandoOnde, setCarregandoOnde] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_URL || 'https://sistema-recomendacao-filmes.onrender.com') + '/api/filmes';

  useEffect(() => {
    fetch(`${API_BASE}/top-avaliados`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao conectar com a API Java');
        return res.json();
      })
      .then((data) => setTopAvaliados(data))
      .catch(() => setErro('Aguardando o servidor acordar ou erro de conexão com o back-end.'));
  }, []);

  const buscarRecomendacao = async (e) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    setCarregando(true);
    setErro('');

    try {
      const response = await fetch(`${API_BASE}/recomendar`, {
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

  const abrirDetalhesFilme = async (filme) => {
    setFilmeSelecionado(filme);
    setOndeAssistir(null);
    setCarregandoOnde(true);

    try {
      const res = await fetch(`${API_BASE}/${filme.id}/onde-assistir`);
      if (res.ok) {
        const data = await res.json();
        setOndeAssistir(data);
      } else {
        setOndeAssistir({ streaming: [], aluguelCompra: [], link: '' });
      }
    } catch {
      setOndeAssistir({ streaming: [], aluguelCompra: [], link: '' });
    } finally {
      setCarregandoOnde(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
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

      <main className="max-w-6xl w-full mx-auto px-4 py-10 space-y-14 flex-1">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            O que você quer assistir hoje?
          </h2>
          <p className="text-slate-400 mb-6 text-sm md:text-base">
            Descreva o clima, gênero ou história (ex: <em>"filme de super-heróis da Marvel com muita ação"</em>, <em>"ficção científica no espaço"</em> ou <em>"comédia leve"</em>).
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
                Recomendados para o seu pedido ({recomendados.length})
              </h3>
              <button
                onClick={() => setRecomendados([])}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Limpar busca
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recomendados.map((filme) => (
                <div
                  key={filme.id}
                  onClick={() => abrirDetalhesFilme(filme)}
                  className="cursor-pointer transition-transform hover:-translate-y-1"
                  title="Clique para ver sinopse e onde assistir"
                >
                  <CardFilme filme={filme} mostrarScore />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Mais Bem Avaliados pela Crítica e Público
            </h3>
            <span className="text-xs text-slate-400">
              Clique em um filme para ver sinopse e onde assistir
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {topAvaliados.map((filme) => (
              <div
                key={filme.id}
                onClick={() => abrirDetalhesFilme(filme)}
                className="cursor-pointer transition-transform hover:-translate-y-1"
                title="Clique para ver sinopse e onde assistir"
              >
                <CardFilme filme={filme} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {filmeSelecionado && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFilmeSelecionado(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row gap-6 p-6">
              {filmeSelecionado.posterUrl && (
                <img
                  src={filmeSelecionado.posterUrl}
                  alt={filmeSelecionado.titulo}
                  className="w-40 sm:w-48 rounded-xl object-cover mx-auto sm:mx-0 shadow-lg"
                />
              )}

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {filmeSelecionado.titulo}
                    </h3>
                    <span className="inline-block mt-1 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      ★ {Number(filmeSelecionado.nota).toFixed(1)} / 10
                    </span>
                  </div>
                  <button
                    onClick={() => setFilmeSelecionado(null)}
                    className="text-slate-400 hover:text-white text-2xl leading-none px-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Sinopse
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {filmeSelecionado.sinopse || 'Sinopse não disponível em português para este título.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Onde assistir no Brasil
                  </h4>

                  {carregandoOnde ? (
                    <p className="text-sm text-slate-400">Buscando plataformas disponíveis...</p>
                  ) : (
                    <>
                      {ondeAssistir?.streaming?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Assinatura / Streaming:</p>
                          <div className="flex flex-wrap gap-2.5">
                            {ondeAssistir.streaming.map((p) => (
                              <div
                                key={p.nome}
                                className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl"
                              >
                                {p.logo && (
                                  <img src={p.logo} alt={p.nome} className="w-6 h-6 rounded-md" />
                                )}
                                <span className="text-xs font-medium text-white">{p.nome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {ondeAssistir?.aluguelCompra?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Aluguel ou Compra Digital:</p>
                          <div className="flex flex-wrap gap-2.5">
                            {ondeAssistir.aluguelCompra.map((p) => (
                              <div
                                key={p.nome}
                                className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/70 px-3 py-1.5 rounded-xl"
                              >
                                {p.logo && (
                                  <img src={p.logo} alt={p.nome} className="w-6 h-6 rounded-md" />
                                )}
                                <span className="text-xs text-slate-200">{p.nome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!ondeAssistir?.streaming?.length && !ondeAssistir?.aluguelCompra?.length) && (
                        <p className="text-sm text-slate-400">
                          Nenhuma plataforma de streaming cadastrada no Brasil no momento (pode estar em cartaz nos cinemas ou indisponível no catálogo nacional).
                        </p>
                      )}

                      {ondeAssistir?.link && (
                        <div className="pt-2">
                          <a
                            href={ondeAssistir.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Ver opções completas no TMDB / JustWatch →
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-sm text-slate-400">
        <p>
          Desenvolvido por{' '}
          <a
            href="https://github.com/brunobelemm"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
          >
            Bruno Belem
          </a>
          {' '}•{' '}
          <a
            href="https://github.com/brunobelemm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition-colors"
          >
            github.com/brunobelemm
          </a>
        </p>
      </footer>
    </div>
  );
}