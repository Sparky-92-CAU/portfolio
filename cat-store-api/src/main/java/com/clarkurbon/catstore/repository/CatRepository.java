package com.clarkurbon.catstore.repository;

import com.clarkurbon.catstore.model.Cat;
import com.clarkurbon.catstore.model.CatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CatRepository extends JpaRepository<Cat, Long> {
    List<Cat> findAllByStatusOrderById(CatStatus status);

    List<Cat> findAllByOrderById();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select cat from Cat cat where cat.id in :ids order by cat.id")
    List<Cat> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);
}
