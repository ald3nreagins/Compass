package org.compass.vc_compass.config;

import org.compass.vc_compass.model.Holding;
import org.compass.vc_compass.repository.HoldingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final HoldingRepository holdingRepository;

    public DataSeeder(HoldingRepository holdingRepository) {
        this.holdingRepository = holdingRepository;
    }

    @Override
    public void run(String... args) {
        if (holdingRepository.count() > 0) {
            return; // already seeded
        }

        holdingRepository.save(new Holding("Affirm", "Fund I", 180_000_000.0, 0.22, 18.0, "ACCELERATING"));
        holdingRepository.save(new Holding("SoFi", "Fund I", 320_000_000.0, 0.15, 24.0, "STABLE"));
        holdingRepository.save(new Holding("Klarna", "Fund II", 95_000_000.0, -0.05, 9.0, "REVIEW"));
        holdingRepository.save(new Holding("Robinhood", "Fund II", 210_000_000.0, 0.08, 30.0, "STABLE"));
        holdingRepository.save(new Holding("Ramp", "Fund I", 60_000_000.0, 0.45, 21.0, "ACCELERATING"));
        holdingRepository.save(new Holding("Brex", "Fund II", 40_000_000.0, 0.02, 12.0, "BASELINE"));
    }

    
}