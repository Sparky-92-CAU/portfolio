package com.clarkurbon.catstore.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

@Entity
@Table(name = "cats")
public class Cat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 80)
    private String breed;

    @Column(name = "age_months", nullable = false)
    private int ageMonths;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "price_cents", nullable = false)
    private long priceCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CatStatus status = CatStatus.AVAILABLE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Cat() {
    }

    public Cat(String name, String breed, int ageMonths, String description, long priceCents) {
        this.name = name.strip();
        this.breed = breed.strip();
        this.ageMonths = ageMonths;
        this.description = description.strip();
        this.priceCents = priceCents;
    }

    @PrePersist
    void setCreatedAndUpdatedAt() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void setUpdatedAt() {
        updatedAt = Instant.now();
    }

    public void updateDetails(String name, String breed, int ageMonths, String description, long priceCents) {
        this.name = name.strip();
        this.breed = breed.strip();
        this.ageMonths = ageMonths;
        this.description = description.strip();
        this.priceCents = priceCents;
    }

    public void setStatus(CatStatus status) {
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBreed() {
        return breed;
    }

    public int getAgeMonths() {
        return ageMonths;
    }

    public String getDescription() {
        return description;
    }

    public long getPriceCents() {
        return priceCents;
    }

    public CatStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
