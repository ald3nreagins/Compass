package org.compass.vc_compass.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class VideoDownloadService {

    // We call yt-dlp as a Python module ("python -m yt_dlp") rather than as a
    // standalone executable, so this works regardless of where pip put the
    // yt-dlp.exe wrapper on any given machine's PATH.
    private static final String[] PYTHON_CANDIDATES = { "python", "python3", "py" };

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

        Path audioFile = tempDir.resolve(tempId + ".mp3");
        if (!Files.exists(audioFile)) {
            throw new RuntimeException("Expected audio file not found after yt-dlp ran: " + audioFile);
        }

        byte[] audioBytes = Files.readAllBytes(audioFile);
        Files.deleteIfExists(audioFile); // cleanup
        return audioBytes;
    }

    private Process startYtDlp(String outputTemplate, String videoUrl) throws IOException {
        IOException lastError = null;
        String ffmpegDir = findFfmpegDirectory().orElse(null);

        for (String pythonCmd : PYTHON_CANDIDATES) {
            List<String> command = new ArrayList<>(List.of(
                    pythonCmd, "-m", "yt_dlp",
                    "-x", "--audio-format", "mp3"
            ));

            // If we found ffmpeg somewhere yt-dlp wouldn't otherwise look,
            // point it there explicitly. If ffmpeg is already on PATH,
            // yt-dlp finds it on its own and this is simply skipped.
            if (ffmpegDir != null) {
                command.add("--ffmpeg-location");
                command.add(ffmpegDir);
            }

            command.add("-o");
            command.add(outputTemplate);
            command.add(videoUrl);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);

            try {
                return pb.start();
            } catch (IOException e) {
                lastError = e;
                // try the next python interpreter name
            }
        }

        throw new IOException(
            "Could not find a working Python interpreter (tried: python, python3, py). " +
            "Make sure Python is installed and on your PATH, and that yt-dlp is installed " +
            "(`pip install yt-dlp`).",
            lastError
        );
    }

    /**
     * Looks for ffmpeg in the most common places it ends up on each OS,
     * without requiring anyone to configure anything. Falls back to relying
     * on PATH (returns empty) if none of these turn anything up — yt-dlp
     * will then behave exactly as if this method didn't exist.
     */
    private Optional<String> findFfmpegDirectory() {
        String os = System.getProperty("os.name", "").toLowerCase();
        boolean isWindows = os.contains("win");
        String exeName = isWindows ? "ffmpeg.exe" : "ffmpeg";

        List<Path> candidates = new ArrayList<>();

        if (isWindows) {
            String localAppData = System.getenv("LOCALAPPDATA");
            if (localAppData != null) {
                // Covers `winget install ffmpeg` / Gyan.FFmpeg, wherever its
                // version-numbered subfolder happens to land.
                candidates.add(Path.of(localAppData, "Microsoft", "WinGet", "Packages"));
            }
            candidates.add(Path.of("C:\\ffmpeg\\bin\\ffmpeg.exe"));
            candidates.add(Path.of("C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"));
        } else {
            candidates.add(Path.of("/opt/homebrew/bin/ffmpeg")); // Mac (Apple Silicon + Homebrew)
            candidates.add(Path.of("/usr/local/bin/ffmpeg"));    // Mac (Intel + Homebrew) / Linux
            candidates.add(Path.of("/usr/bin/ffmpeg"));          // Linux (apt/yum installs)
        }

        for (Path candidate : candidates) {
            try {
                if (Files.isRegularFile(candidate)) {
                    return Optional.of(candidate.getParent().toString());
                }
                if (Files.isDirectory(candidate)) {
                    // Search a few levels deep (handles nested package-manager
                    // folder structures like WinGet's).
                    try (var stream = Files.walk(candidate, 6)) {
                        Optional<Path> found = stream
                                .filter(p -> p.getFileName().toString().equalsIgnoreCase(exeName))
                                .findFirst();
                        if (found.isPresent()) {
                            return Optional.of(found.get().getParent().toString());
                        }
                    }
                }
            } catch (IOException ignored) {
                // this candidate wasn't accessible — just try the next one
            }
        }

        return Optional.empty();
    }
}