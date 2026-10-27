package br.aps6.api.exception;

/**
 * Erro de negócio com código do contrato. Lançado em qualquer camada;
 * o TratadorDeErros converte em { "erro": "CODIGO" } + status HTTP.
 */
public class ErroApi extends RuntimeException {

    private final CodigoErro codigo;

    public ErroApi(CodigoErro codigo) {
        super(codigo.name());
        this.codigo = codigo;
    }

    public CodigoErro getCodigo() {
        return codigo;
    }
}