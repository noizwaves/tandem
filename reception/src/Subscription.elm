module Subscription exposing (..)

import WebSocket

import Model exposing (..)
import Message exposing (..)
import Port exposing (..)


subscriptions : Model -> Sub Msg
subscriptions model =
  let
    base =
      [ updateProcessTrust UpdateProcessTrust
      , appUpdateAvailable AppUpdateAvailable
      , connectivityChanged UpdateConnectivity
      , receiveOffer ReceiveOfferFromDC
      , receiveAnswer ReceiveAnswerFromDC
      , connectionStateChanged ConnectionStateChanged
      , connectionStatsUpdated ConnectionStatsUpdated
      , connectError ConnectError
      ]

    sessionWs = case model.intent of
      Browsing browsingName _ ->
        case browsingName.throttled of
          ValidName name ->
            [ WebSocket.listen (model.apiUrl ++ name) ReceiveApiMessage ]
          _ ->
            [ ]
      Joining name _ ->
        [ WebSocket.listen (model.apiUrl ++ name) ReceiveApiMessage ]
      Hosting name _ ->
        [ WebSocket.listen (model.apiUrl ++ name) ReceiveApiMessage ]
      ConnectionFailed name _ _ ->
        [ WebSocket.listen (model.apiUrl ++ name) ReceiveApiMessage ]
      Connected name _ _ ->
        [ WebSocket.listen (model.apiUrl ++ name) ReceiveApiMessage ]
  in
    Sub.batch (base ++ sessionWs)
