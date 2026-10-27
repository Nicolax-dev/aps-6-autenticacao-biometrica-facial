package br.aps6.api.service;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.aps6.api.client.BiometriaClient;
import br.aps6.api.dto.CadastroRequest;
import br.aps6.api.dto.CadastroResponse;
import br.aps6.api.exception.CodigoErro;
import br.aps6.api.exception.ErroApi;
import br.aps6.api.model.Cargo;
import br.aps6.api.model.Usuario;
import br.aps6.api.repository.CargoRepository;
import br.aps6.api.repository.UsuarioRepository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Regra do cadastro
 */

@Service
public class UsuarioService {

    private static final int CARGO_PADRAO_ID = 1;

    // Limite do algoritmo BCrypt
    static final int TAMANHO_MAXIMO_SENHA_BYTES = 72;

    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

    private final UsuarioRepository usuarioRepository;
    private final CargoRepository cargoRepository;
    private final ValidadorImagem validadorImagem;
    private final BiometriaClient biometriaClient;
    private final PasswordEncoder passwordEncoder;
    private final JsonMapper jsonMapper;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          CargoRepository cargoRepository,
                          ValidadorImagem validadorImagem,
                          BiometriaClient biometriaClient,
                          PasswordEncoder passwordEncoder,
                          JsonMapper jsonMapper) {
        this.usuarioRepository = usuarioRepository;
        this.cargoRepository = cargoRepository;
        this.validadorImagem = validadorImagem;
        this.biometriaClient = biometriaClient;
        this.passwordEncoder = passwordEncoder;
        this.jsonMapper = jsonMapper;
    }

    public CadastroResponse cadastrar(CadastroRequest request) {
        String email = request.email().trim().toLowerCase();
        String nome = request.nome().trim();

        if (request.senha().getBytes(StandardCharsets.UTF_8).length > TAMANHO_MAXIMO_SENHA_BYTES) {
            throw new ErroApi(CodigoErro.DADOS_INVALIDOS);
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new ErroApi(CodigoErro.EMAIL_JA_CADASTRADO);
        }

        String imagemBase64 = validadorImagem.validar(request.imagemBase64());

        List<Double> encoding = biometriaClient.gerarEncoding(imagemBase64);

        Cargo cargoPadrao = cargoRepository.findById(CARGO_PADRAO_ID)
                .orElseThrow(() -> new IllegalStateException(
                        "Cargo padrão (id " + CARGO_PADRAO_ID + ") não existe: o seed.sql rodou?"));

        Usuario usuario = new Usuario(
                nome,
                email,
                passwordEncoder.encode(request.senha()),
                cargoPadrao,
                jsonMapper.writeValueAsString(encoding));

        try {
            usuario = usuarioRepository.save(usuario);
        } catch (DataIntegrityViolationException e) {
            throw new ErroApi(CodigoErro.EMAIL_JA_CADASTRADO);
        }

        log.info("Usuário cadastrado: id={}", usuario.getId());
        return CadastroResponse.de(usuario);
    }
}