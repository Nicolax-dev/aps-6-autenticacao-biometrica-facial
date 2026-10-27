package br.aps6.api.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import br.aps6.api.model.Informacao;
import br.aps6.api.model.Usuario;

public record LoginResponse(
        String nome,
        String cargo,
        @JsonProperty("nivel_acesso") Short nivelAcesso,
        List<InformacaoResponse> informacoes
) {
    public static LoginResponse de(Usuario usuario, List<Informacao> informacoes) {
        return new LoginResponse(
                usuario.getNome(),
                usuario.getCargo().getNome(),
                usuario.getCargo().getNivelAcesso(),
                informacoes.stream().map(InformacaoResponse::de).toList());
    }
}