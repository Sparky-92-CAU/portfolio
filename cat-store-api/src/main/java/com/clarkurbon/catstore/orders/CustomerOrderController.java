package com.clarkurbon.catstore.orders;

import com.clarkurbon.catstore.dto.OrderResponse;
import com.clarkurbon.catstore.dto.PlaceOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customer/orders")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerOrderController {
    private final OrderService orderService;

    public CustomerOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderResponse> listOrders(@AuthenticationPrincipal Jwt jwt) {
        return orderService.listCustomerOrders(jwt.getSubject());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody PlaceOrderRequest request) {
        return orderService.placeOrder(jwt.getSubject(), request);
    }
}
