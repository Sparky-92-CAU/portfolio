package com.clarkurbon.catstore.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private StoreOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cat_id", nullable = false)
    private Cat cat;

    @Column(name = "unit_price_cents", nullable = false)
    private long unitPriceCents;

    @Column(name = "cat_name", nullable = false, length = 80)
    private String catName;

    @Column(name = "cat_breed", nullable = false, length = 80)
    private String catBreed;

    protected OrderItem() {
    }

    public OrderItem(Cat cat, long unitPriceCents) {
        this.cat = cat;
        this.unitPriceCents = unitPriceCents;
        this.catName = cat.getName();
        this.catBreed = cat.getBreed();
    }

    void setOrder(StoreOrder order) {
        this.order = order;
    }

    public Long getId() {
        return id;
    }

    public StoreOrder getOrder() {
        return order;
    }

    public Cat getCat() {
        return cat;
    }

    public long getUnitPriceCents() {
        return unitPriceCents;
    }

    public String getCatName() {
        return catName;
    }

    public String getCatBreed() {
        return catBreed;
    }
}
