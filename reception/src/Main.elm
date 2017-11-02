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
  = Browsing (Maybe NameInformation)
  | Hosting NameInformation
  | Joining NameInformation

type alias Model =
  { name: String
  , intent: ConnectionIntent
  }

isValidName : String -> Bool
isValidName name = (String.length name) >= 4

init : (Model, Cmd Msg)
init =
  (Model "" (Browsing Nothing), Cmd.none)


-- Message

type Msg
  = NameChanged String

  | ReceiveApiMessage String

  | HostSession NameInformation
  | JoinSession NameInformation


-- Update

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    NameChanged newName ->
      ( { model | name = newName, intent = Browsing Nothing }, Cmd.none )

    ReceiveApiMessage raw ->
      let
        apiMsg = Decode.decodeString decodeNameInformation raw
      in
        case apiMsg of
          Ok newInformation ->
            case model.intent of
              Browsing _ ->
                ( { model | intent = Browsing (Just newInformation) }, Cmd.none )
              Hosting _ ->
                ( { model | intent = Hosting newInformation }, Cmd.none )
              Joining _ ->
                ( { model | intent = Joining newInformation }, Cmd.none )

          Err error ->
            ( model, Cmd.none )

    HostSession information ->
      ( { model | intent = Hosting information }, sendHostingIntent model.name )
    JoinSession information ->
      ( { model | intent = Joining information }, sendJoiningIntent model.name )

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
      Browsing information ->
        (viewUnconnectedButtons information, True)
      Hosting information ->
        (viewHostingButtons information, False)
      Joining information ->
        (viewJoiningButtons information, False)

    inputValid = (String.length model.name) == 0 || isValidName model.name
    inputClass = if inputValid then "name" else "name invalid"

  in
    div [ class "start-form" ]
      [ input [ class inputClass, placeholder "Type in a name", type_ "text", onInput NameChanged, disabled (not inputEnabled) ] [ ]
      , div [ class "start-buttons" ] buttons
      ]

viewUnconnectedButtons : Maybe NameInformation -> List (Html Msg)
viewUnconnectedButtons information =
  case information of
    Nothing ->
      [ text "Start" ]
    Just info ->
      if info.canHost then
        [ button [ class "start-button", onClick (HostSession info) ] [ text "Host" ] ]
      else if info.canJoin then
        [ button [ class "start-button", onClick (JoinSession info) ] [ text "Join" ] ]
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
  if not (isValidName model.name) then
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
