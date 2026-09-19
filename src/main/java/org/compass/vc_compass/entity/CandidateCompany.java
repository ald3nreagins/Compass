package org.compass.vc_compass.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "candidate_companies")
@Data
public class CandidateCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fund_name")
    private String fundName;

    @Column(name = "company_name")
    private String companyName;

    private String industry;
    private String description;
    private String location;
    private String stage;

    @Column(name = "latest_round_amount")
    private String latestRoundAmount;

    @Column(name = "backed_by")
    private String backedBy;

    @Column(name = "profile_url")
    private String profileUrl;
}