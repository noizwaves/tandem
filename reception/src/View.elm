module View exposing (..)

import Html exposing (Html, button, div, form, text, input, span)
import Html.Attributes exposing (autofocus, class, disabled, type_, placeholder)
import Html.Events exposing (onInput, onSubmit)

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
            div [ class "name-error" ] [ text "Name must be longer than 4 characters" ]
          InvalidCharacters ->
            div [ class "name-error" ] [ text "Name must contain only alpha-numeric characters, dashes, and underscores" ]
      _ ->
        text ""

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
      Untrusted ->
        div [ class "accessibility-alert" ]
          [ text "Enable Accessibility for Tandem in "
          , span [ class "steps"] [ text "System Preferences > Security & Privacy > Privacy" ]
          ]
      TrustUnknown ->
        text ""
      Trusted ->
        text ""

  in
    form formAttrs
      [ input [ autofocus True, class inputClass, placeholder "Enter a name to begin", type_ "text", onInput NameChanged, disabled (not inputEnabled) ] [ ]
      , nameErrorMessage
      , div [ class "start-buttons" ] buttons
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
