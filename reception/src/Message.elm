module Message exposing (..)

import Model exposing (NameInformation)

type Msg
  = AppUpdateAvailable Bool

  | NameChanged String

  | UpdateProcessTrust Bool

  | ReceiveApiMessage String

  | HostSession NameInformation
  | JoinSession NameInformation

  | ReceiveOfferFromDC String
  | ReceiveAnswerFromDC String

  | ConnectionStateChanged Bool

  | Noop
