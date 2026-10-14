package com.clarkurbon.catstore.catalog;

import com.clarkurbon.catstore.dto.CatRequest;
import com.clarkurbon.catstore.dto.CatResponse;
import com.clarkurbon.catstore.dto.CatStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatController {
    private final CatService catService;

    public CatController(CatService catService) {
        this.catService = catService;
    }

    @GetMapping("/cats")
    public List<CatResponse> listAvailable() {
        return catService.listAvailable();
    }

    @GetMapping("/admin/cats")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CatResponse> listInventory() {
        return catService.listInventory();
    }

    @PostMapping("/admin/cats")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CatResponse create(@Valid @RequestBody CatRequest request) {
        return catService.create(request);
    }

    @PutMapping("/admin/cats/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CatResponse update(@PathVariable Long id, @Valid @RequestBody CatRequest request) {
        return catService.update(id, request);
    }

    @DeleteMapping("/admin/cats/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void archive(@PathVariable Long id) {
        catService.archive(id);
    }

    @PutMapping("/admin/cats/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public CatResponse updateStatus(@PathVariable Long id, @Valid @RequestBody CatStatusRequest request) {
        return catService.restore(id, request.status());
    }
}
