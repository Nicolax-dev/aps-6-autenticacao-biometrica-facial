package br.aps6.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import br.aps6.api.model.Usuario;

public record CadastroResponse(
        Integer id,
        String nome,
        String email,
        String cargo,
        @JsonProperty("nivel_acesso") Short nivelAcesso
) {
    public static CadastroResponse de(Usuario usuario) {
        return new CadastroResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCargo().getNome(),
                usuario.getCargo().getNivelAcesso());
    }
}