import Html exposing (Html, button, div, text, input)
import Html.Attributes exposing (class, disabled, type_, placeholder)
import Html.Events exposing (onClick, onInput)

import Http
import RemoteData exposing (WebData, RemoteData(..))

import Json.Decode as Decode
import Json.Decode.Extra exposing ((|:))

-- Model

type NameInformation
  = Unclaimed String

type alias Model =
  { name: String
  , information: WebData NameInformation
  }

init : (Model, Cmd Msg)
init =
  (Model "" NotAsked, Cmd.none)


-- Message

type Msg
  = NameChanged String
  | NameInformationChanged (WebData NameInformation)


-- Update

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    NameChanged newName ->
      let
        checkName = if newName == "" then
            Cmd.none
          else
            fetchInformation newName
      in
        ( { model | name = newName }, checkName )

    NameInformationChanged information ->
      ( { model | information = information }, Cmd.none )

fetchInformation : String -> Cmd Msg
fetchInformation name =
  Http.request
      { method = "GET"
      , headers = [ ]
      , url = "http://localhost:8000/api/name/" ++ name
      , body = Http.emptyBody
      , expect = Http.expectJson decodeNameInformation
      , timeout = Nothing
      , withCredentials = False
      }
      |> RemoteData.sendRequest
      |> Cmd.map NameInformationChanged

decodeNameInformation : Decode.Decoder NameInformation
decodeNameInformation = Decode.oneOf
  [ decodeNameInformationUnclaimed
  ]

decodeNameInformationUnclaimed : Decode.Decoder NameInformation
decodeNameInformationUnclaimed =
  Decode.succeed Unclaimed
    |: (Decode.field "unclaimed" Decode.string)

-- View

view : Model -> Html Msg
view model =
  let
    buttonText = if model.name == ""
      then "Start"
      else
        case model.information of
          NotAsked -> "Start"
          Loading -> "Loading..."
          Success information ->
            case information of
              Unclaimed _ -> "Host"
          Failure err -> "Error"

    instruction = if buttonText == "Start"
      then
        [ text "Type in a name" ]
      else
        []

    loadingIndicator = if buttonText == "Loading"
      then
        [ text "Loading..." ]
      else
        []

    joinButton = if buttonText == "Join"
      then
        [ button [ class "start-button" ] [ text "Join" ] ]
      else
        []

    hostButton = if buttonText == "Host"
      then
        [ button [ class "start-button" ] [ text "Host" ] ]
      else
        []

    buttons = instruction ++ loadingIndicator ++ hostButton ++ joinButton

  in
    div [ class "start-form" ]
      [ input [ class "name", placeholder "Type in a name", type_ "text", onInput NameChanged ] [ ]
      , div [ class "start-buttons" ] buttons
      ]


-- Subscriptions

subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none

main : Program Never Model Msg
main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }
