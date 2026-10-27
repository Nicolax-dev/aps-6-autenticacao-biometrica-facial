package br.aps6.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

public record VerificacaoRequest(

        @NotBlank
        String email,

        @NotBlank
        String senha,

        @NotBlank
        @JsonProperty("imagem_base64")
        String imagemBase64
) {
}