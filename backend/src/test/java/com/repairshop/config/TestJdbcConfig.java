package com.repairshop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.relational.core.dialect.AnsiDialect;
import org.springframework.data.relational.core.dialect.Dialect;

/**
 * Provides a SQLite-compatible dialect for Spring Data JDBC in tests.
 * SQLite is not natively recognized by Spring Data JDBC's DialectResolver,
 * so we register AnsiDialect (which SQLite is largely compatible with).
 */
@Configuration
public class TestJdbcConfig {

    @Bean
    @Primary
    public Dialect jdbcDialect() {
        return AnsiDialect.INSTANCE;
    }
}
