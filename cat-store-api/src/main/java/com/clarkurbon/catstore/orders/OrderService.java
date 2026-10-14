package com.clarkurbon.catstore.orders;

import com.clarkurbon.catstore.dto.OrderResponse;
import com.clarkurbon.catstore.dto.PlaceOrderRequest;
import com.clarkurbon.catstore.error.ApiException;
import com.clarkurbon.catstore.model.Cat;
import com.clarkurbon.catstore.model.CatStatus;
import com.clarkurbon.catstore.model.CustomerProfile;
import com.clarkurbon.catstore.model.OrderItem;
import com.clarkurbon.catstore.model.OrderStatus;
import com.clarkurbon.catstore.model.StoreOrder;
import com.clarkurbon.catstore.repository.CatRepository;
import com.clarkurbon.catstore.repository.CustomerProfileRepository;
import com.clarkurbon.catstore.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {
    private final CatRepository catRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final OrderRepository orderRepository;

    public OrderService(CatRepository catRepository,
                       CustomerProfileRepository customerProfileRepository,
                       OrderRepository orderRepository) {
        this.catRepository = catRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public OrderResponse placeOrder(String email, PlaceOrderRequest request) {
        List<Long> requestedIds = request.catIds();
        Set<Long> uniqueIds = new HashSet<>(requestedIds);
        if (uniqueIds.size() != requestedIds.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cat can only appear once in an order.");
        }

        CustomerProfile customer = customerProfileRepository.findByAccountEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer profile was not found."));
        List<Cat> cats = catRepository.findAllByIdForUpdate(uniqueIds);
        if (cats.size() != uniqueIds.size()
                || cats.stream().anyMatch(cat -> cat.getStatus() != CatStatus.AVAILABLE)) {
            throw new ApiException(HttpStatus.CONFLICT, "One or more selected cats are no longer available.");
        }

        long totalCents = 0;
        for (Cat cat : cats) {
            totalCents = Math.addExact(totalCents, cat.getPriceCents());
        }
        StoreOrder order = new StoreOrder(customer, totalCents);
        for (Cat cat : cats) {
            cat.setStatus(CatStatus.RESERVED);
            order.addItem(new OrderItem(cat, cat.getPriceCents()));
        }
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listCustomerOrders(String email) {
        return orderRepository.findAllByCustomerAccountEmailOrderByCreatedAtDesc(email).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        if (newStatus != OrderStatus.FULFILLED && newStatus != OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An order can only be fulfilled or cancelled.");
        }
        StoreOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order was not found."));
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only placed orders can be updated.");
        }

        for (OrderItem item : order.getItems()) {
            Cat cat = item.getCat();
            if (cat.getStatus() != CatStatus.RESERVED) {
                throw new ApiException(HttpStatus.CONFLICT, "Order inventory is not in the expected reserved state.");
            }
            cat.setStatus(newStatus == OrderStatus.FULFILLED ? CatStatus.SOLD : CatStatus.AVAILABLE);
        }
        order.setStatus(newStatus);
        return OrderResponse.from(order);
    }
}
