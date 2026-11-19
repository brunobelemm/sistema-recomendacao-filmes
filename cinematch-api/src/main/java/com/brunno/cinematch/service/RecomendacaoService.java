package com.brunno.cinematch.service;

import com.brunno.cinematch.model.Filme;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecomendacaoService {

    private final TmdbService tmdbService;

    private static final Map<String, Integer> MAPA_GENEROS = Map.ofEntries(
            Map.entry("acao", 28), Map.entry("tiro", 28), Map.entry("luta", 28), Map.entry("heroi", 28), Map.entry("herois", 28),
            Map.entry("aventura", 12), Map.entry("viagem", 12),
            Map.entry("animacao", 16), Map.entry("desenho", 16), Map.entry("anime", 16),
            Map.entry("comedia", 35), Map.entry("engracado", 35), Map.entry("rir", 35),
            Map.entry("crime", 80), Map.entry("mafia", 80), Map.entry("policial", 80),
            Map.entry("documentario", 99), Map.entry("historia", 36), Map.entry("guerra", 10752),
            Map.entry("drama", 18), Map.entry("chorar", 18), Map.entry("emocionante", 18),
            Map.entry("fantasia", 14), Map.entry("magia", 14),
            Map.entry("terror", 27), Map.entry("medo", 27), Map.entry("assustador", 27), Map.entry("espirito", 27),
            Map.entry("romance", 10749), Map.entry("amor", 10749), Map.entry("casal", 10749),
            Map.entry("ficcao", 878), Map.entry("espaco", 878), Map.entry("futuro", 878), Map.entry("alien", 878),
            Map.entry("suspense", 53), Map.entry("misterio", 9648), Map.entry("investigacao", 9648)
    );

    private static final Set<String> STOPWORDS = Set.of(
            "quero", "um", "uma", "filme", "filmes", "de", "da", "do", "dos", "das",
            "com", "para", "assistir", "ver", "que", "tenha", "sobre", "muito", "mais", "tipo"
    );

    public RecomendacaoService(TmdbService tmdbService) {
        this.tmdbService = tmdbService;
    }

    public List<Filme> recomendarPorDescricao(String descricaoUsuario) {
        List<String> tokens = tokenizar(descricaoUsuario);
        Set<Integer> generosDetectados = new HashSet<>();
        boolean buscaMarvel = false;

        for (String token : tokens) {
            if (MAPA_GENEROS.containsKey(token)) {
                generosDetectados.add(MAPA_GENEROS.get(token));
            }
            if (token.equals("marvel") || token.equals("vingadores") || token.equals("avengers") || token.equals("mcu")) {
                buscaMarvel = true;
            }
        }

        Map<Integer, Filme> candidatosMap = new LinkedHashMap<>();

        // 1. Se mencionar Marvel, busca diretamente o catálogo oficial da Marvel Studios (ID 420)
        if (buscaMarvel) {
            tmdbService.buscarPorEstudio(420, 1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
            tmdbService.buscarPorEstudio(420, 2).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
        }

        // 2. Busca global em todo o acervo mundial do TMDB usando a frase/termos do usuário
        String queryLimpa = String.join(" ", tokens);
        if (!queryLimpa.isBlank()) {
            tmdbService.buscarPorTermoGlobal(queryLimpa, 1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
            tmdbService.buscarPorTermoGlobal(queryLimpa, 2).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
        } else if (descricaoUsuario != null && !descricaoUsuario.isBlank()) {
            tmdbService.buscarPorTermoGlobal(descricaoUsuario.trim(), 1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
        }

        // 3. Complementa com filmes por gênero detectado (2 páginas)
        for (Integer generoId : generosDetectados) {
            tmdbService.buscarPorGenero(generoId, 1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
            tmdbService.buscarPorGenero(generoId, 2).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
        }

        // 4. Fallback caso o usuário digite algo muito genérico
        if (candidatosMap.isEmpty()) {
            tmdbService.buscarPopulares(1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
            tmdbService.buscarMaisBemAvaliados(1).forEach(f -> candidatosMap.putIfAbsent(f.getId(), f));
        }

        List<Filme> candidatos = new ArrayList<>(candidatosMap.values());
        for (Filme filme : candidatos) {
            double score = calcularScore(filme, tokens, generosDetectados, buscaMarvel);
            filme.setScoreRelevancia(score);
        }

        return candidatos.stream()
                .sorted(Comparator.comparingDouble(Filme::getScoreRelevancia).reversed())
                .limit(24)
                .collect(Collectors.toList());
    }

    private double calcularScore(Filme filme, List<String> tokens, Set<Integer> generosDetectados, boolean buscaMarvel) {
        double score = filme.getNota() * 0.5;

        for (Integer generoId : filme.getGeneroIds()) {
            if (generosDetectados.contains(generoId)) {
                score += 4.0;
            }
        }

        String textoFilme = normalizarTexto(filme.getTitulo() + " " + filme.getSinopse());
        for (String token : tokens) {
            if (textoFilme.contains(token)) {
                score += 3.0;
            }
        }

        if (buscaMarvel && (textoFilme.contains("vingadores") || textoFilme.contains("homem") || textoFilme.contains("capitao") || textoFilme.contains("thor") || textoFilme.contains("guardioes"))) {
            score += 3.5;
        }

        return score;
    }

    private List<String> tokenizar(String texto) {
        String limpo = normalizarTexto(texto);
        return Arrays.stream(limpo.split("\\s+"))
                .filter(p -> p.length() > 2 && !STOPWORDS.contains(p))
                .collect(Collectors.toList());
    }

    private String normalizarTexto(String texto) {
        if (texto == null) return "";
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase().replaceAll("[^a-z0-9\\s]", "");
    }
}