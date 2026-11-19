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
            Map.entry("acao", 28), Map.entry("tiro", 28), Map.entry("luta", 28),
            Map.entry("aventura", 12), Map.entry("viagem", 12),
            Map.entry("animacao", 16), Map.entry("desenho", 16),
            Map.entry("comedia", 35), Map.entry("engracado", 35), Map.entry("rir", 35),
            Map.entry("crime", 80), Map.entry("mafia", 80), Map.entry("policial", 80),
            Map.entry("drama", 18), Map.entry("chorar", 18), Map.entry("emocionante", 18),
            Map.entry("fantasia", 14), Map.entry("magia", 14),
            Map.entry("terror", 27), Map.entry("medo", 27), Map.entry("assustador", 27), Map.entry("espirito", 27),
            Map.entry("romance", 10749), Map.entry("amor", 10749), Map.entry("casal", 10749),
            Map.entry("ficcao", 878), Map.entry("espaco", 878), Map.entry("futuro", 878), Map.entry("alien", 878),
            Map.entry("suspense", 53), Map.entry("misterio", 9648), Map.entry("investigacao", 9648)
    );

    private static final Set<String> STOPWORDS = Set.of(
            "quero", "um", "uma", "filme", "filmes", "de", "da", "do", "com", "para", "assistir", "ver", "que", "tenha", "sobre", "muito"
    );

    public RecomendacaoService(TmdbService tmdbService) {
        this.tmdbService = tmdbService;
    }

    public List<Filme> recomendarPorDescricao(String descricaoUsuario) {
        List<String> tokens = tokenizar(descricaoUsuario);
        Set<Integer> generosDetectados = new HashSet<>();

        for (String token : tokens) {
            if (MAPA_GENEROS.containsKey(token)) {
                generosDetectados.add(MAPA_GENEROS.get(token));
            }
        }

        Map<Integer, Filme> candidatosMap = new HashMap<>();
        if (!generosDetectados.isEmpty()) {
            for (Integer generoId : generosDetectados) {
                tmdbService.buscarPorGenero(generoId, 1).forEach(f -> candidatosMap.put(f.getId(), f));
            }
        } else {
            tmdbService.buscarPopulares(1).forEach(f -> candidatosMap.put(f.getId(), f));
            tmdbService.buscarMaisBemAvaliados(1).forEach(f -> candidatosMap.put(f.getId(), f));
        }

        List<Filme> candidatos = new ArrayList<>(candidatosMap.values());
        for (Filme filme : candidatos) {
            double score = calcularScore(filme, tokens, generosDetectados);
            filme.setScoreRelevancia(score);
        }

        return candidatos.stream()
                .sorted(Comparator.comparingDouble(Filme::getScoreRelevancia).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    private double calcularScore(Filme filme, List<String> tokens, Set<Integer> generosDetectados) {
        double score = filme.getNota() * 0.5;

        for (Integer generoId : filme.getGeneroIds()) {
            if (generosDetectados.contains(generoId)) {
                score += 4.0;
            }
        }

        String textoFilme = normalizarTexto(filme.getTitulo() + " " + filme.getSinopse());
        for (String token : tokens) {
            if (textoFilme.contains(token)) {
                score += 2.5;
            }
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