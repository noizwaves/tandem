module Model exposing (..)

import Regex exposing (Regex, regex, contains)
import Debounce


type alias Model =
  { appUpdates: AppUpdateAvailability
  , rawName: String
  , name: ValidatedName
  , nameDebouncer: Debounce.Debounce ValidatedName
  , throttledName: ValidatedName
  , intent: ConnectionIntent
  , trust: ProcessTrustLevel
  , connectivity: ConnectivityLevel
  }


type ProcessTrustLevel
  = TrustUnknown
  | Trusted
  | Untrusted

type alias IceServerConfiguration =
 { urls: String
 , username: String
 , credential: String
 }

type alias NameInformation =
  { canJoin: Bool
  , canHost: Bool
  , iceServers: List IceServerConfiguration
  }

type alias AnswerRequest =
  { answerRequest: String
  }

type alias AnswerResponse =
  { answerResponse: String
  }

type ApiMessage
  = ApiNameInformation NameInformation
  | ApiAnswerRequest AnswerRequest
  | ApiAnswerResponse AnswerResponse

type PreConnectionIntent
  = PreviouslyHosting
  | PreviouslyJoining

type ConnectionIntent
  = Browsing (Maybe NameInformation)
  | Hosting NameInformation
  | Joining NameInformation
  | Connected PreConnectionIntent NameInformation

type AppUpdateAvailability
  = UpdateStatusUnknown
  | UpdatesAvailable
  | NoUpdatesAvailable

type InvalidNameReason
  = TooShort
  | InvalidCharacters

type ValidatedName
  = NoNameEntered
  | InvalidName InvalidNameReason
  | ValidName String

type ConnectivityLevel
  = Online
  | Offline

validCharacters : Regex
validCharacters =
  regex "^[0-9|a-z|A-Z|\\-|_]*$"

validateName : String -> ValidatedName
validateName name =
  if (String.length name) == 0 then
    NoNameEntered
  else if not (contains validCharacters name) then
    InvalidName InvalidCharacters
  else if (String.length name) >= 4 then
    ValidName name
  else
    InvalidName TooShort
