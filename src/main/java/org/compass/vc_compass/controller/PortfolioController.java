package org.compass.vc_compass.controller;

import org.compass.vc_compass.entity.PortfolioHolding;
import org.compass.vc_compass.repository.PortfolioHoldingRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioHoldingRepository repository;

    public PortfolioController(PortfolioHoldingRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/holdings")
    public List<PortfolioHolding> getHoldings() {
        return repository.findAll();
    }
}