module Message exposing (..)

import Model exposing (NameInformation, ValidatedName, ConnectionStats)
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
  | EndSession

  | ReceiveOfferFromDC String
  | ReceiveAnswerFromDC String

  | ConnectionStateChanged Bool
  | ConnectionStatsUpdated String

  | UpdateConnectivity Bool

  | Noop
