port module Port exposing (..)

import Model exposing (NameInformation, ConnectionStats)

port appUpdateAvailable : (Bool -> msg) -> Sub msg

port requestProcessTrust : Bool -> Cmd msg
port updateProcessTrust : (Bool -> msg) -> Sub msg
port openExternalWebsite : String -> Cmd msg

port readyToHost : NameInformation -> Cmd msg
port readyToJoin : NameInformation -> Cmd msg
port endSession : Bool -> Cmd msg

port requestOffer : Bool -> Cmd msg
port receiveOffer : (String -> msg) -> Sub msg
port requestAnswer : String -> Cmd msg
port receiveAnswer : (String -> msg) -> Sub msg
port giveAnswer : String -> Cmd msg
port connectError : (String -> msg) -> Sub msg

port connectionStateChanged : (Bool -> msg) -> Sub msg
port connectionStatsUpdated : (String -> msg) -> Sub msg

port connectivityChanged : (Bool -> msg) -> Sub msg
