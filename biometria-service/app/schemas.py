"""Formato dos requests e responses (contrato da seção 7 do contexto)."""

from typing import Annotated

from pydantic import BaseModel, Field

# Facenet sempre gera vetores de 128 números
Encoding = Annotated[list[float], Field(min_length=128, max_length=128)]


# ---------- POST /encoding (cadastro) ----------

class EncodingRequest(BaseModel):
    imagem_base64: str


class EncodingResponse(BaseModel):
    sucesso: bool
    quantidade_rostos: int
    encoding: list[float] | None
    erro: str | None


# ---------- POST /verificar (login, comparação 1:1) ----------

class VerificarRequest(BaseModel):
    imagem_base64: str
    encoding_cadastrado: Encoding


class VerificarResponse(BaseModel):
    sucesso: bool
    confianca: float | None
    erro: str | None