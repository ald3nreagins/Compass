package org.compass.vc_compass.dto;

import java.util.List;

public class PortfolioImpactResult {
    private String eventSummary;
    private List<String> affectedSectors;
    private List<AffectedCompany> affectedCompanies;
    private String overallImpact; // "positive" | "negative" | "mixed" | "neutral"
    private String urgency;       // "immediate" | "monitor" | "low"
    private List<String> recommendedActions;

    public static class AffectedCompany {
        private String companyName;
        private String impactDirection; // "positive" | "negative" | "mixed"
        private String rationale;

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getImpactDirection() { return impactDirection; }
        public void setImpactDirection(String impactDirection) { this.impactDirection = impactDirection; }

        public String getRationale() { return rationale; }
        public void setRationale(String rationale) { this.rationale = rationale; }
    }

    public String getEventSummary() { return eventSummary; }
    public void setEventSummary(String eventSummary) { this.eventSummary = eventSummary; }

    public List<String> getAffectedSectors() { return affectedSectors; }
    public void setAffectedSectors(List<String> affectedSectors) { this.affectedSectors = affectedSectors; }

    public List<AffectedCompany> getAffectedCompanies() { return affectedCompanies; }
    public void setAffectedCompanies(List<AffectedCompany> affectedCompanies) { this.affectedCompanies = affectedCompanies; }

    public String getOverallImpact() { return overallImpact; }
    public void setOverallImpact(String overallImpact) { this.overallImpact = overallImpact; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public List<String> getRecommendedActions() { return recommendedActions; }
    public void setRecommendedActions(List<String> recommendedActions) { this.recommendedActions = recommendedActions; }
}
