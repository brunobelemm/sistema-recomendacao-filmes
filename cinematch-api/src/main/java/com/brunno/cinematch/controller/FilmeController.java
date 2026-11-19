package com.brunno.cinematch.controller;

import com.brunno.cinematch.model.Filme;
import com.brunno.cinematch.service.RecomendacaoService;
import com.brunno.cinematch.service.TmdbService;
import org.springframework.web.bind.annotation.*;

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
        return tmdbService.buscarMaisBemAvaliados(1);
    }

    @PostMapping("/recomendar")
    public List<Filme> recomendar(@RequestBody Map<String, String> payload) {
        String descricao = payload.getOrDefault("descricao", "");
        return recomendacaoService.recomendarPorDescricao(descricao);
    }
}