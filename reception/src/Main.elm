import Html exposing (Html, button, div, form, text, input, span)
import Html.Attributes exposing (autofocus, class, disabled, type_, placeholder)
import Html.Events exposing (onInput, onSubmit)

import WebSocket

import Json.Decode as Decode
import Json.Decode.Extra exposing ((|:))

import Port exposing (requestOffer, receiveOffer, requestAnswer, receiveAnswer, giveAnswer, connectionStateChanged, readyToHost, readyToJoin, updateProcessTrust, requestProcessTrust)
import Model exposing (..)
import Model exposing (ProcessTrustLevel(..))

-- Model stuff

isValidName : String -> Bool
isValidName name = (String.length name) >= 4

init : (Model, Cmd Msg)
init =
  (Model "" (Browsing Nothing) TrustUnknown, requestProcessTrust True)


-- Message

type Msg
  = NameChanged String

  | UpdateProcessTrust Bool

  | ReceiveApiMessage String

  | HostSession NameInformation
  | JoinSession NameInformation

  | ReceiveOfferFromDC String
  | ReceiveAnswerFromDC String

  | ConnectionStateChanged Bool



-- Update

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    NameChanged newName ->
      ( { model | name = newName, intent = Browsing Nothing }, Cmd.none )

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
      ( { model | intent = Hosting information }
      , Cmd.batch
        [ sendHostingIntent model.name
        , readyToHost information
        ]
      )
    JoinSession information ->
      ( { model | intent = Joining information }
      , Cmd.batch
        [ sendJoiningIntent model.name
        , readyToJoin information
        ]
      )

    ReceiveOfferFromDC offer ->
      ( model , sendAnswerRequest model.name offer )
    ReceiveAnswerFromDC answer ->
      ( model , sendAnswerResponse model.name answer )

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
        case model.intent of
          Connected PreviouslyHosting nameInformation ->
            ( { model | intent = Hosting nameInformation }, Cmd.none )
          Connected PreviouslyJoining nameInformation ->
            ( { model | intent = Joining nameInformation }, Cmd.none )
          _ ->
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

apiUrl : String
apiUrl = "wss://concierge-7369rtgvbiy.cfapps.io:4443/api/name/"
--apiUrl = "ws://localhost:8080/api/name/"

sendHostingIntent : String -> Cmd Msg
sendHostingIntent name =
  WebSocket.send (apiUrl ++ name) "host"

sendJoiningIntent : String -> Cmd Msg
sendJoiningIntent name =
  WebSocket.send (apiUrl ++ name) "join"

sendAnswerRequest : String -> String -> Cmd Msg
sendAnswerRequest name offer =
  WebSocket.send (apiUrl ++ name) ("answerRequest:" ++ offer)

sendAnswerResponse : String -> String -> Cmd Msg
sendAnswerResponse name answer =
  WebSocket.send (apiUrl ++ name) ("answerResponse:" ++ answer)


decodeApiMessage : Decode.Decoder ApiMessage
decodeApiMessage =
  Decode.oneOf
   [ Decode.succeed ApiAnswerRequest |: decodeAnswerRequest
   , Decode.succeed ApiAnswerResponse |: decodeAnswerResponse
   , Decode.succeed ApiNameInformation |: decodeNameInformation
   ]

decodeAnswerRequest : Decode.Decoder AnswerRequest
decodeAnswerRequest =
  Decode.succeed AnswerRequest
    |: (Decode.field "answerRequest" Decode.string)

decodeAnswerResponse : Decode.Decoder AnswerResponse
decodeAnswerResponse =
  Decode.succeed AnswerResponse
    |: (Decode.field "answerResponse" Decode.string)

decodeNameInformation : Decode.Decoder NameInformation
decodeNameInformation =
  Decode.succeed NameInformation
    |: (Decode.field "canJoin" Decode.bool)
    |: (Decode.field "canHost" Decode.bool)
    |: (Decode.field "iceServers" (Decode.list decodeIceServerConfiguration))

decodeIceServerConfiguration : Decode.Decoder IceServerConfiguration
decodeIceServerConfiguration =
  Decode.succeed IceServerConfiguration
    |: (Decode.field "urls" Decode.string)
    |: (Decode.field "username" Decode.string)
    |: (Decode.field "credential" Decode.string)

-- View

view : Model -> Html Msg
view model =
  let
    (buttons, inputEnabled) = case model.intent of
      Browsing information ->
        (viewUnconnectedButtons information, True)
      Hosting information ->
        (viewHostingButtons information, False)
      Joining information ->
        (viewJoiningButtons information, False)
      Connected _ _ ->
        ([ text "Connected" ], False)

    inputValid = (String.length model.name) == 0 || isValidName model.name
    inputClass = if inputValid then "name" else "name invalid"

    formAttrs = case model.intent of
      Browsing (Just info) ->
        if info.canHost then
          [ class "start-form", onSubmit (HostSession info) ]
        else if info.canJoin then
          [ class "start-form", onSubmit (JoinSession info) ]
        else
          [ class "start-form" ]
      _ ->
        [ class "start-form" ]

    accessibilityCheck = case model.trust of
      TrustUnknown ->
        text ""
      Untrusted ->
        div [ class "accessibility-alert" ]
          [ text "Enable Accessibility for Tandem in "
          , span [ class "steps"] [ text "System Preferences > Security & Privacy > Privacy" ]
          ]
      Trusted ->
        text ""

  in
    form formAttrs
      [ input [ autofocus True, class inputClass, placeholder "Type in a name", type_ "text", onInput NameChanged, disabled (not inputEnabled) ] [ ]
      , div [ class "start-buttons" ] buttons
      , accessibilityCheck
      ]

viewUnconnectedButtons : Maybe NameInformation -> List (Html Msg)
viewUnconnectedButtons information =
  case information of
    Nothing ->
      [ text "Start" ]
    Just info ->
      if info.canHost then
        [ button [ class "start-button", type_ "submit" ] [ text "Host" ] ]
      else if info.canJoin then
        [ button [ class "start-button", type_ "submit" ] [ text "Join" ] ]
      else
        [ text "Occupied" ]

viewHostingButtons : NameInformation -> List (Html Msg)
viewHostingButtons information =
  if (not information.canJoin) then
    [ text "Connecting" ]
  else
    [ text "Hosting" ]

viewJoiningButtons : NameInformation -> List (Html Msg)
viewJoiningButtons information =
  if (not information.canHost) then
    [ text "Connecting" ]
  else
    [ text "Joining" ]

-- Subscriptions

subscriptions : Model -> Sub Msg
subscriptions model =
  let
    base =
      [ updateProcessTrust UpdateProcessTrust
      ]
    inValidRoom = if not (isValidName model.name) then [] else
      [ WebSocket.listen (apiUrl ++ model.name) ReceiveApiMessage
      , receiveOffer ReceiveOfferFromDC
      , receiveAnswer ReceiveAnswerFromDC
      , connectionStateChanged ConnectionStateChanged
      , updateProcessTrust UpdateProcessTrust
      ]
  in
    Sub.batch (base ++ inValidRoom)

main : Program Never Model Msg
main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
