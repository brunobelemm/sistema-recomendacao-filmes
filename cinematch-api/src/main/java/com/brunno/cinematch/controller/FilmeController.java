package com.brunno.cinematch.controller;

import com.brunno.cinematch.model.Filme;
import com.brunno.cinematch.service.RecomendacaoService;
import com.brunno.cinematch.service.TmdbService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/filmes")
@CrossOrigin(origins = "*")
public class FilmeController {

    private final TmdbService tmdbService;
    private final RecomendacaoService recomendacaoService;

    public FilmeController(TmdbService tmdbService, RecomendacaoService recomendacaoService) {
        this.tmdbService = tmdbService;
        this.recomendacaoService = recomendacaoService;
    }

    @GetMapping("/top-avaliados")
    public List<Filme> listarMaisBemAvaliados(
            @RequestParam(defaultValue = "1") int pagina,
            @RequestParam(defaultValue = "2") int blocos
    ) {
        int blocosSeguros = Math.max(1, Math.min(blocos, 6));
        int paginaInicial = ((Math.max(1, pagina) - 1) * blocosSeguros) + 1;
        Map<Integer, Filme> unicos = new LinkedHashMap<>();

        for (int p = paginaInicial; p < paginaInicial + blocosSeguros; p++) {
            for (Filme f : tmdbService.buscarMaisBemAvaliados(p)) {
                unicos.putIfAbsent(f.getId(), f);
            }
        }
        return new ArrayList<>(unicos.values());
    }

    @GetMapping("/streaming/{providerId}")
    public List<Filme> listarPorStreaming(
            @PathVariable int providerId,
            @RequestParam(defaultValue = "1") int pagina
    ) {
        Map<Integer, Filme> unicos = new LinkedHashMap<>();
        int inicio = ((Math.max(1, pagina) - 1) * 2) + 1;
        for (int p = inicio; p < inicio + 2; p++) {
            for (Filme f : tmdbService.buscarPorStreamingBrasil(providerId, p)) {
                unicos.putIfAbsent(f.getId(), f);
            }
        }
        return new ArrayList<>(unicos.values());
    }

    @PostMapping("/recomendar")
    public List<Filme> recomendar(@RequestBody Map<String, String> payload) {
        String descricao = payload.getOrDefault("descricao", "");
        return recomendacaoService.recomendarPorDescricao(descricao);
    }

    @GetMapping("/{id}/onde-assistir")
    public Map<String, Object> ondeAssistir(@PathVariable int id) {
        return tmdbService.buscarOndeAssistir(id);
    }

    @GetMapping("/{id}/detalhes")
    public Map<String, Object> detalhes(@PathVariable int id) {
        return tmdbService.buscarDetalhesCompletos(id);
    }
}