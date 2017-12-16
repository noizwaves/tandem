import Html exposing (Html)

import Port exposing (requestProcessTrust)
import Message exposing (Msg)
import Model exposing (..)
import Model exposing (ProcessTrustLevel(..))
import Subscription exposing (subscriptions)
import Update exposing (update)
import View exposing (view)


init : (Model, Cmd Msg)
init =
  (Model UpdateStatusUnknown NoNameEntered (Browsing Nothing) TrustUnknown, requestProcessTrust True)


main : Program Never Model Msg
main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
