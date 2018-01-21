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
              Connected name _ ->
                ( { model | intent = Connected name newInformation }, Cmd.none )
          Ok (ApiAnswerRequest offer) ->
            ( model, requestAnswer offer.answerRequest )
          Ok (ApiAnswerResponse answer) ->
            ( model, giveAnswer answer.answerResponse )

          Err error ->
            ( model, Cmd.none )

    HostSession information ->
      case model.intent of
        Browsing name _ ->
          case name.throttled of
            ValidName name ->
              ( { model | intent = Hosting name information }
              , Cmd.batch
                [ sendHostingIntent name
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
                [ sendJoiningIntent name
                , readyToJoin information
                ]
              )
            _ ->
              ( model, Cmd.none )
        _ ->
          ( model, Cmd.none )

    ReceiveOfferFromDC offer ->
      case model.intent of
        Hosting name _ ->
          ( model, sendAnswerRequest name offer )
        _ ->
          ( model, Cmd.none )

    ReceiveAnswerFromDC answer ->
      case model.intent of
        Joining name _ ->
          ( model, sendAnswerResponse name answer )
        _ ->
          ( model, Cmd.none )

    ConnectionStateChanged connected ->
      if connected then
        case model.intent of
          Hosting name nameInformation ->
            ( { model | intent = Connected name nameInformation }, Cmd.none )
          Joining name nameInformation ->
            ( { model | intent = Connected name nameInformation }, Cmd.none )
          Browsing _ _ ->
            ( model, Cmd.none )
          Connected _ _ ->
            ( model, Cmd.none )
      else
        case model.intent of
          Connected name nameInformation ->
            let
              browsingName = initNameFromString name
            in
              ( { model | intent = Browsing browsingName (Just nameInformation) }, sendLeaveIntent name)
          _ ->
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
