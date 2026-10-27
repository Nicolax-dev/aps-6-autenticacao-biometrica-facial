#!/usr/bin/env bash
# Gera o JSON do POST /verificar (serviço Python) a partir de uma foto.
# Uso:   scripts/gerar-json-verificar.sh <foto> <arquivo_saida>
#
# O encoding_cadastrado NÃO é gravado no arquivo: fica o marcador
# {{eu.response.body.$.encoding}}, que o REST Client substitui pelo encoding
# devolvido no teste A1 do requests/teste-service-biometria.http (# @name eu).
# Por isso o .http inclui estes arquivos com "<@" (com @ = processa variáveis).
#
# ATENÇÃO: a saída contém a foto em base64 (dado biométrico) -> gere sempre
# dentro de biometria-service/fotos/, que está fora do Git e da imagem Docker.
set -euo pipefail

if [ "$#" -ne 2 ]; then
    echo "Uso: $0 <foto> <arquivo_saida>" >&2
    exit 1
fi

FOTO="$1"
SAIDA="$2"

if [ ! -f "$FOTO" ]; then
    echo "Foto não encontrada: $FOTO" >&2
    exit 1
fi

IMAGEM_BASE64="$(base64 -w 0 "$FOTO")"

printf '{"imagem_base64":"%s","encoding_cadastrado":{{eu.response.body.$.encoding}}}' \
    "$IMAGEM_BASE64" > "$SAIDA"

echo "Gerado: $SAIDA"