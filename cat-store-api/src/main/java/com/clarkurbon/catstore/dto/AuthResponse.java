package com.clarkurbon.catstore.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user
) {
}
