port module Port exposing (..)

port requestOffer : Bool -> Cmd msg
port receiveOffer : (String -> msg) -> Sub msg
