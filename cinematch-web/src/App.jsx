import { useState, useEffect } from 'react';
import CardFilme from './components/CardFilme';

const CATEGORIAS_RAPIDAS = [
  { id: 'todos', label: 'Todos', query: '' },
  { id: 'marvel', label: 'Marvel / Heróis', query: 'filme de super-herois da Marvel' },
  { id: 'acao', label: 'Ação', query: 'acao aventura intensa' },
  { id: 'ficcao', label: 'Ficção Científica', query: 'ficcao cientifica espaco futuro' },
  { id: 'terror', label: 'Terror & Suspense', query: 'terror suspense misterio' },
  { id: 'comedia', label: 'Comédia', query: 'comedia engracado leve' },
  { id: 'animacao', label: 'Animação', query: 'animacao desenho' },
  { id: 'drama', label: 'Drama', query: 'drama emocionante' },
  { id: 'romance', label: 'Romance', query: 'romance amor' },
];

export default function App() {
  const [descricao, setDescricao] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [abaAtiva, setAbaAtiva] = useState('explorar'); // 'explorar' | 'favoritos'

  const [recomendados, setRecomendados] = useState([]);
  const [topAvaliados, setTopAvaliados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [servidorAcordando, setServidorAcordando] = useState(false);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [erro, setErro] = useState('');

  const [minhaLista, setMinhaLista] = useState(() => {
    try {
      const salvo = localStorage.getItem('cinematch_minha_lista');
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [detalhesFilme, setDetalhesFilme] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_URL || 'https://sistema-recomendacao-filmes.onrender.com') + '/api/filmes';

  useEffect(() => {
    try {
      localStorage.setItem('cinematch_minha_lista', JSON.stringify(minhaLista));
    } catch {
      // ignora erro de quota
    }
  }, [minhaLista]);

  useEffect(() => {
    let ativo = true;
    const timerAviso = setTimeout(() => {
      if (ativo) setServidorAcordando(true);
    }, 3500);

    const carregarVitrine = async (tentativa = 1) => {
      try {
        const res = await fetch(`${API_BASE}/top-avaliados?pagina=1`);
        if (!res.ok) throw new Error('Falha na API');
        const data = await res.json();
        if (!ativo) return;
        clearTimeout(timerAviso);
        setTopAvaliados(data);
        setCarregandoInicial(false);
        setServidorAcordando(false);
        setErro('');
      } catch {
        if (!ativo) return;
        if (tentativa < 3) {
          setServidorAcordando(true);
          setTimeout(() => carregarVitrine(tentativa + 1), 5000);
        } else {
          clearTimeout(timerAviso);
          setCarregandoInicial(false);
          setServidorAcordando(false);
          setErro('Não foi possível conectar ao servidor agora. Tente recarregar a página em alguns segundos.');
        }
      }
    };

    carregarVitrine();
    return () => {
      ativo = false;
      clearTimeout(timerAviso);
    };
  }, []);

  const executarBusca = async (textoConsulta) => {
    if (!textoConsulta.trim()) {
      setRecomendados([]);
      return;
    }

    setAbaAtiva('explorar');
    setCarregandoBusca(true);
    setErro('');

    try {
      const response = await fetch(`${API_BASE}/recomendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: textoConsulta }),
      });

      if (!response.ok) throw new Error('Erro ao processar recomendação');
      const data = await response.json();
      setRecomendados(data);
    } catch {
      setErro('O servidor ainda está iniciando. Aguarde alguns segundos e tente novamente.');
    } finally {
      setCarregandoBusca(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setCategoriaAtiva('todos');
    executarBusca(descricao);
  };

  const selecionarCategoria = (cat) => {
    setCategoriaAtiva(cat.id);
    setAbaAtiva('explorar');
    if (cat.id === 'todos') {
      setDescricao('');
      setRecomendados([]);
    } else {
      setDescricao(cat.query);
      executarBusca(cat.query);
    }
  };

  const carregarMaisFilmes = async () => {
    if (carregandoMais) return;
    setCarregandoMais(true);
    const proximaPagina = paginaAtual + 1;

    try {
      const res = await fetch(`${API_BASE}/top-avaliados?pagina=${proximaPagina}`);
      if (res.ok) {
        const novos = await res.json();
        setTopAvaliados((prev) => {
          const idsExistentes = new Set(prev.map((f) => f.id));
          const filtrados = novos.filter((f) => !idsExistentes.has(f.id));
          return [...prev, ...filtrados];
        });
        setPaginaAtual(proximaPagina);
      }
    } finally {
      setCarregandoMais(false);
    }
  };

  const estaNaMinhaLista = (filmeId) => minhaLista.some((f) => f.id === filmeId);

  const alternarMinhaLista = (filme, e) => {
    if (e) e.stopPropagation();
    setMinhaLista((prev) => {
      if (prev.some((f) => f.id === filme.id)) {
        return prev.filter((f) => f.id !== filme.id);
      }
      return [filme, ...prev];
    });
  };

  const abrirDetalhesFilme = async (filme) => {
    setFilmeSelecionado(filme);
    setDetalhesFilme(null);
    setCarregandoDetalhes(true);

    try {
      const res = await fetch(`${API_BASE}/${filme.id}/detalhes`);
      if (res.ok) {
        const data = await res.json();
        setDetalhesFilme(data);
      } else {
        const resFallback = await fetch(`${API_BASE}/${filme.id}/onde-assistir`);
        const dataFallback = resFallback.ok ? await resFallback.json() : {};
        setDetalhesFilme({ streaming: [], aluguelCompra: [], link: '', trailerKey: '', ...dataFallback });
      }
    } catch {
      setDetalhesFilme({ streaming: [], aluguelCompra: [], link: '', trailerKey: '' });
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const renderCardComAcoes = (filme, mostrarScore = false) => {
    const salvo = estaNaMinhaLista(filme.id);
    return (
      <div
        key={filme.id}
        onClick={() => abrirDetalhesFilme(filme)}
        className="relative group cursor-pointer transition-transform hover:-translate-y-1"
        title="Clique para ver trailer, sinopse e onde assistir"
      >
        <button
          type="button"
          onClick={(e) => alternarMinhaLista(filme, e)}
          className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition cursor-pointer ${
            salvo
              ? 'bg-indigo-600/90 text-white border-indigo-400 shadow-lg'
              : 'bg-slate-950/75 text-slate-200 border-slate-700 hover:border-indigo-400 hover:text-white'
          }`}
        >
          {salvo ? '✓ Na Lista' : '+ Minha Lista'}
        </button>
        <CardFilme filme={filme} mostrarScore={mostrarScore} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('explorar');
              selecionarCategoria(CATEGORIAS_RAPIDAS[0]);
            }}
            className="text-2xl font-bold tracking-tight text-indigo-400 cursor-pointer"
          >
            Cine<span className="text-white">Match</span>
          </button>

          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('explorar')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                abaAtiva === 'explorar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              Explorar Filmes
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('favoritos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'favoritos'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              <span>Minha Lista</span>
              <span className="bg-slate-950/70 text-indigo-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {minhaLista.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 py-10 space-y-12 flex-1">
        {abaAtiva === 'favoritos' ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Minha Lista (Quero Assistir)</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Seus filmes salvos ficam guardados automaticamente neste navegador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbaAtiva('explorar')}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                ← Voltar para explorar
              </button>
            </div>

            {minhaLista.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <p className="text-slate-300 font-medium">Sua lista ainda está vazia.</p>
                <p className="text-sm text-slate-400">
                  Clique em <span className="text-indigo-400 font-semibold">+ Minha Lista</span> em qualquer filme para salvá-lo aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {minhaLista.map((filme) => renderCardComAcoes(filme))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  O que você quer assistir hoje?
                </h2>
                <p className="text-slate-400 text-sm md:text-base">
                  Descreva o clima, gênero ou história (ex: <em>"filme de super-heróis da Marvel com muita ação"</em>, <em>"ficção científica no espaço"</em> ou <em>"comédia leve"</em>).
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite um filme, franquia (ex: Marvel, Batman) ou descreva o que quer ver..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={carregandoBusca}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl transition cursor-pointer"
                >
                  {carregandoBusca ? 'Analisando...' : 'Recomendar Filmes'}
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIAS_RAPIDAS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selecionarCategoria(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                      categoriaAtiva === cat.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {servidorAcordando && (
                <div className="flex items-center gap-3 text-sm text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 px-4 py-3 rounded-xl">
                  <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
                  <span>
                    Iniciando o servidor Java na nuvem (Render)... Isso leva cerca de 30 a 50 segundos na primeira visita.
                  </span>
                </div>
              )}

              {erro && (
                <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800/50 px-4 py-2.5 rounded-lg">
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
                    type="button"
                    onClick={() => {
                      setRecomendados([]);
                      setCategoriaAtiva('todos');
                      setDescricao('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Limpar busca
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {recomendados.map((filme) => renderCardComAcoes(filme, true))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-white">
                  Mais Bem Avaliados pela Crítica e Público
                </h3>
                <span className="text-xs text-slate-400">
                  Clique em qualquer filme para assistir ao trailer, ler a sinopse e ver onde assistir
                </span>
              </div>

              {carregandoInicial ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse"
                    >
                      <div className="h-72 bg-slate-800/80" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {topAvaliados.map((filme) => renderCardComAcoes(filme))}
                  </div>

                  {topAvaliados.length > 0 && (
                    <div className="pt-6 text-center">
                      <button
                        type="button"
                        onClick={carregarMaisFilmes}
                        disabled={carregandoMais}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-8 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {carregandoMais ? 'Carregando mais filmes...' : 'Carregar mais filmes'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      {filmeSelecionado && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFilmeSelecionado(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detalhesFilme?.trailerKey && (
              <div className="aspect-video w-full bg-black border-b border-slate-800">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${detalhesFilme.trailerKey}?rel=0`}
                  title={`Trailer de ${filmeSelecionado.titulo}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 p-6">
              {filmeSelecionado.posterUrl && (
                <img
                  src={filmeSelecionado.posterUrl}
                  alt={filmeSelecionado.titulo}
                  className="w-40 sm:w-44 rounded-xl object-cover mx-auto sm:mx-0 shadow-lg self-start"
                />
              )}

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {filmeSelecionado.titulo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        ★ {Number(filmeSelecionado.nota).toFixed(1)} / 10
                      </span>
                      <button
                        type="button"
                        onClick={() => alternarMinhaLista(filmeSelecionado)}
                        className={`text-xs font-semibold px-3 py-0.5 rounded-full border transition cursor-pointer ${
                          estaNaMinhaLista(filmeSelecionado.id)
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-indigo-400'
                        }`}
                      >
                        {estaNaMinhaLista(filmeSelecionado.id) ? '✓ Salvo na Minha Lista' : '+ Salvar na Minha Lista'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
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

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Onde assistir no Brasil
                  </h4>

                  {carregandoDetalhes ? (
                    <p className="text-sm text-slate-400">Carregando trailer e plataformas disponíveis...</p>
                  ) : (
                    <>
                      {detalhesFilme?.streaming?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Assinatura / Streaming:</p>
                          <div className="flex flex-wrap gap-2.5">
                            {detalhesFilme.streaming.map((p) => (
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

                      {detalhesFilme?.aluguelCompra?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Aluguel ou Compra Digital:</p>
                          <div className="flex flex-wrap gap-2.5">
                            {detalhesFilme.aluguelCompra.map((p) => (
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

                      {(!detalhesFilme?.streaming?.length && !detalhesFilme?.aluguelCompra?.length) && (
                        <p className="text-sm text-slate-400">
                          Nenhuma plataforma de streaming cadastrada no Brasil no momento.
                        </p>
                      )}

                      {detalhesFilme?.link && (
                        <div className="pt-2">
                          <a
                            href={detalhesFilme.link}
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