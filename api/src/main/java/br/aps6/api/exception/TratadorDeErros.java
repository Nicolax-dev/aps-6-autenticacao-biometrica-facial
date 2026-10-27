package br.aps6.api.exception;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import br.aps6.api.dto.ErroResponse;

/**
 * Converte exceções em { "erro": "CODIGO" } + status HTTP (tabela em CodigoErro).
 * O Spring chama o método mais específico para cada tipo de exceção.
 */
@RestControllerAdvice
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    /** Erros de negócio lançados pelo nosso código. */
    @ExceptionHandler(ErroApi.class)
    public ResponseEntity<ErroResponse> erroApi(ErroApi e) {
        return responder(e.getCodigo());
    }

    /** @Valid falhou (campo vazio, email mal formado, senha curta...). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException e) {
        List<String> campos = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getField)
                .toList();
        log.info("Request com dados inválidos nos campos: {}", campos);
        return responder(CodigoErro.DADOS_INVALIDOS);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> jsonInvalido(HttpMessageNotReadableException e) {
        log.info("Request com JSON inválido ou ausente");
        return responder(CodigoErro.DADOS_INVALIDOS);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> inesperado(Exception e) {
        if (e instanceof ErrorResponse erroSpring) {
            return ResponseEntity.status(erroSpring.getStatusCode()).body(erroSpring.getBody());
        }
        log.error("Erro inesperado", e); // com stack trace, para diagnóstico
        return responder(CodigoErro.ERRO_INTERNO);
    }

    private ResponseEntity<ErroResponse> responder(CodigoErro codigo) {
        return ResponseEntity.status(codigo.getStatus()).body(new ErroResponse(codigo.name()));
    }
}