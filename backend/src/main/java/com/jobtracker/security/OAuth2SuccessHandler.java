package com.jobtracker.security;

import com.jobtracker.model.User;
import com.jobtracker.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** After Google login: find or create the user, issue our own JWT, hand it to the React app. */
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {
    private final UserRepository users; private final JwtUtil jwt;
    @Value("${app.frontend-url}") private String frontendUrl;

    public OAuth2SuccessHandler(UserRepository users, JwtUtil jwt) { this.users = users; this.jwt = jwt; }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res, Authentication auth) throws IOException {
        OAuth2User p = (OAuth2User) auth.getPrincipal();
        String email = p.getAttribute("email");
        String name = p.getAttribute("name");
        User u = users.findByEmail(email).orElseGet(() -> {
            User n = new User();
            n.setEmail(email); n.setName(name != null ? name : email); n.setProvider("GOOGLE");
            return users.save(n);
        });
        String token = jwt.generate(u.getEmail());
        res.sendRedirect(frontendUrl + "/oauth2/redirect?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
    }
}
