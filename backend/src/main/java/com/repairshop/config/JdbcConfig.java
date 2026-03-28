package com.repairshop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration;
import org.springframework.data.relational.core.dialect.AnsiDialect;
import org.springframework.data.relational.core.dialect.Dialect;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcOperations;

/**
 * Provides a SQLite-compatible JDBC dialect.
 * Spring Data JDBC doesn't auto-detect SQLite, so we use AnsiDialect as a compatible fallback.
 */
@Configuration
public class JdbcConfig extends AbstractJdbcConfiguration {

    @Override
    @Bean
    public Dialect jdbcDialect(NamedParameterJdbcOperations operations) {
        return AnsiDialect.INSTANCE;
    }
}
