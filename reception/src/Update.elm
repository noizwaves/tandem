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
      let
        validatedName = validateName userInput
        (debounce, cmd) = Debounce.push debounceNameConfig validatedName model.nameDebouncer
      in
        ( { model | rawName = userInput, name = validatedName, throttledName = NoNameEntered, intent = Browsing Nothing, nameDebouncer = debounce }, cmd )
    DebouncedNameChange msg ->
      let
        doSetThrottledName = \name -> Task.perform SetThrottledName (Task.succeed name)
        (debounce, cmd) = Debounce.update debounceNameConfig (Debounce.takeLast doSetThrottledName) msg model.nameDebouncer
      in
        ( { model | nameDebouncer = debounce }, cmd )
    SetThrottledName validatedName ->
      ( { model | throttledName = validatedName }, Cmd.none )

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
              Browsing _ ->
                ( { model | intent = Browsing (Just newInformation) }, Cmd.none )
              Hosting _ ->
                ( { model | intent = Hosting newInformation }, initiateHandshakeIfRequired newInformation )
              Joining _ ->
                ( { model | intent = Joining newInformation }, Cmd.none )
              Connected previous _ ->
                ( { model | intent = Connected previous newInformation }, Cmd.none )
          Ok (ApiAnswerRequest offer) ->
            ( model, requestAnswer offer.answerRequest )
          Ok (ApiAnswerResponse answer) ->
            ( model, giveAnswer answer.answerResponse )

          Err error ->
            ( model, Cmd.none )

    HostSession information ->
      case model.name of
        ValidName name ->
          ( { model | intent = Hosting information }
          , Cmd.batch
            [ sendHostingIntent name
            , readyToHost information
            ]
          )
        _ ->
          ( model, Cmd.none )

    JoinSession information ->
      case model.name of
        ValidName name ->
          ( { model | intent = Joining information }
          , Cmd.batch
            [ sendJoiningIntent name
            , readyToJoin information
            ]
          )
        _ ->
          ( model, Cmd.none )

    ReceiveOfferFromDC offer ->
      case model.name of
        ValidName name ->
          ( model , sendAnswerRequest name offer )
        _ ->
          ( model, Cmd.none )

    ReceiveAnswerFromDC answer ->
      case model.name of
        ValidName name ->
          ( model , sendAnswerResponse name answer )
        _ ->
          ( model , Cmd.none )

    ConnectionStateChanged connected ->
      if connected then
        case model.intent of
          Hosting nameInformation ->
            ( { model | intent = Connected PreviouslyHosting nameInformation }, Cmd.none )
          Joining nameInformation ->
            ( { model | intent = Connected PreviouslyJoining nameInformation }, Cmd.none )
          Browsing _ ->
            ( model, Cmd.none )
          Connected _ _ ->
            ( model, Cmd.none )
      else
        case model.name of
          ValidName name ->
            case model.intent of
              Connected _ nameInformation ->
                ( { model | intent = Browsing (Just nameInformation) }, sendLeaveIntent name)
              _ ->
                ( model, Cmd.none )
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
