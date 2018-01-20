module UpdateTest exposing (..)

import Expect exposing (Expectation)
import Test exposing (..)

import Debounce
import Update exposing (update)
import Message exposing (Msg(..))
import Model exposing (Model, NameInformation, AppUpdateAvailability(..), ValidatedName(..), ConnectionIntent(..), ProcessTrustLevel(..), ConnectivityLevel(..), PreConnectionIntent(..))


suite : Test
suite =
  describe "Update module"
    [ describe "update"
      [ connectionStateChangedSuite ]
    ]

standardModel : Model
standardModel =
  { appUpdates = UpdateStatusUnknown
  , rawName = "foo"
  , name = ValidName "foo"
  , nameDebouncer = Debounce.init
  , throttledName = ValidName "foo"
  , intent = (Browsing Nothing)
  , trust = TrustUnknown
  , connectivity = Online
  }

standardInfo : NameInformation
standardInfo =
  { canJoin = True
  , canHost = True
  , iceServers = [ ]
  }

connectionStateChangedSuite : Test
connectionStateChangedSuite =
  describe "handling ConnectionStateChanged"
    [ test "disconnected while hosting" <|
      \_ ->
        { standardModel | intent = Connected PreviouslyHosting standardInfo }
        |> update (ConnectionStateChanged False)
        |> Tuple.first
        |> Expect.equal { standardModel | intent = Browsing (Just standardInfo) }
    , test "disconnected while joined" <|
      \_ ->
        { standardModel | intent = Connected PreviouslyJoining standardInfo }
        |> update (ConnectionStateChanged False)
        |> Tuple.first
        |> Expect.equal { standardModel | intent = Browsing (Just standardInfo) }
    ]
