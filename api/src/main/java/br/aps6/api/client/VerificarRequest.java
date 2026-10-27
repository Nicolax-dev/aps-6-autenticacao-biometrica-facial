package br.aps6.api.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record VerificarRequest(
        @JsonProperty("imagem_base64") String imagemBase64,
        @JsonProperty("encoding_cadastrado") List<Double> encodingCadastrado
) {
}