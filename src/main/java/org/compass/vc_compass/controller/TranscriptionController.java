package org.compass.vc_compass.controller;

import org.compass.vc_compass.dto.ExtractionResult;
import java.util.List;
import org.compass.vc_compass.dto.PortfolioImpactResult;
import org.compass.vc_compass.dto.TranscriptionResult;
import org.compass.vc_compass.model.Submission;
import org.compass.vc_compass.model.User;
import org.compass.vc_compass.repository.SubmissionRepository;
import org.compass.vc_compass.repository.UserRepository;
import org.compass.vc_compass.security.UserPrincipal;
import org.compass.vc_compass.service.ClaudeService;
import org.compass.vc_compass.service.ElevenLabsService;
import org.compass.vc_compass.service.VideoDownloadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@RestController
@RequestMapping("/api/transcribe")
public class TranscriptionController {

    private final ElevenLabsService elevenLabsService;
    private final ClaudeService claudeService;
    private final VideoDownloadService videoDownloadService;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TranscriptionController(
            ElevenLabsService elevenLabsService,
            ClaudeService claudeService,
            VideoDownloadService videoDownloadService,
            SubmissionRepository submissionRepository
    ) {
        this.elevenLabsService = elevenLabsService;
        this.claudeService = claudeService;
        this.videoDownloadService = videoDownloadService;
        this.submissionRepository = submissionRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return principal.getUser();
    }

    @PostMapping
    public ResponseEntity<?> transcribeAndAnalyze(@RequestParam("file") MultipartFile file) {
        try {
            byte[] audioBytes = file.getBytes();
            String filename = file.getOriginalFilename();

            TranscriptionResult transcription = elevenLabsService.transcribe(audioBytes, filename);
            ExtractionResult analysis = claudeService.extractFromTranscript(transcription.getText());

            saveSubmission(filename, transcription.getText(), analysis, "pitch");

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

            saveSubmission(request.getUrl(), transcription.getText(), analysis, "pitch");

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

            saveSubmission(request.getUrl(), transcription.getText(), impact, "portfolio-impact");

            return ResponseEntity.ok(new PortfolioImpactResponse(transcription.getText(), impact));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to analyze portfolio impact: " + e.getMessage());
        }
    }

    @GetMapping("/history")
public ResponseEntity<?> getSubmissionHistory() {
    User currentUser = getCurrentUser();
    List<SubmissionResponse> results = submissionRepository
            .findBySubmittedByOrderByCreatedAtDesc(currentUser)
            .stream()
            .map(SubmissionResponse::new)
            .toList();
    return ResponseEntity.ok(results);
}

    private void saveSubmission(String sourceUrl, String transcript, Object analysis, String analysisType) {
        try {
            Submission submission = new Submission();
            submission.setSourceUrl(sourceUrl);
            submission.setTranscript(transcript);
            submission.setAnalysisJson(objectMapper.writeValueAsString(analysis));
            submission.setAnalysisType(analysisType);
            submission.setSubmittedBy(getCurrentUser());
            submissionRepository.save(submission);
        } catch (Exception e) {
            // Log but don't fail the request if saving history fails
            System.err.println("Failed to save submission history: " + e.getMessage());
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
        public PortfolioImpactResult analysis;

        public PortfolioImpactResponse(String transcript, PortfolioImpactResult analysis) {
            this.transcript = transcript;
            this.analysis = analysis;
        }
    }

    static class UrlRequest {
        private String url;
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    static class TranscribeResponse {
        public String transcript;
        public ExtractionResult analysis;

        public TranscribeResponse(String transcript, ExtractionResult analysis) {
            this.transcript = transcript;
            this.analysis = analysis;
        }
    }

    static class SubmissionResponse {
    public Long id;
    public String sourceUrl;
    public String transcript;
    public String analysisJson;
    public String analysisType;
    public String createdAt;

    public SubmissionResponse(Submission s) {
        this.id = s.getId();
        this.sourceUrl = s.getSourceUrl();
        this.transcript = s.getTranscript();
        this.analysisJson = s.getAnalysisJson();
        this.analysisType = s.getAnalysisType();
        this.createdAt = s.getCreatedAt().toString();
    }
}
}