package org.compass.vc_compass.dto;

import java.util.List;

public class ExtractionResult {
    private List<String> companiesMentioned;
    private String sentiment;
    private List<String> keyClaims;
    private List<String> catalysts;

    public List<String> getCompaniesMentioned() { return companiesMentioned; }
    public void setCompaniesMentioned(List<String> companiesMentioned) { this.companiesMentioned = companiesMentioned; }
    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }
    public List<String> getKeyClaims() { return keyClaims; }
    public void setKeyClaims(List<String> keyClaims) { this.keyClaims = keyClaims; }
    public List<String> getCatalysts() { return catalysts; }
    public void setCatalysts(List<String> catalysts) { this.catalysts = catalysts; }

    private Boolean notApplicable;
    private String reason;

    public Boolean getNotApplicable() { return notApplicable; }
    public void setNotApplicable(Boolean notApplicable) { this.notApplicable = notApplicable; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}