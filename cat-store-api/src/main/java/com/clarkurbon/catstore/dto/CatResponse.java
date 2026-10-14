package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.Cat;
import com.clarkurbon.catstore.model.CatStatus;

import java.time.Instant;

public record CatResponse(
        Long id,
        String name,
        String breed,
        int ageMonths,
        String description,
        long priceCents,
        CatStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static CatResponse from(Cat cat) {
        return new CatResponse(
                cat.getId(),
                cat.getName(),
                cat.getBreed(),
                cat.getAgeMonths(),
                cat.getDescription(),
                cat.getPriceCents(),
                cat.getStatus(),
                cat.getCreatedAt(),
                cat.getUpdatedAt()
        );
    }
}
