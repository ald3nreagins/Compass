package org.compass.vc_compass.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class TextExtractionService {

    private static final int MIN_VIABLE_LENGTH = 400;

    public String extractTextFromUrl(String url) throws IOException {
        Document doc;
        try {
            doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (compatible; CompassBot/1.0)")
                    .timeout(15000)
                    .get();
        } catch (IOException e) {
            throw new IOException(
                "Could not fetch this URL. It may be behind a login wall, blocking automated access, " +
                "or temporarily unavailable. Try pasting the article text directly instead.", e
            );
        }

        var articleEl = doc.selectFirst("article");
        String text = articleEl != null ? articleEl.text() : doc.body().text();

        if (text == null || text.isBlank()) {
            throw new IOException(
                "No readable text found at this URL. Try pasting the article text directly instead."
            );
        }

        if (text.length() < MIN_VIABLE_LENGTH) {
            throw new IOException(
                "This page returned very little text (" + text.length() + " characters), which usually " +
                "means it's behind a paywall or login wall. Please copy the article text and use " +
                "\"Paste Text\" instead."
            );
        }

        return text;
    }
}

