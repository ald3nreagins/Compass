package org.compass.vc_compass.controller;

import org.compass.vc_compass.dto.ExtractionResult;
import org.compass.vc_compass.dto.PortfolioImpactResult;
import org.compass.vc_compass.dto.TranscriptionResult;
import org.compass.vc_compass.service.ClaudeService;
import org.compass.vc_compass.service.ElevenLabsService;
import org.compass.vc_compass.service.VideoDownloadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/transcribe")
public class TranscriptionController {

    private final ElevenLabsService elevenLabsService;
    private final ClaudeService claudeService;
    private final VideoDownloadService videoDownloadService;

    public TranscriptionController(
            ElevenLabsService elevenLabsService,
            ClaudeService claudeService,
            VideoDownloadService videoDownloadService
    ) {
        this.elevenLabsService = elevenLabsService;
        this.claudeService = claudeService;
        this.videoDownloadService = videoDownloadService;
    }

    @PostMapping
    public ResponseEntity<?> transcribeAndAnalyze(@RequestParam("file") MultipartFile file) {
        try {
            byte[] audioBytes = file.getBytes();
            String filename = file.getOriginalFilename();

            TranscriptionResult transcription = elevenLabsService.transcribe(audioBytes, filename);
            ExtractionResult analysis = claudeService.extractFromTranscript(transcription.getText());

            return ResponseEntity.ok(new TranscribeResponse(transcription.getText(), analysis));

        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to read uploaded file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Transcription/analysis failed: " + e.getMessage());
        }
    }

    @PostMapping("/url")
    public ResponseEntity<?> transcribeFromUrl(@RequestBody UrlRequest request) {
        try {
            byte[] audioBytes = videoDownloadService.downloadAudioFromUrl(request.getUrl());

            TranscriptionResult transcription = elevenLabsService.transcribe(audioBytes, "downloaded_audio.mp3");
            ExtractionResult analysis = claudeService.extractFromTranscript(transcription.getText());

            return ResponseEntity.ok(new TranscribeResponse(transcription.getText(), analysis));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process video URL: " + e.getMessage());
        }
    }

    @PostMapping("/url/portfolio-impact")
public ResponseEntity<?> transcribeAndAnalyzePortfolioImpact(@RequestBody PortfolioImpactRequest request) {
    try {
        byte[] audioBytes = videoDownloadService.downloadAudioFromUrl(request.getUrl());
        TranscriptionResult transcription = elevenLabsService.transcribe(audioBytes, "downloaded_audio.mp3");
        PortfolioImpactResult impact = claudeService.analyzePortfolioImpact(
                transcription.getText(), request.getPortfolioCompanies()
        );

        return ResponseEntity.ok(new PortfolioImpactResponse(transcription.getText(), impact));

    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Failed to analyze portfolio impact: " + e.getMessage());
    }
}

static class PortfolioImpactRequest {
    private String url;
    private java.util.List<String> portfolioCompanies;

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public java.util.List<String> getPortfolioCompanies() { return portfolioCompanies; }
    public void setPortfolioCompanies(java.util.List<String> portfolioCompanies) { this.portfolioCompanies = portfolioCompanies; }
}

static class PortfolioImpactResponse {
    public String transcript;
    public org.compass.vc_compass.dto.PortfolioImpactResult analysis;

    public PortfolioImpactResponse(String transcript, org.compass.vc_compass.dto.PortfolioImpactResult analysis) {
        this.transcript = transcript;
        this.analysis = analysis;
    }
}

    static class UrlRequest {
        private String url;
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    // Simple inline response wrapper
    static class TranscribeResponse {
        public String transcript;
        public ExtractionResult analysis;

        public TranscribeResponse(String transcript, ExtractionResult analysis) {
            this.transcript = transcript;
            this.analysis = analysis;
        }
    }
}