module View exposing (..)

import Html exposing (Html, a, button, div, form, i, text, input, span)
import Html.Attributes exposing (title, autofocus, class, href, value, disabled, type_, placeholder)
import Html.Events exposing (onClick, onInput, onSubmit, onWithOptions)

import Model exposing (..)
import Message exposing (..)


view : Model -> Html Msg
view model =
  let
    nameForm = case model.intent of
      Browsing name information ->
        viewBrowsing name information
      Joining name information ->
        viewJoining name information
      Hosting name information ->
        viewHosting name information
      Connected name information ->
        viewConnected name information

    connectivityAlert = case model.connectivity of
      Online ->
        text ""
      Offline ->
        div [ class "offline-alert" ]
          [ text "No internet connection detected!" ]

    accessibilityCheck = case model.trust of
      Untrusted ->
        div [ class "accessibility-alert" ]
          [ text "Tandem needs enhanced accessibility. "
          , span [ class "steps"]
            [ text "Read "
            , button [ class "how-button", onClick ShowMacOsAccessibilityHow ] [ text "how" ]
            , text " and "
            , button [ class "why-button", onClick ShowMacOsAccessibilityWhy ] [ text "why" ]
            , text "."
            ]
          ]
      TrustUnknown ->
        text ""
      Trusted ->
        text ""

    appUpdateAlert = case model.appUpdates of
      UpdatesAvailable ->
        div [ class "update-alert" ]
          [ text "Updates available! Please update Tandem manually ASAP." ]
      UpdateStatusUnknown ->
        text ""
      NoUpdatesAvailable ->
        text ""

  in
    div []
      [ appUpdateAlert
      , connectivityAlert
      , nameForm
      , accessibilityCheck
      ]

viewBrowsing : DebouncedValidatedName -> (Maybe NameInformation) -> Html Msg
viewBrowsing name information =
  let
    formAttrs = case information of
      Just info ->
        if info.canHost then
          [ class "start-form", onSubmit (HostSession info) ]
        else if info.canJoin then
          [ class "start-form", onSubmit (JoinSession info) ]
        else
          [ class "start-form", onSubmit Noop ]
      Nothing ->
        [ class "start-form", onSubmit Noop ]

    inputClass = case name.validated of
      NoNameEntered -> "name"
      ValidName _ -> "name"
      InvalidName _ -> "name invalid"

    nameInput = input
      [ autofocus True
      , class inputClass
      , placeholder "Enter session name to begin"
      , type_ "text"
      , onInput RawNameChanged
      , value name.raw
      ]
      [ ]

    randomButton = button [ type_ "button", class "random-button", onClick GenerateRandomName ]
      [ i [ class "fas fa-random", title "Generate random name" ] []
      ]

    nameErrorMessage = case name.validated of
      InvalidName reason ->
        case reason of
          TooShort ->
            div [ class "name-error" ]
              [ text "Session name must be longer than 4 characters" ]
          InvalidCharacters ->
            div
              [ class "name-error" ] [ text "Session name must contain only alpha-numeric characters, dashes, and underscores" ]
      NoNameEntered ->
        text ""
      ValidName _ ->
        text ""

    buttons = viewBrowsingButtons information
  in
    form formAttrs
      [ nameInput
      , randomButton
      , nameErrorMessage
      , div [ class "start-buttons" ] buttons
      ]

viewJoining : ValidSessionName -> NameInformation -> Html Msg
viewJoining name information =
  let
    buttons = viewJoiningButtons information

    formAttrs =
      [ class "start-form"
      , onSubmit Noop
      ]

    nameInput = input
      [ class "name"
      , placeholder "Enter session name to begin"
      , type_ "text"
      , disabled True
      , value name
      ]
      [ ]
  in
    form formAttrs
      [ nameInput
      , div [ class "start-buttons" ] buttons
      ]

viewHosting : ValidSessionName -> NameInformation -> Html Msg
viewHosting name information =
  let
    buttons = viewHostingButtons information

    formAttrs =
      [ class "start-form"
      , onSubmit Noop
      ]

    nameInput = input
      [ class "name"
      , placeholder "Enter session name to begin"
      , type_ "text"
      , disabled True
      , value name
      ]
      [ ]
  in
    form formAttrs
      [ nameInput
      , div [ class "start-buttons" ] buttons
      ]

viewConnected : ValidSessionName -> NameInformation -> Html Msg
viewConnected name information =
  let
    formAttrs =
      [ class "start-form"
      , onSubmit Noop
      ]

    nameInput = input
      [ class "name"
      , placeholder "Enter session name to begin"
      , type_ "text"
      , onInput RawNameChanged
      , disabled True
      , value name
      ]
      [ ]
  in
    form formAttrs
      [ nameInput
      , div [ class "start-buttons" ]
        [ text "Connected"
        ]
      ]


viewBrowsingButtons : Maybe NameInformation -> List (Html Msg)
viewBrowsingButtons information =
  case information of
    Nothing ->
      [ ]
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
    [ text "Hosting, waiting for pair" ]

viewJoiningButtons : NameInformation -> List (Html Msg)
viewJoiningButtons information =
  if (not information.canHost) then
    [ text "Connecting" ]
  else
    [ text "Joining, waiting for pair" ]
