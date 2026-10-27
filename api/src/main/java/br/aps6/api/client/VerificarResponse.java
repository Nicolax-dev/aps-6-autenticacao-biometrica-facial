package br.aps6.api.client;

public record VerificarResponse(
        Boolean sucesso,
        Double confianca,
        String erro
) {
}