# Python 3.11: versão com suporte estável ao TensorFlow 2.17
FROM python:3.11-slim

# Logs aparecem na hora no "docker compose logs" e sem arquivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Bibliotecas de sistema que o OpenCV precisa (a imagem slim não traz)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Instala as dependências antes de copiar o código:
# assim, mudar o código não reinstala tudo (cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

# Comando padrão. No compose (item 3) ele é trocado pela versão com --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]