module Api exposing (..)

import WebSocket

import Message exposing (..)


sendHostingIntent : String -> String -> Cmd Msg
sendHostingIntent apiUrl name =
  WebSocket.send (apiUrl ++ name) "host"

sendJoiningIntent : String -> String -> Cmd Msg
sendJoiningIntent apiUrl name =
  WebSocket.send (apiUrl ++ name) "join"

sendLeaveIntent : String -> String -> Cmd Msg
sendLeaveIntent apiUrl name =
  WebSocket.send (apiUrl ++ name) "leave"

sendAnswerRequest : String -> String -> String -> Cmd Msg
sendAnswerRequest apiUrl name offer =
  WebSocket.send (apiUrl ++ name) ("answerRequest:" ++ offer)

sendAnswerResponse : String -> String -> String -> Cmd Msg
sendAnswerResponse apiUrl name answer =
  WebSocket.send (apiUrl ++ name) ("answerResponse:" ++ answer)

sendConnectError : String -> String -> String -> Cmd Msg
sendConnectError apiUrl name error =
  WebSocket.send (apiUrl ++ name) ("connectError:" ++ error)
