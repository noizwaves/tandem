module Message exposing (..)

import Model exposing (NameInformation, ValidatedName)
import Debounce

type Msg
  = AppUpdateAvailable Bool

  | GenerateRandomName
  | RawNameChanged String
  | DebouncedNameChange Debounce.Msg
  | SetThrottledName ValidatedName

  | UpdateProcessTrust Bool
  | ShowMacOsAccessibilityHow
  | ShowMacOsAccessibilityWhy

  | ReceiveApiMessage String

  | HostSession NameInformation
  | JoinSession NameInformation

  | ReceiveOfferFromDC String
  | ReceiveAnswerFromDC String

  | ConnectionStateChanged Bool

  | UpdateConnectivity Bool

  | Noop
