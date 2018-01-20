module View exposing (..)

import Html exposing (Html, button, div, form, i, text, input, span)
import Html.Attributes exposing (title, autofocus, class, value, disabled, type_, placeholder)
import Html.Events exposing (onClick, onInput, onSubmit)

import Model exposing (..)
import Message exposing (..)


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

    inputClass = case model.name of
      NoNameEntered -> "name"
      ValidName _ -> "name"
      InvalidName _ -> "name invalid"

    nameErrorMessage = case model.name of
      InvalidName reason ->
        case reason of
          TooShort ->
            div [ class "name-error" ] [ text "Session name must be longer than 4 characters" ]
          InvalidCharacters ->
            div [ class "name-error" ] [ text "Session name must contain only alpha-numeric characters, dashes, and underscores" ]
      _ ->
        text ""

    noSubmit = onSubmit Cmd.none
    formAttrs = case model.intent of
      Browsing (Just info) ->
        if info.canHost then
          [ class "start-form", onSubmit (HostSession info) ]
        else if info.canJoin then
          [ class "start-form", onSubmit (JoinSession info) ]
        else
          [ class "start-form", onSubmit Noop ]
      _ ->
        [ class "start-form", onSubmit Noop ]

    connectivityAlert = case model.connectivity of
      Online ->
        text ""
      Offline ->
        div [ class "offline-alert" ]
          [ text "No internet connection detected!" ]

    accessibilityCheck = case model.trust of
      Untrusted ->
        div [ class "accessibility-alert" ]
          [ text "Enable Accessibility for Tandem in "
          , span [ class "steps"] [ text "System Preferences > Security & Privacy > Privacy" ]
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

    randomButton = case model.intent of
      Browsing _ ->
        button [ type_ "button", class "random-button", onClick GenerateRandomName   ]
          [ i [ class "fas fa-random", title "Generate random name" ] [] ]
      _ ->
        text ""

    nameInput = input
      [ autofocus True
      , class inputClass
      , placeholder "Enter session name to begin"
      , type_ "text"
      , onInput RawNameChanged
      , disabled (not inputEnabled)
      , value model.rawName
      ]
      [ ]

    nameForm = form formAttrs
      [ nameInput
      , randomButton
      , nameErrorMessage
      , div [ class "start-buttons" ] buttons
      ]
  in
    div []
      [ appUpdateAlert
      , connectivityAlert
      , nameForm
      , accessibilityCheck
      ]


viewUnconnectedButtons : Maybe NameInformation -> List (Html Msg)
viewUnconnectedButtons information =
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
