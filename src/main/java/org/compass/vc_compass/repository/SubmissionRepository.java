package org.compass.vc_compass.repository;

import org.compass.vc_compass.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findBySubmittedByOrderByCreatedAtDesc(org.compass.vc_compass.model.User user);
}
