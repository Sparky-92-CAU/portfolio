package com.clarkurbon.catstore.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlaceOrderRequest(
        @NotEmpty @Size(max = 10) List<@NotNull Long> catIds
) {
}
