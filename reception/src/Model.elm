module Model exposing (..)

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

type alias Model =
  { name: String
  , intent: ConnectionIntent
  }
