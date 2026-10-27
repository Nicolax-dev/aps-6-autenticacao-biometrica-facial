# Detecção de vivacidade (liveness detection) — limitação conhecida do sistema

## 1. O problema: ataque de apresentação

O reconhecimento facial responde a uma única pergunta: **"este rosto é parecido com o rosto cadastrado?"**.
Ele **não** responde a outra pergunta, igualmente importante: **"existe uma pessoa viva e presente na frente da câmera agora?"**.

Quando alguém tenta enganar o sistema apresentando algo que *imita* o rosto da vítima, isso se chama
**ataque de apresentação** (*presentation attack*, ou *spoofing*). A norma internacional que trata do assunto
é a **ISO/IEC 30107** (*Presentation Attack Detection — PAD*).

Exemplos, do mais simples ao mais sofisticado:

| Tipo de ataque | Como funciona | Dificuldade para o atacante |
|---|---|---|
| **Foto impressa** | Imprimir uma foto da vítima (tirada de rede social) e segurar na frente da câmera | Muito baixa |
| **Tela** | Mostrar a foto ou um vídeo da vítima na tela de um celular/tablet | Muito baixa |
| **Vídeo reproduzido** (*replay*) | Vídeo da vítima piscando e mexendo a cabeça — engana desafios simples | Baixa |
| **Máscara** | Máscara de papel recortada, de silicone ou impressa em 3D | Média a alta |
| **Injeção digital** | Em vez de enganar a câmera, substitui o sinal dela: câmera virtual (ex.: OBS), deepfake em tempo real ou envio direto de uma imagem para a API | Média |

Para o **Facenet**, uma foto nítida da vítima gera praticamente o mesmo encoding que a vítima ao vivo:
a distância cosseno fica abaixo do limiar de 0.40 e o acesso é concedido.

## 2. O que é detecção de vivacidade

É o conjunto de técnicas que tenta distinguir um **rosto vivo e presente** de uma **imitação**.
Ela roda **antes** (ou junto) da comparação de rostos: se a imagem for considerada falsa, a comparação nem acontece.

### 2.1 Vivacidade ativa (desafio-resposta)

O sistema pede uma ação e confere se ela aconteceu, em uma sequência de quadros de vídeo:

- piscar os olhos;
- virar a cabeça para um lado sorteado;
- sorrir, abrir a boca, aproximar o rosto da câmera.

**Ponto forte:** derruba foto impressa e foto em tela (foto não pisca nem vira a cabeça).
**Ponto fraco:** um vídeo da vítima pode atender desafios previsíveis; por isso o desafio deve ser **sorteado** a cada tentativa.
**Custo:** exige capturar vídeo (vários quadros), não uma foto só, e piora a experiência do usuário.

### 2.2 Vivacidade passiva

Uma rede neural analisa **uma única imagem** procurando sinais de que ela é uma reprodução:

- **textura**: papel e tela têm textura diferente da pele;
- **padrão moiré**: listras que aparecem ao fotografar uma tela;
- **reflexos e brilho**: a tela do celular reflete luz de forma característica;
- **bordas**: a borda da folha ou do celular aparecendo na imagem;
- **profundidade estimada**: um rosto real tem volume, uma foto é plana.

**Ponto forte:** o usuário não precisa fazer nada.
**Ponto fraco:** depende da qualidade do modelo; fotos e telas de alta qualidade, e principalmente máscaras, podem passar.

### 2.3 Vivacidade por hardware

Sensores que medem o que uma câmera comum não mede:

- **câmera infravermelha**: pele humana reflete infravermelho de forma diferente de papel e tela;
- **sensor de profundidade 3D**: mede o relevo real do rosto (é o caso do *Face ID* do iPhone e do *Windows Hello*).

**Ponto forte:** é a forma mais robusta.
**Ponto fraco:** exige hardware específico — fora do alcance de uma webcam de notebook.

### 2.4 Como se mede a qualidade (ISO/IEC 30107-3)

- **APCER** (*Attack Presentation Classification Error Rate*): % de **ataques aceitos como reais**. É o erro perigoso.
- **BPCER** (*Bona Fide Presentation Classification Error Rate*): % de **pessoas reais rejeitadas como ataque**. É o erro incômodo.

Assim como o limiar de distância do reconhecimento, existe um equilíbrio: deixar a detecção mais rigorosa
reduz o APCER, mas aumenta o BPCER (mais usuários legítimos barrados).

## 3. Situação no nosso sistema

### 3.1 O que o sistema faz

- **Login aceita somente foto da webcam** (sem aba "Enviar arquivo" no popup de verificação).
  Isso impede, pela interface, o ataque mais trivial: escolher no computador uma foto da vítima baixada da internet.
- A foto é capturada no momento do login, pelo navegador, a partir da câmera ao vivo.

### 3.2 O que o sistema **não** faz (limitação conhecida e assumida)

- **Não há detecção de vivacidade.** Uma foto impressa ou a tela de um celular mostrada para a webcam
  gera um encoding parecido com o da vítima e pode ser aceita.
- **A restrição "só webcam" vale apenas para a interface.** O servidor recebe a imagem como base64 e não tem
  como saber de onde ela veio: quem chamar a API diretamente (ex.: com Postman ou REST Client) pode enviar um arquivo.
  O mesmo vale para uma câmera virtual instalada no computador. Ou seja: a regra **reduz** o risco de uso
  casual indevido, mas **não é uma barreira de segurança contra um atacante determinado**.
- A **senha** continua sendo um fator independente: o atacante precisa ter a senha da vítima **e** a imagem do rosto dela.
  É por isso que o login usa dois fatores (algo que a pessoa **sabe** + algo que a pessoa **é**).

### 3.3 Por que não foi implementado

- **Escopo e prazo de uma APS**: o foco do trabalho é o fluxo de identificação, autenticação e autorização por nível.
- **Peso e complexidade**: os modelos de anti-spoofing exigem dependências adicionais no serviço Python
  e precisariam de testes próprios (com fotos impressas, telas e vídeos) para medir APCER/BPCER.
- **Vivacidade ativa** mudaria o contrato Java↔Python (vídeo ou vários quadros em vez de uma imagem)
  e toda a tela de captura.

## 4. Como poderia ser implementado no futuro

Em ordem de esforço:

1. **Passiva, pela própria biblioteca**: o DeepFace oferece o parâmetro `anti_spoofing=True` em funções como
   `extract_faces` e `verify`, usando um modelo de anti-spoofing (FasNet). No nosso serviço, bastaria ativá-lo
   em `reconhecimento.py` e criar um novo código de erro (ex.: `ROSTO_NAO_VIVO`) no contrato, no Java,
   no CHECK de `log_acesso` e no `MENSAGENS_ERRO` do frontend.
   *Pendente de verificação*: dependências extras exigidas por esse modelo na versão usada (`deepface==0.0.93`)
   e impacto no tempo de resposta (o Java tem timeout de 5s).
2. **Ativa, com desafio sorteado**: o servidor sorteia um desafio ("vire para a esquerda"), o navegador grava
   alguns quadros, e o Python confere o movimento (ex.: posição dos olhos/nariz entre os quadros).
3. **Hardware**: câmera infravermelha ou de profundidade — viável apenas em ambiente controlado
   (ex.: terminal fixo na entrada do ministério).

Em um sistema real do Ministério do Meio Ambiente, com dados estratégicos de nível 3, a detecção de vivacidade
seria **obrigatória**, junto com outras medidas: limite de tentativas por usuário, bloqueio temporário,
alerta para tentativas repetidas no nível 3 (o `log_acesso` já dá base para isso) e HTTPS.

## 5. Resumo

> "O reconhecimento facial confirma **de quem** é o rosto, mas não confirma se a pessoa está **presente**.
> Isso se resolve com detecção de vivacidade, que não está no escopo deste trabalho.
> Como mitigação, o login aceita apenas captura pela webcam e exige senha antes da biometria.
> Sabemos que isso não impede um atacante que tenha a senha e uma foto da vítima,
> e deixamos documentado como a detecção de vivacidade poderia ser adicionada."
