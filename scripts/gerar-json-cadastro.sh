#!/usr/bin/env bash
# Gera o JSON do POST /usuarios a partir de uma foto (serve também para o POST /login/verificar:
# o campo "nome" sobra e o Java ignora).
# Uso:   scripts/gerar-json-cadastro.sh <foto> <email> <arquivo_saida>
# Ex.:   scripts/gerar-json-cadastro.sh biometria-service/fotos/img_eu.jpg nicolas@exemplo.com biometria-service/fotos/cadastro-eu-ok.json
# ATENÇÃO: a saída contém a foto em base64 (dado biométrico) -> gere sempre dentro de
# biometria-service/fotos/, que está fora do Git e da imagem Docker.
set -euo pipefail

if [ "$#" -ne 3 ]; then
    echo "Uso: $0 <foto> <email> <arquivo_saida>" >&2
    exit 1
fi

FOTO="$1"
EMAIL="$2"
SAIDA="$3"

if [ ! -f "$FOTO" ]; then
    echo "Foto não encontrada: $FOTO" >&2
    exit 1
fi

# Em variável separada: assim, se o base64 falhar, o "set -e" para o script.
# Dentro do argumento do printf, a falha passaria em silêncio e o JSON sairia sem imagem.
IMAGEM_BASE64="$(base64 -w 0 "$FOTO")"

printf '{"nome":"Usuario Teste","email":"%s","senha":"123456","imagem_base64":"%s"}' \
    "$EMAIL" "$IMAGEM_BASE64" > "$SAIDA"

echo "Gerado: $SAIDA"