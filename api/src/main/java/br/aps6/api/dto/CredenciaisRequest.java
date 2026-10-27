package br.aps6.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CredenciaisRequest(

        @NotBlank
        String email,

        @NotBlank
        String senha
) {
}