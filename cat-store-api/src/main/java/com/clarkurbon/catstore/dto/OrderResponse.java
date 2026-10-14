package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.StoreOrder;

import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        String status,
        long totalCents,
        Instant createdAt,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(StoreOrder order) {
        var customer = order.getCustomer();
        var account = customer.getAccount();
        return new OrderResponse(
                order.getId(),
                customer.getId(),
                customer.getFirstName() + " " + customer.getLastName(),
                account.getEmail(),
                order.getStatus().name(),
                order.getTotalCents(),
                order.getCreatedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
