package com.cuberank.backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Full context load requires live DATABASE_URL / Supabase env vars.
 * Enable once local secrets are configured.
 */
@SpringBootTest
@Disabled("Requires DATABASE_URL, SUPABASE_JWKS_URL, SUPABASE_ISSUER_URI, and INGEST_CRON_SECRET")
class CuberankBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
