package br.aps6.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import br.aps6.api.model.Informacao;

public record InformacaoResponse(
        String titulo,
        String conteudo,
        @JsonProperty("nivel_acesso") Short nivelAcesso
) {
    public static InformacaoResponse de(Informacao informacao) {
        return new InformacaoResponse(
                informacao.getTitulo(),
                informacao.getConteudo(),
                informacao.getNivelAcesso());
    }
}