package com.clarkurbon.catstore.repository;

import com.clarkurbon.catstore.model.StoreOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<StoreOrder, Long> {
    @EntityGraph(attributePaths = {"customer", "customer.account", "items", "items.cat"})
    @Query("select distinct storeOrder from StoreOrder storeOrder order by storeOrder.createdAt desc")
    List<StoreOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"customer", "customer.account", "items", "items.cat"})
    @Query("""
            select distinct storeOrder
            from StoreOrder storeOrder
            where storeOrder.customer.account.email = :email
            order by storeOrder.createdAt desc
            """)
    List<StoreOrder> findAllByCustomerAccountEmailOrderByCreatedAtDesc(
            @Param("email") String email
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select distinct storeOrder from StoreOrder storeOrder where storeOrder.id = :id")
    Optional<StoreOrder> findByIdForUpdate(@Param("id") Long id);
}
