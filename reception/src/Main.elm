import Html exposing (Html)

import Port exposing (requestProcessTrust)
import Message exposing (Msg)
import Model exposing (..)
import Model exposing (ProcessTrustLevel(..))
import Subscription exposing (subscriptions)
import Update exposing (update)
import View exposing (view)


init : Flags -> (Model, Cmd Msg)
init flags =
  let
    connectivity = if flags.online then Online else Offline

    emptyName = initNameFromString ""
  in
    { appUpdates = UpdateStatusUnknown
    , intent = Browsing emptyName Nothing
    , trust = TrustUnknown
    , connectivity = connectivity
    } ! [requestProcessTrust True]


main : Program Flags Model Msg
main =
  Html.programWithFlags
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

type alias Flags =
  { online : Bool
  }
