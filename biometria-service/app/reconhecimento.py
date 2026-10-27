"""Lógica de reconhecimento facial. Único arquivo que usa o DeepFace."""

import base64
import binascii
import logging

import cv2
import numpy as np
from deepface import DeepFace

MODEL_NAME = "Facenet"
DISTANCE_METRIC = "cosine"
DETECTOR_BACKEND = "opencv"   # detector padrão do DeepFace: leve e sem download extra
LIMIAR_DISTANCIA = 0.40       # padrão do DeepFace para Facenet + cosine (não recalibrado)

log = logging.getLogger("uvicorn.error")  # aparece no "docker compose logs"


class ErroBiometria(Exception):
    """Resultado negativo de domínio (vira 200 com sucesso=false, não erro HTTP)."""

    def __init__(self, codigo: str, quantidade_rostos: int = 0):
        super().__init__(codigo)
        self.codigo = codigo
        self.quantidade_rostos = quantidade_rostos


def carregar_modelo() -> None:
    """Carrega o Facenet na subida do serviço (baixa os pesos na 1ª vez).
    Sem isso, a 1ª requisição demoraria mais que o timeout de 5s do Java."""
    DeepFace.build_model(MODEL_NAME)
    log.info("Modelo %s carregado.", MODEL_NAME)


def decodificar_imagem(imagem_base64: str) -> np.ndarray:
    """base64 -> imagem do OpenCV. Lança IMAGEM_INVALIDA se não der."""

    if "," in imagem_base64:
        imagem_base64 = imagem_base64.split(",", 1)[1]

    try:
        dados = base64.b64decode(imagem_base64, validate=True)
    except (binascii.Error, ValueError):
        raise ErroBiometria("IMAGEM_INVALIDA")

    if not dados:
        raise ErroBiometria("IMAGEM_INVALIDA")

    imagem = cv2.imdecode(np.frombuffer(dados, dtype=np.uint8), cv2.IMREAD_COLOR)
    if imagem is None:
        raise ErroBiometria("IMAGEM_INVALIDA")
    return imagem


def gerar_encoding(imagem: np.ndarray) -> list[float]:
    """Detecta o rosto e devolve o vetor de 128 números do Facenet."""
    try:
        rostos = DeepFace.represent(
            img_path=imagem,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
        )
    except ValueError:
        raise ErroBiometria("NENHUM_ROSTO_DETECTADO", quantidade_rostos=0)

    if len(rostos) > 1:
        raise ErroBiometria("MULTIPLOS_ROSTOS_DETECTADOS", quantidade_rostos=len(rostos))

    return rostos[0]["embedding"]


def distancia_cosseno(a: list[float], b: list[float]) -> float:
    """0 = rostos idênticos, 2 = totalmente opostos."""
    a, b = np.array(a), np.array(b)
    return float(1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def distancia_para_confianca(distancia: float) -> float:
    """Converte para 0..1, 'quanto maior, melhor'. Truncada nos limites."""
    return max(0.0, min(1.0, 1 - distancia / 2))


def verificar(imagem: np.ndarray, encoding_cadastrado: list[float]) -> float:
    """Comparação 1:1. Devolve a confiança ou lança CONFIANCA_ABAIXO_LIMIAR."""
    encoding_novo = gerar_encoding(imagem)
    distancia = distancia_cosseno(encoding_novo, encoding_cadastrado)
    confianca = distancia_para_confianca(distancia)

    # Só números no log, nunca o encoding (é dado biométrico)
    log.info("verificar: distancia=%.4f confianca=%.4f limiar=%.2f",
             distancia, confianca, LIMIAR_DISTANCIA)

    if distancia > LIMIAR_DISTANCIA:
        raise ErroBiometria("CONFIANCA_ABAIXO_LIMIAR")
    return confianca