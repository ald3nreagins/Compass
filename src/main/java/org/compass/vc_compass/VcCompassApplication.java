package org.compass.vc_compass;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
public class VcCompassApplication {

	public static void main(String[] args) {
		loadEnvFile();
		SpringApplication.run(VcCompassApplication.class, args);
	}

	private static void loadEnvFile() {
		try (BufferedReader reader = new BufferedReader(new FileReader(".env"))) {
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.trim();
				if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
					continue;
				}
				int idx = line.indexOf('=');
				String key = line.substring(0, idx).trim();
				String value = line.substring(idx + 1).trim();
				System.setProperty(key, value);
			}
		} catch (IOException e) {
			System.out.println("No .env file found, skipping (this is fine if using real environment variables).");
		}
	}

}