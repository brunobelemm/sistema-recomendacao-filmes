package com.brunno.cinematch.service;

import com.brunno.cinematch.model.Filme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TmdbService {

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Value("${tmdb.api.url}")
    private String apiUrl;

    private final RestClient restClient = RestClient.create();

    public List<Filme> buscarMaisBemAvaliados(int pagina) {
        String url = String.format("%s/movie/top_rated?api_key=%s&language=pt-BR&page=%d", apiUrl, apiKey, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPorGenero(int generoId, int pagina) {
        String url = String.format("%s/discover/movie?api_key=%s&language=pt-BR&sort_by=vote_average.desc&vote_count.gte=300&with_genres=%d&page=%d",
                apiUrl, apiKey, generoId, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPopulares(int pagina) {
        String url = String.format("%s/movie/popular?api_key=%s&language=pt-BR&page=%d", apiUrl, apiKey, pagina);
        return executarRequisicao(url);
    }

    @SuppressWarnings("unchecked")
    private List<Filme> executarRequisicao(String url) {
        List<Filme> filmes = new ArrayList<>();
        Map response = restClient.get().uri(url).retrieve().body(Map.class);

        if (response != null && response.containsKey("results")) {
            List results = (List) response.get("results");
            for (Object obj : results) {
                Map item = (Map) obj;
                List<Integer> generos = new ArrayList<>();
                Object genreObj = item.get("genre_ids");
                if (genreObj instanceof List) {
                    for (Object g : (List) genreObj) {
                        if (g instanceof Number) {
                            generos.add(((Number) g).intValue());
                        }
                    }
                }

                Object idObj = item.get("id");
                int id = (idObj instanceof Number) ? ((Number) idObj).intValue() : 0;

                String titulo = item.get("title") != null ? item.get("title").toString() : "";
                String sinopse = item.get("overview") != null ? item.get("overview").toString() : "";

                Object notaObj = item.get("vote_average");
                double nota = (notaObj instanceof Number) ? ((Number) notaObj).doubleValue() : 0.0;

                String posterPath = item.get("poster_path") != null ? item.get("poster_path").toString() : null;

                filmes.add(new Filme(id, titulo, sinopse, nota, posterPath, generos));
            }
        }
        return filmes;
    }
}