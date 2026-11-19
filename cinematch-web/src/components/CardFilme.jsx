export default function CardFilme({ filme, mostrarScore = false }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-indigo-500/50 transition group">
      <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
        {filme.posterUrl ? (
          <img
            src={filme.posterUrl}
            alt={filme.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            Sem pôster
          </div>
        )}
        <span className="absolute top-3 right-3 bg-slate-950/90 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-md border border-slate-700">
          ★ {filme.nota.toFixed(1)}
        </span>
        {mostrarScore && (
          <span className="absolute top-3 left-3 bg-indigo-600 text-white font-semibold text-xs px-2.5 py-1 rounded-md">
            Match: {filme.scoreRelevancia.toFixed(1)} pts
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="font-bold text-base text-white line-clamp-1" title={filme.titulo}>
            {filme.titulo}
          </h4>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
            {filme.sinopse || 'Sinopse indisponível em português.'}
          </p>
        </div>
      </div>
    </div>
  );
}