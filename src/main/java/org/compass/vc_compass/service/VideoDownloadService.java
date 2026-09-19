package org.compass.vc_compass.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class VideoDownloadService {

    public byte[] downloadAudioFromUrl(String videoUrl) throws IOException, InterruptedException {
        String tempId = UUID.randomUUID().toString();
        String outputTemplate = "/tmp/" + tempId + ".%(ext)s";

        ProcessBuilder pb = new ProcessBuilder(
                "yt-dlp",
                "-x",
                "--audio-format", "mp3",
                "-o", outputTemplate,
                videoUrl
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Capture output for debugging failures
        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("yt-dlp failed for URL: " + videoUrl + "\nOutput: " + output);
        }

        Path audioFile = Path.of("/tmp/" + tempId + ".mp3");
        if (!Files.exists(audioFile)) {
            throw new RuntimeException("Expected audio file not found after yt-dlp ran: " + audioFile);
        }

        byte[] audioBytes = Files.readAllBytes(audioFile);
        Files.deleteIfExists(audioFile); // cleanup
        return audioBytes;
    }
}