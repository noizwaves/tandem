module Update exposing (..)

import Json.Decode as Decode

import Model exposing (..)
import Message exposing (..)
import NameGenerator exposing (randomName)
import Decoder exposing (..)
import Port exposing (..)
import Api exposing (..)
import Debounce exposing (Debounce)
import Time exposing (millisecond)
import Task
import Random


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    AppUpdateAvailable available ->
      let
        updates = if available then UpdatesAvailable else NoUpdatesAvailable
      in
        ( { model | appUpdates = updates }, Cmd.none )
    ShowMacOsUpdateInstructions ->
      ( model, openExternalWebsite "MacOsUpdateInstructions" )

    GenerateRandomName ->
      ( model, Random.generate RawNameChanged randomName )

    RawNameChanged userInput ->
      case model.intent of
        Browsing debouncedName _ ->
          let
            validatedName = validateName userInput

            (debounce, cmd) = Debounce.push debounceNameConfig validatedName debouncedName.debouncer

            name =
              { raw = userInput
              , validated = validatedName
              , throttled = NoNameEntered
              , debouncer = debounce
              }

            browsing = Browsing name Nothing
          in
            ( { model | intent = browsing }, cmd )
        _ ->
          ( model, Cmd.none )
    DebouncedNameChange dmsg ->
      case model.intent of
        Browsing debouncedName information ->
          let
            doSetThrottledName = \name -> Task.perform SetThrottledName (Task.succeed name)
            (debounce, cmd) = Debounce.update debounceNameConfig (Debounce.takeLast doSetThrottledName) dmsg debouncedName.debouncer
            name = { debouncedName | debouncer = debounce }
            browsing = Browsing name information
          in
            ( { model | intent = browsing }, cmd )
        _ ->
          ( model, Cmd.none )
    SetThrottledName validatedName ->
      case model.intent of
        Browsing debouncedName information ->
          let
            name = { debouncedName | throttled = validatedName }
            browsing = Browsing name information
          in
            ( { model | intent = browsing }, Cmd.none )
        _ ->
          ( model, Cmd.none )

    UpdateProcessTrust isTrusted ->
      let
        trust = if isTrusted then Trusted else Untrusted
      in
        ( { model | trust = trust }, Cmd.none )
    ShowMacOsAccessibilityHow ->
      ( model, openExternalWebsite "MacOsAccessibilityHow" )
    ShowMacOsAccessibilityWhy ->
      ( model, openExternalWebsite "MacOsAccessibilityWhy" )

    ReceiveApiMessage raw ->
      let
        apiMsg = Decode.decodeString decodeApiMessage raw
      in
        case apiMsg of
          Ok (ApiNameInformation newInformation) ->
            case model.intent of
              Browsing name _ ->
                ( { model | intent = Browsing name (Just newInformation) }, Cmd.none )
              Hosting name _ ->
                ( { model | intent = Hosting name newInformation }, initiateHandshakeIfRequired newInformation )
              Joining name _ ->
                ( { model | intent = Joining name newInformation }, Cmd.none )
              ConnectionFailed name _ error ->
                ( { model | intent = ConnectionFailed name newInformation error }, Cmd.none )
              Connected name _ stats ->
                ( { model | intent = Connected name newInformation stats }, Cmd.none )
          Ok (ApiAnswerRequest offer) ->
            ( model, requestAnswer offer.answerRequest )
          Ok (ApiAnswerResponse answer) ->
            ( model, giveAnswer answer.answerResponse )
          Ok (ApiConnectError error) ->
            case model.intent of
              Joining name info ->
                ( { model | intent = ConnectionFailed name info error }, Cmd.none )
              Hosting name info ->
                ( { model | intent = ConnectionFailed name info error }, Cmd.none )
              _ ->
                ( model, Cmd.none )

          Err error ->
            ( model, Cmd.none )

    HostSession information ->
      case model.intent of
        Browsing name _ ->
          case name.throttled of
            ValidName name ->
              ( { model | intent = Hosting name information }
              , Cmd.batch
                [ sendHostingIntent model.apiUrl name
                , readyToHost information
                ]
              )
            _ ->
              ( model, Cmd.none )
        _ ->
          ( model, Cmd.none )

    JoinSession information ->
      case model.intent of
        Browsing name _ ->
          case name.throttled of
            ValidName name ->
              ( { model | intent = Joining name information }
              , Cmd.batch
                [ sendJoiningIntent model.apiUrl name
                , readyToJoin information
                ]
              )
            _ ->
              ( model, Cmd.none )
        _ ->
          ( model, Cmd.none )

    ReturnToBrowsing ->
      case model.intent of
        ConnectionFailed name info _ ->
          ( { model | intent = Browsing (initNameFromString name) (Just info) }, sendLeaveIntent model.apiUrl name )
        _ ->
          ( model, Cmd.none )

    EndSession ->
      case model.intent of
        Connected name _ _ ->
          let
            endSessionCommands = Cmd.batch
              [ sendLeaveIntent model.apiUrl name
              , endSession True
              ]
          in
            ( model, endSessionCommands )
        _ ->
          ( model, Cmd.none )

    ReceiveOfferFromDC offer ->
      case model.intent of
        Hosting name _ ->
          ( model, sendAnswerRequest model.apiUrl name offer )
        _ ->
          ( model, Cmd.none )

    ReceiveAnswerFromDC answer ->
      case model.intent of
        Joining name _ ->
          ( model, sendAnswerResponse model.apiUrl name answer )
        _ ->
          ( model, Cmd.none )

    ConnectError error ->
      case model.intent of
        Joining name info ->
          ( { model | intent = ConnectionFailed name info error }
          , Cmd.batch [ sendConnectError model.apiUrl name error ]
          )
        Hosting name info ->
          ( { model | intent = ConnectionFailed name info error }
          , Cmd.batch [ sendConnectError model.apiUrl name error ]
          )
        _ ->
          ( model, Cmd.none )

    ConnectionStateChanged connected ->
      if connected then
        case model.intent of
          Hosting name information ->
            ( { model | intent = Connected name information Nothing }, Cmd.none )
          Joining name information ->
            ( { model | intent = Connected name information Nothing }, Cmd.none )
          Browsing _ _ ->
            ( model, Cmd.none )
          ConnectionFailed _ _ _ ->
            ( model, Cmd.none )
          Connected _ _ _ ->
            ( model, Cmd.none )
      else
        case model.intent of
          Connected name nameInformation _ ->
            let
              browsingName = initNameFromString name
            in
              ( { model | intent = Browsing browsingName (Just nameInformation) }, sendLeaveIntent model.apiUrl name)
          _ ->
            ( model, Cmd.none )

    ConnectionStatsUpdated raw ->
      let
        statsUpdate = Decode.decodeString decodeConnectionStats raw
      in
        case statsUpdate of
          Ok stats ->
            case model.intent of
              Connected name info _ ->
                ( { model | intent = Connected name info (Just stats) }, Cmd.none )
              _ ->
                ( model, Cmd.none )
          Err _ ->
            ( model, Cmd.none )

    UpdateConnectivity online ->
      let
        connectivity = if online then Online else Offline
      in
        ( { model | connectivity = connectivity }, Cmd.none )

    Noop ->
      ( model, Cmd.none )


debounceNameConfig : Debounce.Config Msg
debounceNameConfig =
  { strategy = Debounce.later (500 * millisecond)
  , transform = DebouncedNameChange
  }


save : ValidatedName -> Cmd Msg
save name =
  Task.perform SetThrottledName (Task.succeed name)


initiateHandshakeIfRequired : NameInformation -> Cmd Msg
initiateHandshakeIfRequired info =
  let
    connectionRequired = (not info.canJoin) && (not info.canHost)
  in
    if connectionRequired then
      requestOffer True
    else
      Cmd.none
