module Update exposing (..)

import Json.Decode as Decode

import Model exposing (..)
import Message exposing (..)
import Decoder exposing (..)
import Port exposing (..)
import Api exposing (..)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    AppUpdateAvailable available ->
      let
        updates = if available then UpdatesAvailable else NoUpdatesAvailable
      in
        ( { model | appUpdates = updates }, Cmd.none )

    NameChanged userInput ->
      ( { model | name = validateName userInput, intent = Browsing Nothing }, Cmd.none )

    UpdateProcessTrust isTrusted ->
      let
        trust = if isTrusted then Trusted else Untrusted
      in
        ( { model | trust = trust }, Cmd.none )

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
              Connected PreviouslyHosting nameInformation ->
                ( { model | intent = Browsing Nothing }, sendLeaveIntent name)
              Connected PreviouslyJoining nameInformation ->
                ( { model | intent = Browsing Nothing }, sendLeaveIntent name)
              _ ->
                ( model, Cmd.none )
          _ ->
            ( model, Cmd.none )

    Noop ->
      ( model, Cmd.none )


initiateHandshakeIfRequired : NameInformation -> Cmd Msg
initiateHandshakeIfRequired info =
  let
    connectionRequired = (not info.canJoin) && (not info.canHost)
  in
    if connectionRequired then
      requestOffer True
    else
      Cmd.none
