package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmbeddingRepository extends JpaRepository<Embedding, Long> {
}
