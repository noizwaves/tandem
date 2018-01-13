package io.displaychampion.concierge;

import org.springframework.stereotype.Service;
import org.springframework.util.AntPathMatcher;

import java.net.URI;

@Service
public class WebSocketRoute {

    private static final String PATH = "/api/v1/session/{name}";

    private final AntPathMatcher antPathMatcher;

    public WebSocketRoute() {
        antPathMatcher = new AntPathMatcher();
    }

    public String getPath() {
        return PATH;
    }

    public String extractName(URI uri) {
        return antPathMatcher
                .extractUriTemplateVariables(PATH, uri.getPath())
                .get("name");
    }
}
