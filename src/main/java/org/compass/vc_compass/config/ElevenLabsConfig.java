package org.compass.vc_compass.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ElevenLabsConfig {

    @Value("${elevenlabs.api.key}")
    private String apiKey;

    @Value("${elevenlabs.api.base-url}")
    private String baseUrl;

    public String getApiKey() { return apiKey; }
    public String getBaseUrl() { return baseUrl; }
}
