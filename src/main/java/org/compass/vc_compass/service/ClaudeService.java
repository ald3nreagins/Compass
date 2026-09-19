package org.compass.vc_compass.service;

import tools.jackson.databind.JsonNode;
import java.util.List;
import tools.jackson.databind.ObjectMapper;
import org.compass.vc_compass.config.AnthropicConfig;
import org.compass.vc_compass.dto.ExtractionResult;
import org.compass.vc_compass.dto.PortfolioImpactResult;
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

    // Extracts just the JSON object, discarding any preamble or trailing commentary
        // Extracts just the JSON object, discarding any preamble or trailing commentary
    private String extractJsonObject(String raw) {
        String cleaned = stripMarkdownFences(raw);
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            throw new RuntimeException("No valid JSON object found in response: " + raw);
        }
        return cleaned.substring(start, end + 1);
    }

    public ExtractionResult extractFromTranscript(String transcript) {
    
    String systemPrompt = """
        You are analyzing a startup pitch or company video transcript on behalf of 
        venture capital investors evaluating this company. Extract the following, 
        grounded strictly in what was actually said — do not infer or assume facts 
        not present in the transcript. If a field doesn't apply or wasn't mentioned, 
        use null or an empty list.

        If the transcript is clearly NOT a startup pitch, company evaluation, or 
        business-relevant content (e.g. it's news, politics, entertainment, or 
        unrelated commentary), respond with exactly this JSON and nothing else:
        {"notApplicable": true, "reason": "brief one-sentence reason"}

        Otherwise, respond ONLY with valid JSON in this exact format, no preamble, no markdown:
        {
          "companyName": "name if stated, otherwise null",
          "productDescription": "one sentence describing what the product/service does",
          "targetMarket": "who the product is for, if stated",
          "statedMetrics": ["any specific numbers mentioned: revenue, users, growth rate"],
          "founderCredibility": ["relevant experience or background the founder mentions"],
          "keyClaims": ["notable claims made, flagged as claims not verified facts"],
          "risksOrConcerns": ["anything that sounds vague, unverified, or potentially concerning"],
          "sentiment": "confident" | "uncertain" | "overhyped",
          "investmentReadiness": "early-stage" | "growth-stage" | "unclear"
        }
        """;

    String rawJson = callClaude("claude-haiku-4-5-20251001", systemPrompt, transcript);
    String cleanedJson = extractJsonObject(rawJson);

    try {
        return objectMapper.readValue(cleanedJson, ExtractionResult.class);
    } catch (Exception e) {
        throw new RuntimeException("Failed to parse extraction JSON: " + cleanedJson, e);
    }
    }

    public PortfolioImpactResult analyzePortfolioImpact(String transcript, List<String> portfolioCompanies) {
    String portfolioList = String.join(", ", portfolioCompanies);

    String systemPrompt = String.format("""
        You are analyzing a current-events video transcript on behalf of a venture 
        capital firm, to assess how this event might affect their existing portfolio.

        The firm's portfolio companies/sectors are: %s

        Ground every claim strictly in what was actually said in the transcript — 
        do not invent connections that aren't reasonably supported. If the event has 
        no meaningful connection to the portfolio, say so honestly rather than 
        forcing a connection.

        Respond ONLY with valid JSON in this exact format, no preamble, no markdown:
        {
          "eventSummary": "one or two sentence summary of the actual event/news",
          "affectedSectors": ["broad sectors this event touches, e.g. 'fintech', 'AI infrastructure'"],
          "affectedCompanies": [
            {
              "companyName": "name from the portfolio list, only if genuinely relevant",
              "impactDirection": "positive" | "negative" | "mixed",
              "rationale": "why this event affects this specific company, grounded in the transcript"
            }
          ],
          "overallImpact": "positive" | "negative" | "mixed" | "neutral",
          "urgency": "immediate" | "monitor" | "low",
          "recommendedActions": ["concrete, specific suggestions if any are warranted"]
        }

        If nothing in the portfolio is genuinely affected, return empty arrays for 
        affectedSectors and affectedCompanies, "neutral" for overallImpact, and 
        "low" for urgency — do not fabricate relevance.
        """, portfolioList);

    String rawJson = callClaude("claude-haiku-4-5-20251001", systemPrompt, transcript);
    String cleanedJson = extractJsonObject(rawJson);

    try {
        return objectMapper.readValue(cleanedJson, PortfolioImpactResult.class);
    } catch (Exception e) {
        throw new RuntimeException("Failed to parse portfolio impact JSON: " + cleanedJson, e);
    }
}
}