const TAMANHO_MINIMO_SENHA = 6;
const URL_CADASTRO = "/usuarios";

const TEXTO_BOTAO = "Cadastrar";
const TEXTO_BOTAO_ENVIANDO = "Cadastrando...";

const formulario = document.getElementById("form-cadastro");
const botaoCadastrar = document.getElementById("botao-cadastrar");
const divErroCadastro = document.getElementById("erro-cadastro");
const divSucessoCadastro = document.getElementById("sucesso-cadastro");

const campos = {
    nome: document.getElementById("nome"),
    email: document.getElementById("email"),
    senha: document.getElementById("senha"),
    confirmarSenha: document.getElementById("confirmar-senha"),
};

let enviando = false;

// ---------- Mensagens na tela ----------

function mostrarErroCampo(campo, mensagem) {
    document.getElementById("erro-" + campo.id).textContent = mensagem;
    campo.classList.add("invalido");
}

function limparErroCampo(campo) {
    document.getElementById("erro-" + campo.id).textContent = "";
    campo.classList.remove("invalido");
}

function mostrarErroGeral(mensagem) {
    divErroCadastro.textContent = mensagem ?? "";
    divErroCadastro.hidden = mensagem === null;
}

function mostrarSucesso(mensagem) {
    divSucessoCadastro.textContent = mensagem ?? "";
    divSucessoCadastro.hidden = mensagem === null;
}

// ---------- Validação local ----------

function validarFormulario() {
    const erros = {};

    if (campos.nome.value.trim() === "") {
        erros.nome = "Informe o nome.";
    }

    if (campos.email.value.trim() === "") {
        erros.email = "Informe o email.";
    } else if (!campos.email.checkValidity()) {
        erros.email = "Email em formato inválido.";
    }

    if (campos.senha.value.trim() === "") {
        erros.senha = "Informe a senha.";
    } else if (campos.senha.value.length < TAMANHO_MINIMO_SENHA) {
        erros.senha = `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    }

    if (campos.confirmarSenha.value === "") {
        erros.confirmarSenha = "Confirme a senha.";
    } else if (campos.confirmarSenha.value !== campos.senha.value) {
        erros.confirmarSenha = "As senhas não coincidem.";
    }

    for (const nome in campos) {
        if (erros[nome]) {
            mostrarErroCampo(campos[nome], erros[nome]);
        } else {
            limparErroCampo(campos[nome]);
        }
    }

    const primeiroComErro = Object.keys(erros)[0];
    if (primeiroComErro) {
        campos[primeiroComErro].focus();
    }

    return primeiroComErro === undefined;
}

// ---------- Envio ----------

function definirEnviando(ativo) {
    enviando = ativo;
    botaoCadastrar.textContent = ativo ? TEXTO_BOTAO_ENVIANDO : TEXTO_BOTAO;
    botaoCadastrar.disabled = ativo || obterFoto() === null;
}

async function lerCorpoJson(resposta) {
    try {
        return await resposta.json();
    } catch {
        return null;
    }
}

async function enviarCadastro() {
    const dados = {
        nome: campos.nome.value.trim(),
        email: campos.email.value.trim(),
        senha: campos.senha.value,
        imagem_base64: obterFoto(),
    };

    mostrarErroGeral(null);
    mostrarSucesso(null);
    definirEnviando(true);

    try {
        let resposta;
        try {
            resposta = await fetch(URL_CADASTRO, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados),
            });
        } catch (erro) {
            console.warn("Falha de conexão no cadastro:", erro.message);
            mostrarErroGeral(MENSAGEM_ERRO_CONEXAO);
            return;
        }

        const corpo = await lerCorpoJson(resposta);

        if (resposta.status === 201 && corpo !== null) {
            cadastroConcluido(corpo);
        } else {
            console.warn("Cadastro recusado:", resposta.status, corpo?.erro);
            mostrarErroGeral(mensagemDoErro(corpo?.erro));
        }
    } finally {
        definirEnviando(false);
    }
}

function cadastroConcluido(usuario) {
    mostrarSucesso(
        `Cadastro realizado, ${usuario.nome}! ` +
        `Você entrou como ${usuario.cargo} (nível ${usuario.nivel_acesso}).`
    );
    formulario.reset();
    limparFoto();
    divSucessoCadastro.scrollIntoView({ behavior: "smooth" });
}

// ---------- Eventos ----------

configurarCapturaFoto({
    aoMudarFoto: (temFoto) => {
        botaoCadastrar.disabled = enviando || !temFoto;
    },
    aoErroCamera: mostrarErroGeral,
});

for (const nome in campos) {
    campos[nome].addEventListener("input", () => limparErroCampo(campos[nome]));
}

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (enviando || obterFoto() === null) {
        return;
    }
    if (!validarFormulario()) {
        return;
    }
    enviarCadastro();
});