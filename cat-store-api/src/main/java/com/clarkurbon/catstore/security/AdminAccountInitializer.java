package com.clarkurbon.catstore.security;

import com.clarkurbon.catstore.model.Account;
import com.clarkurbon.catstore.model.AccountRole;
import com.clarkurbon.catstore.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;

@Configuration
public class AdminAccountInitializer {
    @Bean
    ApplicationRunner initializeAdminAccount(
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword) {
        return args -> {
            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                throw new IllegalStateException("Set ADMIN_EMAIL and ADMIN_PASSWORD to provision the store admin.");
            }
            if (adminPassword.length() < 12
                    || adminPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException("ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes.");
            }
            String normalizedEmail = Account.normalizeEmail(adminEmail);
            accountRepository.findByEmail(normalizedEmail).ifPresentOrElse(
                    account -> {
                        if (account.getRole() != AccountRole.ADMIN) {
                            throw new IllegalStateException("ADMIN_EMAIL is already registered as a customer.");
                        }
                    },
                    () -> accountRepository.save(new Account(
                            normalizedEmail,
                            passwordEncoder.encode(adminPassword),
                            AccountRole.ADMIN
                    ))
            );
        };
    }
}
