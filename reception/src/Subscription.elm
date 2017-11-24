module Subscription exposing (..)

import WebSocket

import Api exposing (apiUrl)
import Model exposing (..)
import Message exposing (..)
import Port exposing (..)



subscriptions : Model -> Sub Msg
subscriptions model =
  let
    base =
      [ updateProcessTrust UpdateProcessTrust
      ]

    room = case model.name of
      Model.ValidName name ->
        [ WebSocket.listen (apiUrl ++ name) ReceiveApiMessage
        , receiveOffer ReceiveOfferFromDC
        , receiveAnswer ReceiveAnswerFromDC
        , connectionStateChanged ConnectionStateChanged
        , updateProcessTrust UpdateProcessTrust
        ]
      Model.InvalidName _ ->
        [ ]
      Model.NoNameEntered ->
        []
  in
    Sub.batch (base ++ room)
