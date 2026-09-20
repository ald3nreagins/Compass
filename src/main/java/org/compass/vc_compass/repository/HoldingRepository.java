package org.compass.vc_compass.repository;

import org.compass.vc_compass.model.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
}