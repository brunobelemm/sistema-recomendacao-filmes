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
    public List<Filme> listarMaisBemAvaliados() {
        Map<Integer, Filme> unicos = new LinkedHashMap<>();
        for (int pagina = 1; pagina <= 3; pagina++) {
            for (Filme f : tmdbService.buscarMaisBemAvaliados(pagina)) {
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
}