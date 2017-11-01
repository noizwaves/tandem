package io.displaychampion.concierge;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final WebSocketHandler webSocketHandler;
    private final WebSocketRoute webSocketRoute;

    public WebSocketConfig(
            WebSocketHandler webSocketHandler,
            WebSocketRoute webSocketRoute
    ) {
        this.webSocketHandler = webSocketHandler;
        this.webSocketRoute = webSocketRoute;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
                .addHandler(webSocketHandler, webSocketRoute.getPath())
                .setAllowedOrigins("*");
    }
}
