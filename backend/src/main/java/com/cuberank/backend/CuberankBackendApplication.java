package com.cuberank.backend;

import com.cuberank.backend.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class CuberankBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CuberankBackendApplication.class, args);
	}

}
