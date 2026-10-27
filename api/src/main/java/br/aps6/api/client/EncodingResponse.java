package br.aps6.api.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EncodingResponse(
        Boolean sucesso,
        @JsonProperty("quantidade_rostos") Integer quantidadeRostos, 
        List<Double> encoding,
        String erro
) {
}