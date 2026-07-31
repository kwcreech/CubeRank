package com.cuberank.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientConfig {

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder()
                .defaultHeader("User-Agent", "CubeRankCatalogBot/1.0 (+https://github.com/kwcreech/CubeRank)");
    }
}
