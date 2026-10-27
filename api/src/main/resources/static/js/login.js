const URL_CREDENCIAIS = "/login/credenciais";
const URL_VERIFICAR = "/login/verificar";

const TEXTO_BOTAO_CONTINUAR = "Continuar";
const TEXTO_BOTAO_CONTINUAR_ENVIANDO = "Conferindo...";
const TEXTO_BOTAO_ENTRAR = "Entrar";
const TEXTO_BOTAO_ENTRAR_ENVIANDO = "Verificando...";

const CODIGO_CREDENCIAIS_INVALIDAS = "CREDENCIAIS_INVALIDAS";

// formulário
const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("form-login");
const botaoContinuar = document.getElementById("botao-continuar");
const divErroLogin = document.getElementById("erro-login");
const camposLogin = {
    email: document.getElementById("email"),
    senha: document.getElementById("senha"),
};

// popup da foto
const popupFoto = document.getElementById("popup-foto");
const divErroPopup = document.getElementById("erro-popup");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoEntrar = document.getElementById("botao-entrar");

// resultado
const telaResultado = document.getElementById("tela-resultado");
const tituloSaudacao = document.getElementById("saudacao");
const listaInformacoes = document.getElementById("lista-informacoes");
const botaoSair = document.getElementById("botao-sair");

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

function mostrarMensagem(caixa, mensagem) {
    caixa.textContent = mensagem ?? "";
    caixa.hidden = mensagem === null;
}

function mostrarErroNaTelaDeLogin(codigo) {
    mostrarMensagem(divErroLogin, mensagemDoErro(codigo));
    if (codigo === CODIGO_CREDENCIAIS_INVALIDAS) {
        camposLogin.senha.value = "";
        camposLogin.senha.focus();
    }
}

// ---------- Validação local ----------

function validarFormulario() {
    const erros = {};

    if (camposLogin.email.value.trim() === "") {
        erros.email = "Informe o email.";
    }
    if (camposLogin.senha.value.trim() === "") {
        erros.senha = "Informe a senha.";
    }

    for (const nome in camposLogin) {
        if (erros[nome]) {
            mostrarErroCampo(camposLogin[nome], erros[nome]);
        } else {
            limparErroCampo(camposLogin[nome]);
        }
    }

    const primeiroComErro = Object.keys(erros)[0];
    if (primeiroComErro) {
        camposLogin[primeiroComErro].focus();
    }

    return primeiroComErro === undefined;
}

// ---------- Requisições ----------

function lerCredenciais() {
    return {
        email: camposLogin.email.value.trim(),
        senha: camposLogin.senha.value,
    };
}

/** POST com JSON. Devolve a resposta, ou null se nem chegou resposta (Java fora do ar, sem rede). */
async function postarJson(url, dados) {
    try {
        return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });
    } catch (erro) {
        console.warn("Falha de conexão no login:", erro.message);
        return null;
    }
}

async function lerCorpoJson(resposta) {
    try {
        return await resposta.json();
    } catch {
        return null;
    }
}

function definirEnviandoCredenciais(ativo) {
    enviando = ativo;
    botaoContinuar.disabled = ativo;
    botaoContinuar.textContent = ativo ? TEXTO_BOTAO_CONTINUAR_ENVIANDO : TEXTO_BOTAO_CONTINUAR;
}

function definirEnviandoVerificacao(ativo) {
    enviando = ativo;
    botaoEntrar.disabled = ativo || obterFoto() === null;
    botaoEntrar.textContent = ativo ? TEXTO_BOTAO_ENTRAR_ENVIANDO : TEXTO_BOTAO_ENTRAR;
    botaoCancelar.disabled = ativo;
}

async function conferirCredenciais() {
    mostrarMensagem(divErroLogin, null);
    definirEnviandoCredenciais(true);

    try {
        const resposta = await postarJson(URL_CREDENCIAIS, lerCredenciais());
        if (resposta === null) {
            mostrarMensagem(divErroLogin, MENSAGEM_ERRO_CONEXAO);
            return;
        }

        if (resposta.status === 204) {
            abrirPopup();
            return;
        }

        const corpo = await lerCorpoJson(resposta);
        console.warn("Login recusado:", resposta.status, corpo?.erro);
        mostrarErroNaTelaDeLogin(corpo?.erro);
    } finally {
        definirEnviandoCredenciais(false);
    }
}

async function verificarRosto() {
    const credenciais = lerCredenciais();
    const dados = {
        email: credenciais.email,
        senha: credenciais.senha,
        imagem_base64: obterFoto(),
    };

    mostrarMensagem(divErroPopup, null);
    definirEnviandoVerificacao(true);

    try {
        const resposta = await postarJson(URL_VERIFICAR, dados);
        if (resposta === null) {
            mostrarMensagem(divErroPopup, MENSAGEM_ERRO_CONEXAO);
            return;
        }

        const corpo = await lerCorpoJson(resposta);

        if (resposta.status === 200 && corpo !== null) {
            loginConcluido(corpo);
            return;
        }

        console.warn("Login recusado:", resposta.status, corpo?.erro);

        if (corpo?.erro === CODIGO_CREDENCIAIS_INVALIDAS) {
            popupFoto.close();
            mostrarErroNaTelaDeLogin(corpo.erro);
        } else {
            mostrarMensagem(divErroPopup, mensagemDoErro(corpo?.erro));
        }
    } finally {
        definirEnviandoVerificacao(false);
    }
}

// ---------- Popup ----------

function abrirPopup() {
    mostrarMensagem(divErroPopup, null);
    popupFoto.showModal();
}

// ---------- Resultado ----------

/** Monta um item da lista: título + etiqueta do nível + conteúdo (tudo com textContent). */
function criarItemInformacao(informacao) {
    const titulo = document.createElement("h3");
    titulo.textContent = informacao.titulo;

    const nivel = document.createElement("span");
    nivel.className = "etiqueta-nivel";
    nivel.textContent = `Nível ${informacao.nivel_acesso}`;

    const cabecalho = document.createElement("div");
    cabecalho.className = "cabecalho-informacao";
    cabecalho.append(titulo, nivel);

    const conteudo = document.createElement("p");
    conteudo.textContent = informacao.conteudo;

    const item = document.createElement("li");
    item.append(cabecalho, conteudo);
    return item;
}

function loginConcluido(usuario) {
    popupFoto.close();
    formLogin.reset();

    tituloSaudacao.textContent =
        `Olá, ${usuario.nome}! Seu cargo: ${usuario.cargo} (nível ${usuario.nivel_acesso}).`;

    listaInformacoes.replaceChildren(); // esvazia a lista
    for (const informacao of usuario.informacoes) {
        listaInformacoes.append(criarItemInformacao(informacao));
    }

    telaLogin.hidden = true;
    telaResultado.hidden = false;
}

/** Sair: tira os dados protegidos da página e volta ao formulário. */
function sair() {
    listaInformacoes.replaceChildren();
    tituloSaudacao.textContent = "";
    telaResultado.hidden = true;
    telaLogin.hidden = false;
    camposLogin.email.focus();
}

// ---------- Eventos ----------

configurarCapturaFoto({
    aoMudarFoto: (temFoto) => {
        botaoEntrar.disabled = enviando || !temFoto;
    },
    aoErroCamera: (mensagem) => mostrarMensagem(divErroPopup, mensagem),
});

for (const nome in camposLogin) {
    camposLogin[nome].addEventListener("input", () => limparErroCampo(camposLogin[nome]));
}

formLogin.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (enviando) {
        return;
    }
    if (!validarFormulario()) {
        return;
    }
    conferirCredenciais();
});

botaoEntrar.addEventListener("click", () => {
    if (enviando || obterFoto() === null) {
        return;
    }
    verificarRosto();
});

botaoCancelar.addEventListener("click", () => popupFoto.close());

popupFoto.addEventListener("cancel", (evento) => {
    if (enviando) {
        evento.preventDefault();
    }
});

popupFoto.addEventListener("close", limparFoto);

botaoSair.addEventListener("click", sair);