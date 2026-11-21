package com.brunno.cinematch.service;

import com.brunno.cinematch.model.Filme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class TmdbService {

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Value("${tmdb.api.url}")
    private String apiUrl;

    private final RestClient restClient = RestClient.create();

    public List<Filme> buscarMaisBemAvaliados(int pagina) {
        int paginaSegura = Math.max(1, Math.min(pagina, 500));
        String url = String.format("%s/movie/top_rated?api_key=%s&language=pt-BR&page=%d", apiUrl, apiKey, paginaSegura);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPorGenero(int generoId, int pagina) {
        String url = String.format("%s/discover/movie?api_key=%s&language=pt-BR&sort_by=popularity.desc&vote_count.gte=100&with_genres=%d&page=%d",
                apiUrl, apiKey, generoId, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPorEstudio(int companyId, int pagina) {
        String url = String.format("%s/discover/movie?api_key=%s&language=pt-BR&sort_by=popularity.desc&with_companies=%d&page=%d",
                apiUrl, apiKey, companyId, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPorStreamingBrasil(int providerId, int pagina) {
        String url = String.format("%s/discover/movie?api_key=%s&language=pt-BR&watch_region=BR&with_watch_providers=%d&with_watch_monetization_types=flatrate|free|ads&sort_by=popularity.desc&page=%d",
                apiUrl, apiKey, providerId, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPorTermoGlobal(String query, int pagina) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = String.format("%s/search/movie?api_key=%s&language=pt-BR&include_adult=false&query=%s&page=%d",
                apiUrl, apiKey, encoded, pagina);
        return executarRequisicao(url);
    }

    public List<Filme> buscarPopulares(int pagina) {
        String url = String.format("%s/movie/popular?api_key=%s&language=pt-BR&page=%d", apiUrl, apiKey, pagina);
        return executarRequisicao(url);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> buscarDetalhesCompletos(int movieId) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.putAll(buscarOndeAssistir(movieId));
        resultado.put("trailerKey", buscarTrailerYoutube(movieId));
        return resultado;
    }

        @SuppressWarnings("unchecked")
    public String buscarTrailerYoutube(int movieId) {
        String[] urls = {
            String.format("%s/movie/%d/videos?api_key=%s&language=pt-BR", apiUrl, movieId, apiKey),
            String.format("%s/movie/%d/videos?api_key=%s&language=en-US", apiUrl, movieId, apiKey),
            String.format("%s/movie/%d/videos?api_key=%s", apiUrl, movieId, apiKey)
        };
        for (String url : urls) {
            try {
                Map response = restClient.get().uri(url).retrieve().body(Map.class);
                if (response != null && response.containsKey("results")) {
                    List results = (List) response.get("results");
                    String fallbackKey = "";
                    for (Object obj : results) {
                        if (!(obj instanceof Map)) continue;
                        Map item = (Map) obj;
                        String site = item.get("site") != null ? item.get("site").toString() : "";
                        String type = item.get("type") != null ? item.get("type").toString() : "";
                        String key = item.get("key") != null ? item.get("key").toString() : "";
                        if ("YouTube".equalsIgnoreCase(site) && !key.isBlank()) {
                            if ("Trailer".equalsIgnoreCase(type) || "Teaser".equalsIgnoreCase(type)) {
                                return key;
                            }
                            if (fallbackKey.isBlank()) {
                                fallbackKey = key;
                            }
                        }
                    }
                    if (!fallbackKey.isBlank()) {
                        return fallbackKey;
                    }
                }
            } catch (Exception ignored) {
            }
        }
        return "";
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> buscarOndeAssistir(int movieId) {
        String url = String.format("%s/movie/%d/watch/providers?api_key=%s", apiUrl, movieId, apiKey);
        Map<String, Object> resultado = new LinkedHashMap<>();
        List> streaming = new ArrayList<>();
        List> aluguelCompra = new ArrayList<>();
        String linkTmdb = "";

        try {
            Map response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response != null && response.containsKey("results")) {
                Map results = (Map) response.get("results");
                if (results != null && results.containsKey("BR")) {
                    Map br = (Map) results.get("BR");
                    if (br.get("link") != null) {
                        linkTmdb = br.get("link").toString();
                    }

                    extrairProvedores(br.get("flatrate"), streaming);
                    extrairProvedores(br.get("free"), streaming);
                    extrairProvedores(br.get("ads"), streaming);
                    extrairProvedores(br.get("rent"), aluguelCompra);
                    extrairProvedores(br.get("buy"), aluguelCompra);
                }
            }
        } catch (Exception ignored) {
        }

        resultado.put("streaming", streaming);
        resultado.put("aluguelCompra", aluguelCompra);
        resultado.put("link", linkTmdb);
        return resultado;
    }

    @SuppressWarnings("unchecked")
    private void extrairProvedores(Object listaObj, List> destino) {
        if (!(listaObj instanceof List)) return;
        for (Object itemObj : (List) listaObj) {
            if (!(itemObj instanceof Map)) continue;
            Map item = (Map) itemObj;
            String nome = item.get("provider_name") != null ? item.get("provider_name").toString() : "";
            String logo = item.get("logo_path") != null ? "https://image.tmdb.org/t/p/w92" + item.get("logo_path").toString() : "";
            boolean jaExiste = destino.stream().anyMatch(p -> nome.equals(p.get("nome")));
            if (!nome.isBlank() && !jaExiste) {
                Map<String, String> prov = new java.util.LinkedHashMap<>();
                prov.put("nome", nome);
                prov.put("logo", logo);
                destino.add(prov);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private List<Filme> executarRequisicao(String url) {
        List<Filme> filmes = new ArrayList<>();
        try {
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

                    if (posterPath != null && !posterPath.isBlank()) {
                        filmes.add(new Filme(id, titulo, sinopse, nota, posterPath, generos));
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return filmes;
    }
}