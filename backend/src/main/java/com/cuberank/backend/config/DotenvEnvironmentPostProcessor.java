package com.cuberank.backend.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads a local {@code .env} file (if present) into the Spring Environment so
 * developers can keep secrets out of the shell. Looks in the process working
 * directory and {@code backend/.env} when started from the repo root.
 * Existing OS environment variables always win.
 *
 * <p>Registered via {@code META-INF/spring.factories} for Spring Boot 4.
 * Prefer {@code spring.config.import=optional:file:.env[.properties]} in
 * {@code application.yml} as the primary path; this processor is a fallback
 * that also searches alternate locations.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envFile = resolveEnvFile();
        if (envFile == null) {
            return;
        }
        try {
            Map<String, Object> values = parseDotEnv(envFile);
            if (!values.isEmpty()) {
                // Prefer over defaults, but not over real OS env / CLI props.
                environment.getPropertySources().addLast(new MapPropertySource("dotenv", values));
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read " + envFile.toAbsolutePath(), ex);
        }
    }

    private static Path resolveEnvFile() {
        Path cwd = Path.of("").toAbsolutePath();
        Path direct = cwd.resolve(".env");
        if (Files.isRegularFile(direct)) {
            return direct;
        }
        Path sibling = cwd.resolve("backend").resolve(".env");
        if (Files.isRegularFile(sibling)) {
            return sibling;
        }
        return null;
    }

    private static Map<String, Object> parseDotEnv(Path envFile) throws IOException {
        Map<String, Object> values = new HashMap<>();
        for (String raw : Files.readAllLines(envFile)) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            if (line.startsWith("export ")) {
                line = line.substring("export ".length()).trim();
            }
            int eq = line.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = line.substring(0, eq).trim();
            String value = line.substring(eq + 1).trim();
            if ((value.startsWith("\"") && value.endsWith("\""))
                    || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length() - 1);
            }
            // Do not override real environment variables.
            if (System.getenv(key) == null) {
                values.put(key, value);
            }
        }
        return values;
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
