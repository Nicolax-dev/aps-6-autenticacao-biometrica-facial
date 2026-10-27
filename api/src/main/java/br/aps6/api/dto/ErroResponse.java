package br.aps6.api.dto;

/** Formato único de erro da API: { "erro": "CODIGO" }. O texto para o usuário fica no frontend. */
public record ErroResponse(String erro) {
}