// Captura de foto pela câmera, usada no cadastro e no login. A página precisa ter os
// elementos com os ids abaixo e chamar configurarCapturaFoto(...) para ser avisada
// quando a foto muda e quando a câmera falha.

const LARGURA_IDEAL_CAMERA = 640;
const ALTURA_IDEAL_CAMERA = 480;
const QUALIDADE_JPEG = 0.9;

const videoCamera = document.getElementById("video-camera");
const previewFoto = document.getElementById("preview-foto");
const botaoLigarCamera = document.getElementById("botao-ligar-camera");
const botaoCapturar = document.getElementById("botao-capturar");
const botaoTirarOutra = document.getElementById("botao-tirar-outra");

let streamCamera = null;
let fotoBase64 = null;

let aoMudarFoto = () => {};
let aoErroCamera = () => {};

function configurarCapturaFoto(funcoes) {
    aoMudarFoto = funcoes.aoMudarFoto;
    aoErroCamera = funcoes.aoErroCamera;
}

function obterFoto() {
    return fotoBase64;
}

async function ligarCamera() {
    try {
        streamCamera = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: LARGURA_IDEAL_CAMERA },
                height: { ideal: ALTURA_IDEAL_CAMERA },
                facingMode: "user", // câmera frontal
            },
            audio: false,
        });
    } catch (erro) {
        console.warn("Falha ao abrir a câmera:", erro.name);
        aoErroCamera(MENSAGEM_ERRO_CAMERA);
        return;
    }

    aoErroCamera(null);
    videoCamera.srcObject = streamCamera;
    mostrarEstado("camera");
}

function capturarFoto() {
    if (videoCamera.videoWidth === 0) {
        return;
    }

    // Desenha o quadro atual do vídeo num canvas e converte para JPEG em base64
    const canvas = document.createElement("canvas");
    canvas.width = videoCamera.videoWidth;
    canvas.height = videoCamera.videoHeight;
    canvas.getContext("2d").drawImage(videoCamera, 0, 0);
    fotoBase64 = canvas.toDataURL("image/jpeg", QUALIDADE_JPEG);

    previewFoto.src = fotoBase64;
    desligarCamera();
    mostrarEstado("foto");
    aoMudarFoto(true);
}

function tirarOutra() {
    fotoBase64 = null;
    aoMudarFoto(false);
    ligarCamera();
}

// Volta ao estado inicial: sem foto e câmera desligada (após o cadastro e ao fechar o popup do login).
function limparFoto() {
    fotoBase64 = null;
    previewFoto.removeAttribute("src");
    desligarCamera();
    mostrarEstado("inicial");
    aoMudarFoto(false);
}

function desligarCamera() {
    if (streamCamera) {
        streamCamera.getTracks().forEach((trilha) => trilha.stop()); // apaga a luz da câmera
        streamCamera = null;
    }
    videoCamera.srcObject = null;
}

/** Mostra só os elementos de cada estado: "inicial", "camera" (vídeo ao vivo) ou "foto" (preview). */
function mostrarEstado(estado) {
    botaoLigarCamera.hidden = estado !== "inicial";
    videoCamera.hidden = estado !== "camera";
    botaoCapturar.hidden = estado !== "camera";
    previewFoto.hidden = estado !== "foto";
    botaoTirarOutra.hidden = estado !== "foto";
}

botaoLigarCamera.addEventListener("click", ligarCamera);
botaoCapturar.addEventListener("click", capturarFoto);
botaoTirarOutra.addEventListener("click", tirarOutra);
mostrarEstado("inicial");