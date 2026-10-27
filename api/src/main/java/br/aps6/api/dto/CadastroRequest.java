package br.aps6.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * JSON que chega do frontend no POST /usuarios
 * Sem cargo: o Java sempre usa o cargo padrão
 */
public record CadastroRequest(

        @NotBlank
        @Size(max = TAMANHO_MAXIMO_NOME)
        String nome,

        @NotBlank
        @Size(max = TAMANHO_MAXIMO_EMAIL)
        @Pattern(regexp = REGEX_EMAIL)
        String email,

        @NotBlank
        @Size(min = TAMANHO_MINIMO_SENHA)
        String senha,

        @NotBlank
        @JsonProperty("imagem_base64")
        String imagemBase64
) {
    static final int TAMANHO_MAXIMO_NOME = 150;
    static final int TAMANHO_MAXIMO_EMAIL = 150;

    static final int TAMANHO_MINIMO_SENHA = 6;

    // Mesma regex do CHECK de usuario.email (create_tables.sql): alterar nos dois
    static final String REGEX_EMAIL = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
}