package org.compass.vc_compass.dto;

public class TranscriptionResult {
    private String text;
    private String languageCode;

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
}
