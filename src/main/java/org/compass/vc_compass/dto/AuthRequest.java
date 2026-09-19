package org.compass.vc_compass.dto;

public class AuthRequest {
    private String email;
    private String password;
    private String name; // only used on signup, ignored on login

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
