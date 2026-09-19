package org.compass.vc_compass;

import org.compass.vc_compass.dto.ExtractionResult;
import org.compass.vc_compass.service.ClaudeService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class TestClaudeRunner implements CommandLineRunner {

    private final ClaudeService claudeService;

    public TestClaudeRunner(ClaudeService claudeService) {
        this.claudeService = claudeService;
    }

    @Override
    public void run(String... args) throws Exception {
        String fakeTranscript = "This stock is going to the moon, I'm extremely bullish on Tesla " +
                "right now given their upcoming earnings report and new factory announcement.";

        System.out.println("=== TESTING CLAUDE EXTRACTION ===");

        ExtractionResult result = claudeService.extractFromTranscript(fakeTranscript);

        System.out.println("Companies mentioned: " + result.getCompaniesMentioned());
        System.out.println("Sentiment: " + result.getSentiment());
        System.out.println("Key claims: " + result.getKeyClaims());
        System.out.println("Catalysts: " + result.getCatalysts());
        System.out.println("=== TEST COMPLETE ===");
    }
}