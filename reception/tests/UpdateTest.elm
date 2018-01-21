module UpdateTest exposing (..)

import Expect exposing (Expectation)
import Test exposing (..)

import Debounce
import Update exposing (update)
import Message exposing (Msg(..))
import Model exposing
  ( AppUpdateAvailability(..)
  , ConnectionIntent(..)
  , ConnectivityLevel(..)
  , DebouncedValidatedName
  , Model
  , NameInformation
  , ProcessTrustLevel(..)
  , ValidatedName(..)
  )


suite : Test
suite =
  describe "Update module"
    [ describe "update"
      [ connectionStateChangedSuite ]
    ]

standardName : String -> DebouncedValidatedName
standardName value =
  { raw = value
  , validated = ValidName value
  , debouncer = Debounce.init
  , throttled = ValidName value
  }

standardModel : Model
standardModel =
  { appUpdates = UpdateStatusUnknown
  , intent = Browsing (standardName "foo456") Nothing
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
        { standardModel | intent = Connected "bar123" standardInfo Nothing }
        |> update (ConnectionStateChanged False)
        |> Tuple.first
        |> Expect.equal { standardModel | intent = Browsing (standardName "bar123") (Just standardInfo) }
    , test "disconnected while joined" <|
      \_ ->
        { standardModel | intent = Connected "bar123" standardInfo Nothing }
        |> update (ConnectionStateChanged False)
        |> Tuple.first
        |> Expect.equal { standardModel | intent = Browsing (standardName "bar123") (Just standardInfo) }
    ]
