module Model exposing (..)

import Regex exposing (Regex, regex, contains)
import Debounce


type alias Model =
  { appUpdates: AppUpdateAvailability
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
  = Browsing DebouncedValidatedName (Maybe NameInformation)
  | Hosting ValidSessionName NameInformation
  | Joining ValidSessionName NameInformation
  | Connected ValidSessionName PreConnectionIntent NameInformation

type alias DebouncedValidatedName =
  { raw: String
  , validated: ValidatedName
  , debouncer: Debounce.Debounce ValidatedName
  , throttled: ValidatedName}

type AppUpdateAvailability
  = UpdateStatusUnknown
  | UpdatesAvailable
  | NoUpdatesAvailable

type InvalidNameReason
  = TooShort
  | InvalidCharacters

type alias ValidSessionName = String

type ValidatedName
  = NoNameEntered
  | InvalidName InvalidNameReason
  | ValidName ValidSessionName

type ConnectivityLevel
  = Online
  | Offline

initNameFromString : String -> DebouncedValidatedName
initNameFromString value =
  { raw = value
  , validated = validateName value
  , debouncer = Debounce.init
  , throttled = validateName value
  }

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
