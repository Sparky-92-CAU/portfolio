package com.clarkurbon.catstore.security;

import com.clarkurbon.catstore.dto.AuthResponse;
import com.clarkurbon.catstore.dto.UserResponse;
import com.clarkurbon.catstore.model.Account;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class JwtService {
    private static final long TOKEN_LIFETIME_SECONDS = 3600;
    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public AuthResponse createResponse(Account account, String displayName) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("cat-store-api")
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME_SECONDS, ChronoUnit.SECONDS))
                .subject(account.getEmail())
                .claim("accountId", account.getId())
                .claim("role", account.getRole().name())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
        )).getTokenValue();
        return new AuthResponse(
                token,
                "Bearer",
                TOKEN_LIFETIME_SECONDS,
                UserResponse.from(account, displayName)
        );
    }
}
