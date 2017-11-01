package io.displaychampion.concierge;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> hostMap = new HashMap<>();
    private final Map<String, WebSocketSession> joinMap = new HashMap<>();
    private final Map<WebSocketSession, String> nameMap = new HashMap<>();

    private final WebSocketRoute webSocketRoute;

    public WebSocketHandler(WebSocketRoute webSocketRoute) {
        this.webSocketRoute = webSocketRoute;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String name = webSocketRoute.extractName(session.getUri());

        nameMap.put(session, name);

        sendInformation(name, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String name = webSocketRoute.extractName(session.getUri());

        nameMap.remove(session);

        if (session.equals(hostMap.get(name))) {
            hostMap.remove(name);
            broadcastInformation(name);
        }

        if (session.equals(joinMap.get(name))) {
            joinMap.remove(name);
            broadcastInformation(name);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String name = webSocketRoute.extractName(session.getUri());
        if (message.getPayload().contains("\"host\"")) {
            // TODO: validate & check existing state
            hostMap.put(name, session);
            broadcastInformation(name);
        } else if (message.getPayload().contains("\"join\"")) {
            // TODO: validate & check existing state
            joinMap.put(name, session);
            broadcastInformation(name);
        }
    }

    private void sendInformation(String name, WebSocketSession session) throws IOException {
        boolean canHost = !hostMap.containsKey(name);
        boolean canJoin = !joinMap.containsKey(name);

        session.sendMessage(new TextMessage("{\"canHost\":" + canHost + ",\"canJoin\":" + canJoin + "}"));
    }

    private void broadcastInformation(String name) {
        List<WebSocketSession> sessions = nameMap.entrySet().stream()
                .filter(kv -> kv.getValue().equals(name))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        sessions.stream().forEach(session -> {
            try {
                sendInformation(name, session);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
}
