package com.clarkurbon.catstore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12, max = 64) String password,
        @Size(max = 40) String phone
) {
}
