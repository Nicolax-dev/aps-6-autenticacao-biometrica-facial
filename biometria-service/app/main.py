"""API do serviço de biometria. Só recebe a requisição e devolve a resposta;
a lógica fica em reconhecimento.py."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import reconhecimento
from app.reconhecimento import ErroBiometria
from app.schemas import (
    EncodingRequest,
    EncodingResponse,
    VerificarRequest,
    VerificarResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    reconhecimento.carregar_modelo()  # roda uma vez, na subida
    yield


app = FastAPI(title="APS6 - Serviço de Biometria", lifespan=lifespan)


@app.get("/saude")
def saude():
    """Confirma que o serviço está no ar."""
    return {"status": "ok"}


@app.post("/encoding", response_model=EncodingResponse)
def gerar_encoding(req: EncodingRequest):
    """Cadastro: imagem -> encoding facial."""
    try:
        imagem = reconhecimento.decodificar_imagem(req.imagem_base64)
        encoding = reconhecimento.gerar_encoding(imagem)
    except ErroBiometria as e:
        return EncodingResponse(sucesso=False, quantidade_rostos=e.quantidade_rostos,
                                encoding=None, erro=e.codigo)

    return EncodingResponse(sucesso=True, quantidade_rostos=1,
                            encoding=encoding, erro=None)


@app.post("/verificar", response_model=VerificarResponse)
def verificar(req: VerificarRequest):
    """Login: compara a imagem nova com o encoding cadastrado (1:1)."""
    try:
        imagem = reconhecimento.decodificar_imagem(req.imagem_base64)
        confianca = reconhecimento.verificar(imagem, req.encoding_cadastrado)
    except ErroBiometria as e:
        return VerificarResponse(sucesso=False, confianca=None, erro=e.codigo)

    return VerificarResponse(sucesso=True, confianca=confianca, erro=None)