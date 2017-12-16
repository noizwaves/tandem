package io.displaychampion.concierge;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
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
        String payload = message.getPayload();

        if (payload.startsWith("host")) {
            // TODO: validate & check existing state
            hostMap.put(name, session);
            broadcastInformation(name);
        } else if (payload.startsWith("join")) {
            // TODO: validate & check existing state
            joinMap.put(name, session);
            broadcastInformation(name);
        } else if (payload.startsWith("answerRequest:")) {
            // TODO: validate & check existing state

            String offer = payload.substring("answerRequest:".length());
            WebSocketSession joinerSession = joinMap.get(name);
            sendAnswerRequest(offer, joinerSession);
        } else if (payload.startsWith("answerResponse:")) {
            // TODO: validate & check existing state

            String answer = payload.substring("answerResponse:".length());
            WebSocketSession hostSession = hostMap.get(name);
            sendAnswerResponse(answer, hostSession);
        }
    }

    private void sendInformation(String name, WebSocketSession session) throws IOException {
        boolean canHost = !hostMap.containsKey(name);
        boolean canJoin = !joinMap.containsKey(name);

        HashMap<String, Object> message = new HashMap<>();
        message.put("canHost", canHost);
        message.put("canJoin", canJoin);
        message.put("iceServers", buildIceServers());

        ObjectMapper mapper = new ObjectMapper();
        String payload = mapper.writeValueAsString(message);

        session.sendMessage(new TextMessage(payload));
    }

    private List<Object> buildIceServers() {
        ArrayList<Object> output = new ArrayList<>();

        HashMap<String, String> crank = new HashMap<>();
        crank.put("urls", "turn:crank.tandem.stream:3478?transport=udp");
        crank.put("username", "displaychampion");
        crank.put("credential", "<SOME_PASSWORD_HERE>");

        output.add(crank);

        return output;
    }

    private void sendAnswerRequest(String offer, WebSocketSession session) throws IOException {
        Map<String, String> answerRequest = new HashMap<>();
        answerRequest.put("answerRequest", offer);

        ObjectMapper mapper = new ObjectMapper();
        String payload = mapper.writeValueAsString(answerRequest);

        session.sendMessage(new TextMessage(payload));
    }

    private void sendAnswerResponse(String offer, WebSocketSession session) throws IOException {
        Map<String, String> answerResponse = new HashMap<>();
        answerResponse.put("answerResponse", offer);

        ObjectMapper mapper = new ObjectMapper();
        String payload = mapper.writeValueAsString(answerResponse);

        session.sendMessage(new TextMessage(payload));
    }

    private void broadcastInformation(String name) {
        List<WebSocketSession> sessions = nameMap.entrySet().stream()
                .filter(kv -> kv.getValue().equals(name))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        sessions
                .stream()
                .filter(WebSocketSession::isOpen)
                .forEach(session -> {
                    try {
                        sendInformation(name, session);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
    }
}
