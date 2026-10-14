package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.AccountRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotNull AccountRole accountType
) {
}
