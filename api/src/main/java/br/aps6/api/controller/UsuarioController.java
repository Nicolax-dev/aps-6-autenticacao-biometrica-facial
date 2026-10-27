package br.aps6.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.aps6.api.dto.CadastroRequest;
import br.aps6.api.dto.CadastroResponse;
import br.aps6.api.service.UsuarioService;
import jakarta.validation.Valid;

/** Só HTTP: recebe o JSON, chama o service e devolve. Regras ficam no UsuarioService. */
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<CadastroResponse> cadastrar(@Valid @RequestBody CadastroRequest request) {
        CadastroResponse resposta = usuarioService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }
}