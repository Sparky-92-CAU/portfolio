package com.clarkurbon.catstore.catalog;

import com.clarkurbon.catstore.dto.CatRequest;
import com.clarkurbon.catstore.dto.CatResponse;
import com.clarkurbon.catstore.error.ApiException;
import com.clarkurbon.catstore.model.Cat;
import com.clarkurbon.catstore.model.CatStatus;
import com.clarkurbon.catstore.repository.CatRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatService {
    private final CatRepository catRepository;

    public CatService(CatRepository catRepository) {
        this.catRepository = catRepository;
    }

    @Transactional(readOnly = true)
    public List<CatResponse> listAvailable() {
        return catRepository.findAllByStatusOrderById(CatStatus.AVAILABLE).stream()
                .map(CatResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CatResponse> listInventory() {
        return catRepository.findAllByOrderById().stream()
                .map(CatResponse::from)
                .toList();
    }

    @Transactional
    public CatResponse create(CatRequest request) {
        Cat cat = new Cat(
                request.name(),
                request.breed(),
                request.ageMonths(),
                request.description(),
                request.priceCents()
        );
        return CatResponse.from(catRepository.save(cat));
    }

    @Transactional
    public CatResponse update(Long id, CatRequest request) {
        Cat cat = findCat(id);
        if (cat.getStatus() != CatStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "Only available listings can be edited.");
        }
        cat.updateDetails(
                request.name(),
                request.breed(),
                request.ageMonths(),
                request.description(),
                request.priceCents()
        );
        return CatResponse.from(cat);
    }

    @Transactional
    public void archive(Long id) {
        Cat cat = findCat(id);
        if (cat.getStatus() != CatStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "Only available cats can be archived.");
        }
        cat.setStatus(CatStatus.ARCHIVED);
    }

    @Transactional
    public CatResponse restore(Long id, CatStatus status) {
        Cat cat = findCat(id);
        if (status != CatStatus.AVAILABLE || cat.getStatus() != CatStatus.ARCHIVED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only archived listings can be restored to available.");
        }
        cat.setStatus(CatStatus.AVAILABLE);
        return CatResponse.from(cat);
    }

    private Cat findCat(Long id) {
        return catRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cat listing was not found."));
    }
}
