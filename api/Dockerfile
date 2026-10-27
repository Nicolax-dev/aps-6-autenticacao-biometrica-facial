# =====================================================================
# Build multi-stage: 2 imagens em sequência, só a 2ª vai para o container.
# Estágio 1 tem Maven + JDK (pesado) e compila. Estágio 2 tem só o JRE
# (leve) e roda o JAR. Assim nada de Java/Maven precisa estar na máquina.
# =====================================================================

# ---------- Estágio 1: compilar ----------
FROM maven:3.9.14-eclipse-temurin-21 AS build
WORKDIR /build

# Baixa as dependências antes de copiar o código: assim, mudar o código
# não baixa tudo de novo (cache do Docker, mesma ideia do requirements.txt)
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copia o código e gera target/api.jar
COPY src ./src
RUN mvn -B package

# ---------- Estágio 2: rodar ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Só o JAR pronto vem do estágio 1 (o Maven e o código-fonte ficam para trás)
COPY --from=build /build/target/api.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]