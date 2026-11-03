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
const textoCargo = document.getElementById("texto-cargo");
const textoNivel = document.getElementById("texto-nivel");
const nomeUsuarioTopo = document.getElementById("nome-usuario-topo");
const cargoUsuarioTopo = document.getElementById("cargo-usuario-topo");
const inicialUsuario = document.getElementById("inicial-usuario");
const listaInformacoes = document.getElementById("lista-informacoes"); // recebe um grupo por nível
const botaoSair = document.getElementById("botao-sair");

// Texto do cabeçalho de cada grupo (só exibição: quem decide o que aparece é a API)
const QUEM_ACESSA_NIVEL = {
    1: "Todos os cargos",
    2: "Diretores de divisão e ministro",
    3: "Somente o ministro",
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

// POST com JSON. Devolve a resposta, ou null se nem chegou resposta (Java fora do ar, sem rede).
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

/** Monta um item da lista: título + conteúdo (tudo com textContent). O nível fica no cabeçalho do grupo. */
function criarItemInformacao(informacao) {
    const titulo = document.createElement("h3");
    titulo.textContent = informacao.titulo;

    const conteudo = document.createElement("p");
    conteudo.textContent = informacao.conteudo;

    const item = document.createElement("li");
    item.append(titulo, conteudo);
    return item;
}

// Monta o grupo de um nível
function criarGrupoNivel(nivel, informacoes) {
    const selo = document.createElement("span");
    selo.className = "selo-nivel";
    selo.setAttribute("aria-hidden", "true");
    selo.textContent = nivel;

    const titulo = document.createElement("h2");
    titulo.textContent = `Nível ${nivel}`;

    const quem = document.createElement("span");
    quem.className = "grupo-quem";
    quem.textContent = QUEM_ACESSA_NIVEL[nivel] ?? "";

    const titulos = document.createElement("div");
    titulos.className = "grupo-titulos";
    titulos.append(titulo, quem);

    const total = document.createElement("span");
    total.className = "grupo-total";
    total.textContent = informacoes.length === 1 ? "1 informação" : `${informacoes.length} informações`;

    const cabecalho = document.createElement("div");
    cabecalho.className = "grupo-cabecalho";
    cabecalho.append(selo, titulos, total);

    const lista = document.createElement("ul");
    lista.className = "lista-informacoes";
    for (const informacao of informacoes) {
        lista.append(criarItemInformacao(informacao));
    }

    const grupo = document.createElement("section");
    grupo.className = "grupo-nivel";
    grupo.dataset.nivel = nivel; // define a cor do selo pelo CSS
    grupo.append(cabecalho, lista);
    return grupo;
}

// Separa as informações recebidas por nível, do mais restrito (3) ao mais aberto (1).
function agruparPorNivel(informacoes) {
    const grupos = new Map();
    for (const informacao of informacoes) {
        const nivel = informacao.nivel_acesso;
        if (!grupos.has(nivel)) {
            grupos.set(nivel, []);
        }
        grupos.get(nivel).push(informacao);
    }
    return [...grupos.entries()].sort(([nivelA], [nivelB]) => nivelB - nivelA);
}

function loginConcluido(usuario) {
    popupFoto.close();
    formLogin.reset();

    tituloSaudacao.textContent = `Olá, ${usuario.nome}`;
    textoCargo.textContent = usuario.cargo;
    textoNivel.textContent = usuario.nivel_acesso;
    nomeUsuarioTopo.textContent = usuario.nome;
    cargoUsuarioTopo.textContent = `${usuario.cargo} · Nível ${usuario.nivel_acesso}`;
    inicialUsuario.textContent = usuario.nome.trim().charAt(0).toUpperCase();
    telaResultado.dataset.nivel = usuario.nivel_acesso; // pinta o medidor pelo CSS

    listaInformacoes.replaceChildren(); // esvazia a lista
    for (const [nivel, informacoes] of agruparPorNivel(usuario.informacoes)) {
        listaInformacoes.append(criarGrupoNivel(nivel, informacoes));
    }
    if (usuario.informacoes.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "lista-vazia";
        vazio.textContent = "Nenhuma informação cadastrada para o seu nível no momento.";
        listaInformacoes.append(vazio);
    }

    telaLogin.hidden = true;
    telaResultado.hidden = false;
    window.scrollTo(0, 0);
    tituloSaudacao.focus();
}

/** Sair: tira os dados protegidos da página e volta ao formulário. */
function sair() {
    listaInformacoes.replaceChildren();
    tituloSaudacao.textContent = "";
    textoCargo.textContent = "";
    textoNivel.textContent = "";
    nomeUsuarioTopo.textContent = "";
    cargoUsuarioTopo.textContent = "";
    inicialUsuario.textContent = "";
    delete telaResultado.dataset.nivel;
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