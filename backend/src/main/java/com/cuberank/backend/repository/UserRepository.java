package com.cuberank.backend.repository;

import com.cuberank.backend.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query(
            value = """
                    select u.id as id, u.username as username, u.avatarUrl as avatarUrl, count(r) as reviewCount
                    from User u
                    join Review r on r.user = u
                    group by u.id, u.username, u.avatarUrl
                    order by count(r) desc, u.username asc
                    """,
            countQuery = """
                    select count(distinct u.id)
                    from User u
                    join Review r on r.user = u
                    """)
    Page<UserLeaderboardProjection> findReviewCountLeaderboard(Pageable pageable);
}
