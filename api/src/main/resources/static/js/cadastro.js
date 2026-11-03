// Mesmo mínimo do CadastroRequest (Java): alterar nos dois
const TAMANHO_MINIMO_SENHA = 6;

// Mesma origem: o próprio Spring serve esta página e a API
const URL_CADASTRO = "/usuarios";

const TEXTO_BOTAO = "Cadastrar";
const TEXTO_BOTAO_ENVIANDO = "Cadastrando...";

const formulario = document.getElementById("form-cadastro");
const botaoCadastrar = document.getElementById("botao-cadastrar");
const divErroCadastro = document.getElementById("erro-cadastro");
const divSucessoCadastro = document.getElementById("sucesso-cadastro");

// Cartão de cadastro concluído (aparece no lugar do formulário)
const cabecalhoCadastro = document.getElementById("cabecalho-cadastro");
const cartaoConcluido = document.getElementById("cadastro-concluido");
const tituloConcluido = document.getElementById("titulo-concluido");
const concluidoNome = document.getElementById("concluido-nome");
const concluidoCargo = document.getElementById("concluido-cargo");
const concluidoSelo = document.getElementById("concluido-selo");
const concluidoNivelTexto = document.getElementById("concluido-nivel-texto");
const botaoNovoCadastro = document.getElementById("botao-novo-cadastro");

const campos = {
    nome: document.getElementById("nome"),
    email: document.getElementById("email"),
    senha: document.getElementById("senha"),
    confirmarSenha: document.getElementById("confirmar-senha"),
};

let enviando = false; // true enquanto a requisição está em andamento (evita duplo envio)

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

    // Mostra ou limpa a mensagem de cada campo
    for (const nome in campos) {
        if (erros[nome]) {
            mostrarErroCampo(campos[nome], erros[nome]);
        } else {
            limparErroCampo(campos[nome]);
        }
    }

    // Leva o cursor para o primeiro campo com erro
    const primeiroComErro = Object.keys(erros)[0];
    if (primeiroComErro) {
        campos[primeiroComErro].focus();
    }

    return primeiroComErro === undefined;
}

// ---------- Envio ----------

/** Liga/desliga o estado "Cadastrando..." no botão. */
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
        definirEnviando(false); // sempre volta ao normal, com sucesso ou erro
    }
}

function cadastroConcluido(usuario) {
    concluidoNome.textContent = usuario.nome;
    concluidoCargo.textContent = usuario.cargo;
    concluidoSelo.textContent = usuario.nivel_acesso;
    concluidoSelo.dataset.nivel = usuario.nivel_acesso; // cor do selo pelo CSS
    concluidoNivelTexto.textContent = `Nível ${usuario.nivel_acesso}`;

    formulario.reset();
    limparFoto();

    // Esconde o formulário e mostra o cartão no lugar
    cabecalhoCadastro.hidden = true;
    formulario.hidden = true;
    cartaoConcluido.hidden = false;
    window.scrollTo(0, 0);
    tituloConcluido.focus(); // o leitor de tela anuncia "Cadastro criado"
}

function novoCadastro() {
    cartaoConcluido.hidden = true;
    concluidoNome.textContent = "";
    concluidoCargo.textContent = "";
    concluidoSelo.textContent = "";
    delete concluidoSelo.dataset.nivel;
    concluidoNivelTexto.textContent = "";

    cabecalhoCadastro.hidden = false;
    formulario.hidden = false;
    campos.nome.focus();
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
    evento.preventDefault(); // impede o navegador de recarregar a página

    // Defesas: duplo envio
    if (enviando || obterFoto() === null) {
        return;
    }
    if (!validarFormulario()) {
        return;
    }
    enviarCadastro();
});

botaoNovoCadastro.addEventListener("click", novoCadastro);