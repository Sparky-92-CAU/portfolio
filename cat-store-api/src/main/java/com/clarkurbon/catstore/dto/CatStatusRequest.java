package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.CatStatus;
import jakarta.validation.constraints.NotNull;

public record CatStatusRequest(
        @NotNull CatStatus status
) {
}
