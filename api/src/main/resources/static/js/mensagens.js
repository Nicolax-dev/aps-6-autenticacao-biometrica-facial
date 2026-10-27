const MENSAGEM_ERRO_CAMERA =
    "Não foi possível acessar a câmera. Verifique se o navegador tem permissão " +
    "e se nenhum outro programa está usando a câmera.";

const MENSAGEM_ERRO_CONEXAO =
    "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

const MENSAGEM_ERRO_INESPERADO = "Erro inesperado. Tente novamente.";

const MENSAGENS_ERRO = {
    DADOS_INVALIDOS: "Verifique os dados preenchidos.",
    EMAIL_JA_CADASTRADO: "Este email já está cadastrado.",
    CREDENCIAIS_INVALIDAS: "Email ou senha inválido.",
    IMAGEM_INVALIDA: "Não foi possível processar a foto. Tire outra foto.",
    NENHUM_ROSTO_DETECTADO: "Não conseguimos identificar um rosto na foto. Tire outra foto.",
    MULTIPLOS_ROSTOS_DETECTADOS: "Mais de um rosto detectado. Certifique-se de que só você aparece na foto.",
    CONFIANCA_ABAIXO_LIMIAR: "Não foi possível confirmar sua identidade. Tente novamente.",
    SERVICO_BIOMETRICO_INDISPONIVEL:
        "O serviço de reconhecimento facial está indisponível no momento. Tente novamente em instantes.",
};

function mensagemDoErro(codigo) {
    return MENSAGENS_ERRO[codigo] ?? MENSAGEM_ERRO_INESPERADO;
}