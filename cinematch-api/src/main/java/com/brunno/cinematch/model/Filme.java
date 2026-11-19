package com.brunno.cinematch.model;

import java.util.List;

public class Filme {
    private int id;
    private String titulo;
    private String sinopse;
    private double nota;
    private String posterUrl;
    private List<Integer> generoIds;
    private double scoreRelevancia;

    public Filme(int id, String titulo, String sinopse, double nota, String posterPath, List<Integer> generoIds) {
        this.id = id;
        this.titulo = titulo;
        this.sinopse = sinopse;
        this.nota = nota;
        this.posterUrl = posterPath != null ? "https://image.tmdb.org/t/p/w500" + posterPath : "";
        this.generoIds = generoIds;
        this.scoreRelevancia = 0.0;
    }

    public int getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getSinopse() { return sinopse; }
    public double getNota() { return nota; }
    public String getPosterUrl() { return posterUrl; }
    public List<Integer> getGeneroIds() { return generoIds; }
    public double getScoreRelevancia() { return scoreRelevancia; }
    public void setScoreRelevancia(double scoreRelevancia) { this.scoreRelevancia = scoreRelevancia; }
}