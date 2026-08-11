package com.cuberank.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EmbeddingServiceVectorLiteralTest {

    @Test
    void formatsPgvectorLiteral() {
        String literal = EmbeddingService.toVectorLiteral(new float[] {0.1f, -0.25f, 1f});
        assertTrue(literal.startsWith("["));
        assertTrue(literal.endsWith("]"));
        assertEquals("[0.10000000,-0.25000000,1.00000000]", literal);
    }
}
