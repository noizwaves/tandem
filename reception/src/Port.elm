port module Port exposing (..)

port requestOffer : Bool -> Cmd msg
port receiveOffer : (String -> msg) -> Sub msg
port requestAnswer : String -> Cmd msg
port receiveAnswer : (String -> msg) -> Sub msg
port giveAnswer : String -> Cmd msg
