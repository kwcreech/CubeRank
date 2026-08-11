package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Embedding;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmbeddingRepository extends JpaRepository<Embedding, Long> {

    /**
     * Cosine-nearest LIVE-cube reviews. {@code queryVector} must be a pgvector literal
     * like {@code [0.1,0.2,...]}.
     */
    @Query(value = """
            select r.id as review_id,
                   c.id as cube_id,
                   c.name as cube_name,
                   r.written_content as written_content
            from embeddings e
            join reviews r on r.id = e.review_id
            join cubes c on c.id = r.cube_id
            where c.status = 'LIVE'
            order by e.embedding <=> cast(:queryVector as vector)
            limit :limit
            """, nativeQuery = true)
    List<Object[]> findSimilarLiveReviews(
            @Param("queryVector") String queryVector, @Param("limit") int limit);
}
