package br.aps6.api.service;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.aps6.api.client.BiometriaClient;
import br.aps6.api.dto.CredenciaisRequest;
import br.aps6.api.dto.LoginResponse;
import br.aps6.api.dto.VerificacaoRequest;
import br.aps6.api.exception.CodigoErro;
import br.aps6.api.exception.ErroApi;
import br.aps6.api.model.Informacao;
import br.aps6.api.model.LogAcesso;
import br.aps6.api.model.Usuario;
import br.aps6.api.repository.InformacaoRepository;
import br.aps6.api.repository.LogAcessoRepository;
import br.aps6.api.repository.UsuarioRepository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Sem @Transactional de propósito: cada save() do log roda e confirma na própria transação,
 * então a linha fica gravada mesmo quando, logo depois, uma exceção vira resposta de erro.
 */
@Service
public class LoginService {

    private static final Logger log = LoggerFactory.getLogger(LoginService.class);

    private final UsuarioRepository usuarioRepository;
    private final LogAcessoRepository logAcessoRepository;
    private final InformacaoRepository informacaoRepository;
    private final ValidadorImagem validadorImagem;
    private final BiometriaClient biometriaClient;
    private final PasswordEncoder passwordEncoder;
    private final JsonMapper jsonMapper;

    public LoginService(UsuarioRepository usuarioRepository,
                        LogAcessoRepository logAcessoRepository,
                        InformacaoRepository informacaoRepository,
                        ValidadorImagem validadorImagem,
                        BiometriaClient biometriaClient,
                        PasswordEncoder passwordEncoder,
                        JsonMapper jsonMapper) {
        this.usuarioRepository = usuarioRepository;
        this.logAcessoRepository = logAcessoRepository;
        this.informacaoRepository = informacaoRepository;
        this.validadorImagem = validadorImagem;
        this.biometriaClient = biometriaClient;
        this.passwordEncoder = passwordEncoder;
        this.jsonMapper = jsonMapper;
    }

    // POST /login/credenciais
    public void conferirCredenciais(CredenciaisRequest request) {
        autenticar(request.email(), request.senha());
    }

    public LoginResponse verificar(VerificacaoRequest request) {
        Usuario usuario = autenticar(request.email(), request.senha());

        List<Double> encodingCadastrado = lerEncoding(usuario);

        double confianca;
        try {
            String imagemBase64 = validadorImagem.validar(request.imagemBase64());
            confianca = biometriaClient.verificar(imagemBase64, encodingCadastrado);
        } catch (ErroApi e) {
            if (e.getCodigo() == CodigoErro.ERRO_INTERNO) {
                throw e;
            }
            throw registrarFalha(usuario, e.getCodigo());
        }

        logAcessoRepository.save(LogAcesso.sucesso(usuario, confianca));
        log.info("Login concluído: usuario_id={}, nivel_acesso={}",
                usuario.getId(), usuario.getCargo().getNivelAcesso());

        List<Informacao> informacoes = informacaoRepository
                .findByNivelAcessoLessThanEqualOrderByNivelAcessoAscIdAsc(usuario.getCargo().getNivelAcesso());

        return LoginResponse.de(usuario, informacoes);
    }

    Usuario autenticar(String emailDigitado, String senha) {
        String email = emailDigitado.trim().toLowerCase();

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) {
            throw registrarFalha(null, CodigoErro.CREDENCIAIS_INVALIDAS);
        }

        if (!usuario.getAtivo() || !senhaConfere(senha, usuario)) {
            throw registrarFalha(usuario, CodigoErro.CREDENCIAIS_INVALIDAS);
        }
        return usuario;
    }

    private boolean senhaConfere(String senha, Usuario usuario) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > UsuarioService.TAMANHO_MAXIMO_SENHA_BYTES) {
            return false;
        }
        return passwordEncoder.matches(senha, usuario.getSenhaHash());
    }

    private List<Double> lerEncoding(Usuario usuario) {
        return List.of(jsonMapper.readValue(usuario.getEncodingFacial(), Double[].class));
    }

    private ErroApi registrarFalha(Usuario usuario, CodigoErro motivo) {
        logAcessoRepository.save(LogAcesso.falha(usuario, motivo));
        log.info("Login recusado: {} (usuario_id={})", motivo, usuario == null ? null : usuario.getId());
        return new ErroApi(motivo);
    }
}