package br.aps6.api.client;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EncodingRequest(
        @JsonProperty("imagem_base64") String imagemBase64
) {
}