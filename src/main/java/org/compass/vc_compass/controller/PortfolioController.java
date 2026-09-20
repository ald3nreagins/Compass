package org.compass.vc_compass.controller;

import org.compass.vc_compass.model.Holding;
import org.compass.vc_compass.repository.HoldingRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final HoldingRepository holdingRepository;

    public PortfolioController(HoldingRepository holdingRepository) {
        this.holdingRepository = holdingRepository;
    }

    @GetMapping("/holdings")
    public List<Holding> getHoldings() {
        return holdingRepository.findAll();
    }
}