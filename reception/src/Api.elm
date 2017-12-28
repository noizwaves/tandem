module Api exposing (..)

import WebSocket

import Message exposing (..)


apiUrl : String
apiUrl = "wss://concierge-7369rtgvbiy.cfapps.io:4443/api/name/"
--apiUrl = "ws://localhost:8080/api/name/"


sendHostingIntent : String -> Cmd Msg
sendHostingIntent name =
  WebSocket.send (apiUrl ++ name) "host"

sendJoiningIntent : String -> Cmd Msg
sendJoiningIntent name =
  WebSocket.send (apiUrl ++ name) "join"

sendLeaveIntent : String -> Cmd Msg
sendLeaveIntent name =
  WebSocket.send (apiUrl ++ name) "leave"

sendAnswerRequest : String -> String -> Cmd Msg
sendAnswerRequest name offer =
  WebSocket.send (apiUrl ++ name) ("answerRequest:" ++ offer)

sendAnswerResponse : String -> String -> Cmd Msg
sendAnswerResponse name answer =
  WebSocket.send (apiUrl ++ name) ("answerResponse:" ++ answer)
