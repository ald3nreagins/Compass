package org.compass.vc_compass.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.compass.vc_compass.config.AnthropicConfig;
import org.compass.vc_compass.dto.ExtractionResult;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ClaudeService {

    private final AnthropicConfig config;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ClaudeService(AnthropicConfig config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String callClaude(String model, String systemPrompt, String userMessage) {
        String endpoint = config.getBaseUrl() + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", config.getApiKey());
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestBody = String.format("""
            {
              "model": "%s",
              "max_tokens": 1024,
              "system": %s,
              "messages": [
                {"role": "user", "content": %s}
              ]
            }
            """,
            model,
            objectMapper.valueToTree(systemPrompt).toString(),
            objectMapper.valueToTree(userMessage).toString()
        );

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.get("content").get(0).get("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Claude response: " + e.getMessage(), e);
        }
    }

    // Strips markdown code fences (```json ... ```) that Claude sometimes wraps JSON in
    private String stripMarkdownFences(String raw) {
        return raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
    }

    public ExtractionResult extractFromTranscript(String transcript) {
        String systemPrompt = """
            You are a financial transcript analyzer. Given a transcript of a video 
            discussing markets or specific companies, extract structured information.
            Respond ONLY with valid JSON in this exact format, no preamble, no markdown:
            {
              "companiesMentioned": ["Company A", "Company B"],
              "sentiment": "bullish" | "bearish" | "neutral",
              "keyClaims": ["claim 1", "claim 2"],
              "catalysts": ["catalyst 1"]
            }
            """;

        String rawJson = callClaude("claude-haiku-4-5-20251001", systemPrompt, transcript);
        String cleanedJson = stripMarkdownFences(rawJson);

        try {
            return objectMapper.readValue(cleanedJson, ExtractionResult.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse extraction JSON: " + cleanedJson, e);
        }
    }
}