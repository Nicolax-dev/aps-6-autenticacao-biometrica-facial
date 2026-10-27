package br.aps6.api.client;

import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import br.aps6.api.exception.CodigoErro;
import br.aps6.api.exception.ErroApi;

/** Única parte do Java que chama o Python*/
@Component
public class BiometriaClient {

    private static final int TAMANHO_ENCODING = 128;

    private static final double CONFIANCA_MINIMA = 0.0;
    private static final double CONFIANCA_MAXIMA = 1.0;

    // Códigos que cada endpoint pode devolver. Qualquer outro é contrato quebrado -> ERRO_INTERNO
    private static final Set<CodigoErro> ERROS_ENCODING = Set.of(
            CodigoErro.NENHUM_ROSTO_DETECTADO,
            CodigoErro.MULTIPLOS_ROSTOS_DETECTADOS,
            CodigoErro.IMAGEM_INVALIDA);

    private static final Set<CodigoErro> ERROS_VERIFICAR = Set.of(
            CodigoErro.NENHUM_ROSTO_DETECTADO,
            CodigoErro.MULTIPLOS_ROSTOS_DETECTADOS,
            CodigoErro.CONFIANCA_ABAIXO_LIMIAR,
            CodigoErro.IMAGEM_INVALIDA);

    private static final Logger log = LoggerFactory.getLogger(BiometriaClient.class);

    private final RestClient restClient;

    public BiometriaClient(RestClient biometriaRestClient) {
        this.restClient = biometriaRestClient;
    }

    /** Cadastro: gera o encoding (128 números) da foto. */
    public List<Double> gerarEncoding(String imagemBase64) {
        EncodingResponse resposta = chamar("/encoding", new EncodingRequest(imagemBase64), EncodingResponse.class);

        if (resposta.sucesso() == null) {
            log.warn("Resposta incompleta do /encoding do Python");
            throw new ErroApi(CodigoErro.SERVICO_BIOMETRICO_INDISPONIVEL);
        }

        if (!resposta.sucesso()) {
            throw new ErroApi(converterCodigo(resposta.erro(), ERROS_ENCODING, "/encoding"));
        }

        List<Double> encoding = resposta.encoding();
        if (encoding == null || encoding.size() != TAMANHO_ENCODING) {
            log.error("Python devolveu encoding fora do contrato (esperado {} números)", TAMANHO_ENCODING);
            throw new ErroApi(CodigoErro.ERRO_INTERNO);
        }
        return encoding;
    }

    public double verificar(String imagemBase64, List<Double> encodingCadastrado) {
        VerificarResponse resposta = chamar("/verificar",
                new VerificarRequest(imagemBase64, encodingCadastrado), VerificarResponse.class);

        if (resposta.sucesso() == null) {
            log.warn("Resposta incompleta do /verificar do Python");
            throw new ErroApi(CodigoErro.SERVICO_BIOMETRICO_INDISPONIVEL);
        }

        if (!resposta.sucesso()) {
            throw new ErroApi(converterCodigo(resposta.erro(), ERROS_VERIFICAR, "/verificar"));
        }

        if (resposta.confianca() == null) {
            log.error("Python devolveu sucesso sem confiança no /verificar");
            throw new ErroApi(CodigoErro.ERRO_INTERNO);
        }

        // Truncada de novo por defesa: não confia cegamente em valor vindo de fora;
        double confianca = Math.clamp(resposta.confianca(), CONFIANCA_MINIMA, CONFIANCA_MAXIMA);
        if (confianca != resposta.confianca()) {
            log.warn("Confiança fora de [0, 1] vinda do Python foi truncada: {}", resposta.confianca());
        }
        return confianca;
    }

    // POST com JSON. Qualquer falha técnica vira SERVICO_BIOMETRICO_INDISPONIVEL”
    private <T> T chamar(String endpoint, Object corpo, Class<T> tipoResposta) {
        T resposta;
        try {
            resposta = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .body(tipoResposta);
        } catch (RestClientException e) {
            log.warn("Falha ao chamar {} do Python: {}", endpoint,
                    NestedExceptionUtils.getMostSpecificCause(e).toString());
            throw new ErroApi(CodigoErro.SERVICO_BIOMETRICO_INDISPONIVEL);
        }

        if (resposta == null) {
            log.warn("Resposta vazia do {} do Python", endpoint);
            throw new ErroApi(CodigoErro.SERVICO_BIOMETRICO_INDISPONIVEL);
        }
        return resposta;
    }

    private CodigoErro converterCodigo(String erroPython, Set<CodigoErro> permitidos, String endpoint) {
        try {
            CodigoErro codigo = CodigoErro.valueOf(erroPython);
            if (permitidos.contains(codigo)) {
                return codigo;
            }
        } catch (IllegalArgumentException | NullPointerException e) {
            // cai no log abaixo
        }
        log.error("Código de erro fora do contrato vindo do {} do Python: {}", endpoint, erroPython);
        return CodigoErro.ERRO_INTERNO;
    }
}