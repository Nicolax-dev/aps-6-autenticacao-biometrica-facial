package br.aps6.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Tabela de erros da API (cadastro e login).
 * Uma fonte só: o status HTTP de cada código é definido aqui e em nenhum outro lugar.
 * Os nomes batem 1:1 com os códigos do Python e do frontend (MENSAGENS_ERRO).
 */
public enum CodigoErro {

    IMAGEM_INVALIDA(HttpStatus.BAD_REQUEST),
    DADOS_INVALIDOS(HttpStatus.BAD_REQUEST),
    CREDENCIAIS_INVALIDAS(HttpStatus.UNAUTHORIZED), 
    CONFIANCA_ABAIXO_LIMIAR(HttpStatus.UNAUTHORIZED), 
    EMAIL_JA_CADASTRADO(HttpStatus.CONFLICT),
    NENHUM_ROSTO_DETECTADO(HttpStatus.UNPROCESSABLE_CONTENT),
    MULTIPLOS_ROSTOS_DETECTADOS(HttpStatus.UNPROCESSABLE_CONTENT),
    SERVICO_BIOMETRICO_INDISPONIVEL(HttpStatus.SERVICE_UNAVAILABLE),
    ERRO_INTERNO(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    CodigoErro(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}