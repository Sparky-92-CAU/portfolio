package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status
) {
}
