package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.OrderItem;

public record OrderItemResponse(
        Long catId,
        String name,
        String breed,
        long unitPriceCents
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getCat().getId(),
                item.getCatName(),
                item.getCatBreed(),
                item.getUnitPriceCents()
        );
    }
}
