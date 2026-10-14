package com.clarkurbon.catstore.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CatRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 80) String breed,
        @Min(0) @Max(360) int ageMonths,
        @NotBlank @Size(max = 1000) String description,
        @Positive @Max(900_719_925_474_099L) long priceCents
) {
}
