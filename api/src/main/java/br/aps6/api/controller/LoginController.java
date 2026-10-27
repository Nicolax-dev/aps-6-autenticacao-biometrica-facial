package br.aps6.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.aps6.api.dto.CredenciaisRequest;
import br.aps6.api.dto.LoginResponse;
import br.aps6.api.dto.VerificacaoRequest;
import br.aps6.api.service.LoginService;
import jakarta.validation.Valid;

/** Só HTTP. Regras ficam no LoginService. */
@RestController
@RequestMapping("/login")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/credenciais")
    public ResponseEntity<Void> credenciais(@Valid @RequestBody CredenciaisRequest request) {
        loginService.conferirCredenciais(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verificar")
    public ResponseEntity<LoginResponse> verificar(@Valid @RequestBody VerificacaoRequest request) {
        return ResponseEntity.ok(loginService.verificar(request));
    }
}