import Html exposing (Html, button, div, text, input)
import Html.Attributes exposing (class, disabled, type_, placeholder)
import Html.Events exposing (onClick, onInput)

import Http
import RemoteData exposing (WebData, RemoteData(..))
import WebSocket

import Json.Decode as Decode
import Json.Decode.Extra exposing ((|:))

-- Model

type alias NameInformation =
  { canJoin: Bool
  , canHost: Bool
  }

type ConnectionIntent
  = Browsing
  | Hosting
  | Joining

type alias Model =
  { name: String
  , intent: ConnectionIntent
  , information: WebData NameInformation
  }

isValidName : String -> Bool
isValidName name = (String.length name) >= 4

init : (Model, Cmd Msg)
init =
  (Model "" Browsing NotAsked, Cmd.none)


-- Message

type Msg
  = NameChanged String

  | ReceiveApiMessage String

  | HostSession
  | JoinSession


-- Update

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    NameChanged newName ->
      ( { model | name = newName }, Cmd.none )

    ReceiveApiMessage raw ->
      let
        apiMsg = Decode.decodeString decodeNameInformation raw
      in
        case apiMsg of
          Ok newInformation ->
            ( { model | information = (Success newInformation) }, Cmd.none )
          Err error ->
            ( model, Cmd.none )

    HostSession ->
      ( { model | intent = Hosting }, sendHostingIntent model.name )
    JoinSession ->
      ( { model | intent = Joining }, sendJoiningIntent model.name )

sendHostingIntent : String -> Cmd Msg
sendHostingIntent name =
  WebSocket.send ("ws://localhost:8080/api/name/" ++ name) "{\"host\":true}"

sendJoiningIntent : String -> Cmd Msg
sendJoiningIntent name =
  WebSocket.send ("ws://localhost:8080/api/name/" ++ name) "{\"join\":true}"

decodeNameInformation : Decode.Decoder NameInformation
decodeNameInformation =
  Decode.succeed NameInformation
    |: (Decode.field "canJoin" Decode.bool)
    |: (Decode.field "canHost" Decode.bool)

-- View

view : Model -> Html Msg
view model =
  let
    (buttons, inputEnabled) = case model.intent of
      Browsing ->
        (viewUnconnectedButtons model, True)
      Hosting ->
        (viewHostingButtons model, False)
      Joining ->
        (viewJoiningButtons model, False)

    inputValid = (String.length model.name) == 0 || isValidName model.name
    inputClass = if inputValid then "name" else "name invalid"

  in
    div [ class "start-form" ]
      [ input [ class inputClass, placeholder "Type in a name", type_ "text", onInput NameChanged, disabled (not inputEnabled) ] [ ]
      , div [ class "start-buttons" ] buttons
      ]

viewUnconnectedButtons : Model -> List (Html Msg)
viewUnconnectedButtons model =
  if model.name == "" then
      [ text "Start" ]
  else
    case model.information of
      NotAsked ->
        [ text "Start" ]
      Loading ->
        [ text "Loading..." ]
      Success information ->
        if information.canHost then
          [ button [ class "start-button", onClick HostSession ] [ text "Host" ] ]
        else if information.canJoin then
          [ button [ class "start-button", onClick JoinSession ] [ text "Join" ] ]
        else
          [ text "Occupied" ]
      Failure err ->
        [ text "Error" ]

viewHostingButtons : Model -> List (Html Msg)
viewHostingButtons model =
  case model.information of
    Success information ->
      if (not information.canJoin) then
        [ text "Connecting" ]
      else
        [ text "Hosting" ]
    _ ->
      [ text "Hosting" ]

viewJoiningButtons : Model -> List (Html Msg)
viewJoiningButtons model =
  case model.information of
    Success information ->
      if (not information.canHost) then
        [ text "Connecting" ]
      else
        [ text "Joining" ]
    _ ->
      [ text "Joining" ]

-- Subscriptions

subscriptions : Model -> Sub Msg
subscriptions model =
  if model.name == "" then
    Sub.none
  else
    WebSocket.listen ("ws://localhost:8080/api/name/" ++ model.name) ReceiveApiMessage

main : Program Never Model Msg
main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
