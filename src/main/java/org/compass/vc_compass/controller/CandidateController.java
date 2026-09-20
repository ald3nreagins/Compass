package org.compass.vc_compass.controller;

import org.compass.vc_compass.entity.CandidateCompany;
import org.compass.vc_compass.repository.CandidateCompanyRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateCompanyRepository repository;

    public CandidateController(CandidateCompanyRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CandidateCompany> getCandidates() {
        return repository.findAll();
    }
}