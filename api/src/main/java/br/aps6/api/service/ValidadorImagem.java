package br.aps6.api.service;

import java.util.Arrays;
import java.util.Base64;

import org.springframework.stereotype.Component;

import br.aps6.api.exception.CodigoErro;
import br.aps6.api.exception.ErroApi;

@Component
public class ValidadorImagem {

    private static final int TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

    // "Magic bytes": os primeiros bytes que identificam o formato real do arquivo
    private static final byte[] ASSINATURA_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] ASSINATURA_PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    /**
     * Devolve o base64 puro (sem o prefixo "data:image/...;base64,"), pronto para o Python.
     * Lança IMAGEM_INVALIDA se qualquer regra falhar.
     */
    public String validar(String imagemBase64) {
        String base64 = removerPrefixo(imagemBase64);

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new ErroApi(CodigoErro.IMAGEM_INVALIDA);
        }

        if (bytes.length == 0 || bytes.length > TAMANHO_MAXIMO_BYTES) {
            throw new ErroApi(CodigoErro.IMAGEM_INVALIDA);
        }

        if (!comecaCom(bytes, ASSINATURA_JPEG) && !comecaCom(bytes, ASSINATURA_PNG)) {
            throw new ErroApi(CodigoErro.IMAGEM_INVALIDA);
        }

        return base64;
    }

    /** Aceita o formato do navegador ("data:image/jpeg;base64,....") e o base64 puro. */
    private String removerPrefixo(String imagemBase64) {
        int virgula = imagemBase64.indexOf(',');
        return virgula >= 0 ? imagemBase64.substring(virgula + 1) : imagemBase64;
    }

    private boolean comecaCom(byte[] bytes, byte[] assinatura) {
        return bytes.length >= assinatura.length
                && Arrays.equals(bytes, 0, assinatura.length, assinatura, 0, assinatura.length);
    }
}