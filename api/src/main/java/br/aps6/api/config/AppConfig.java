package br.aps6.api.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestClient;

/** Cria os objetos de bibliotecas externas que o resto do código recebe pronto. */
@Configuration
public class AppConfig {

    private static final Duration TIMEOUT_BIOMETRIA = Duration.ofSeconds(5);

    /** Cliente HTTP do serviço Python. */
    @Bean
    public RestClient biometriaRestClient(@Value("${biometria.url}") String biometriaUrl) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(TIMEOUT_BIOMETRIA);
        fabrica.setReadTimeout(TIMEOUT_BIOMETRIA);

        return RestClient.builder()
                .baseUrl(biometriaUrl)
                .requestFactory(fabrica)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}