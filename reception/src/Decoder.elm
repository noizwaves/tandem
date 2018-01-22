module Decoder exposing (..)

import Json.Decode as Decode
import Json.Decode.Extra exposing ((|:))

import Model exposing (..)


decodeApiMessage : Decode.Decoder ApiMessage
decodeApiMessage =
  Decode.oneOf
   [ Decode.succeed ApiAnswerRequest |: decodeAnswerRequest
   , Decode.succeed ApiAnswerResponse |: decodeAnswerResponse
   , Decode.succeed ApiNameInformation |: decodeNameInformation
   ]


decodeAnswerRequest : Decode.Decoder AnswerRequest
decodeAnswerRequest =
  Decode.succeed AnswerRequest
    |: (Decode.field "answerRequest" Decode.string)


decodeAnswerResponse : Decode.Decoder AnswerResponse
decodeAnswerResponse =
  Decode.succeed AnswerResponse
    |: (Decode.field "answerResponse" Decode.string)


decodeNameInformation : Decode.Decoder NameInformation
decodeNameInformation =
  Decode.succeed NameInformation
    |: (Decode.field "canJoin" Decode.bool)
    |: (Decode.field "canHost" Decode.bool)
    |: (Decode.field "iceServers" (Decode.list decodeIceServerConfiguration))


decodeIceServerConfiguration : Decode.Decoder IceServerConfiguration
decodeIceServerConfiguration =
  Decode.succeed IceServerConfiguration
    |: (Decode.field "urls" Decode.string)
    |: (Decode.field "username" Decode.string)
    |: (Decode.field "credential" Decode.string)
    |: (Decode.field "location" Decode.string)


decodeConnectionStats : Decode.Decoder ConnectionStats
decodeConnectionStats =
  Decode.succeed ConnectionStats
    |: Decode.at ["connection", "method"] (Decode.maybe decodeConnectionMethod)
    |: Decode.at ["connection", "relayLocation"] (Decode.maybe Decode.string)
    |: Decode.field "roundTripTimeMs" (Decode.maybe Decode.int)

decodeConnectionMethod : Decode.Decoder ConnectionMethod
decodeConnectionMethod =
  Decode.string
    |> Decode.andThen (\str ->
      case str of
        "direct" ->
          Decode.succeed Direct
        "relay" ->
          Decode.succeed Relay
        unknown ->
          Decode.fail ("Unknown method: " ++ unknown)
    )
