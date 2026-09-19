package org.compass.vc_compass.service;

import org.compass.vc_compass.config.ElevenLabsConfig;
import org.compass.vc_compass.dto.TranscriptionResult;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

@Service
public class ElevenLabsService {

    private final ElevenLabsConfig config;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ElevenLabsService(ElevenLabsConfig config) {
        this.config = config;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public TranscriptionResult transcribe(byte[] audioBytes, String filename) {
        String endpoint = config.getBaseUrl() + "/v1/speech-to-text";

        HttpHeaders headers = new HttpHeaders();
        headers.set("xi-api-key", config.getApiKey());
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model_id", "scribe_v2");        // v2 is more accurate than v1
        body.add("diarize", "true");               // separates speakers
        body.add("tag_audio_events", "true");      // captures pauses/laughter for context
        body.add("timestamps_granularity", "word"); // word-level timestamps, useful for quoting
        body.add("keyterms", "YourStartupName,ProductName,FounderName"); // up to 100 terms

        
        ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        
        };

        body.add("file", audioResource);
        body.add("model_id", "scribe_v1");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);

        try {
            return objectMapper.readValue(response.getBody(), TranscriptionResult.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse ElevenLabs transcription response: " + response.getBody(), e);
        }
    }
}
