package org.compass.vc_compass.model;

import jakarta.persistence.*;

@Entity
@Table(name = "holdings")
public class Holding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String fundName;
    private Double arr;
    private Double arrGrowth;
    private Double runwayMonths;
    private String healthFlag; // ACCELERATING, STABLE, BASELINE, REVIEW

    public Holding() {}

    public Holding(String companyName, String fundName, Double arr, Double arrGrowth, Double runwayMonths, String healthFlag) {
        this.companyName = companyName;
        this.fundName = fundName;
        this.arr = arr;
        this.arrGrowth = arrGrowth;
        this.runwayMonths = runwayMonths;
        this.healthFlag = healthFlag;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getFundName() { return fundName; }
    public void setFundName(String fundName) { this.fundName = fundName; }
    public Double getArr() { return arr; }
    public void setArr(Double arr) { this.arr = arr; }
    public Double getArrGrowth() { return arrGrowth; }
    public void setArrGrowth(Double arrGrowth) { this.arrGrowth = arrGrowth; }
    public Double getRunwayMonths() { return runwayMonths; }
    public void setRunwayMonths(Double runwayMonths) { this.runwayMonths = runwayMonths; }
    public String getHealthFlag() { return healthFlag; }
    public void setHealthFlag(String healthFlag) { this.healthFlag = healthFlag; }
}
