// Botão de mostrar/ocultar senha, usado no login e no cadastro.
// Cada botão aponta para o campo pelo id: <button data-mostrar-senha="senha">.
// Só muda o tipo do campo (password <-> text); o valor digitado não é tocado.

const botoesMostrarSenha = document.querySelectorAll("[data-mostrar-senha]");

function definirSenhaVisivel(botao, visivel) {
    const campo = document.getElementById(botao.dataset.mostrarSenha);
    campo.type = visivel ? "text" : "password";
    botao.setAttribute("aria-pressed", String(visivel));

    const nome = botao.getAttribute("aria-label").replace(/^(Mostrar|Ocultar)/, "");
    botao.setAttribute("aria-label", (visivel ? "Ocultar" : "Mostrar") + nome);
}

function ocultarTodasAsSenhas() {
    botoesMostrarSenha.forEach((botao) => definirSenhaVisivel(botao, false));
}

botoesMostrarSenha.forEach((botao) => {
    botao.addEventListener("click", () => {
        const visivel = botao.getAttribute("aria-pressed") !== "true";
        definirSenhaVisivel(botao, visivel);
    });

    const formulario = botao.closest("form");
    if (formulario) {
        formulario.addEventListener("submit", ocultarTodasAsSenhas);
        formulario.addEventListener("reset", ocultarTodasAsSenhas);
    }
});