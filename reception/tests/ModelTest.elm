module ModelTest exposing (..)

import Expect exposing (Expectation)
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (..)

import Model exposing (validateName)

suite : Test
suite =
  describe "Model module"
    [ describe "validateName"
      [ test "no name entered" <|
        \_ ->
          ""
            |> validateName
            |> Expect.equal Model.NoNameEntered

      , test "too short" <|
        \_ ->
          "abc"
            |> validateName
            |> Expect.equal (Model.InvalidName Model.TooShort)

      , test "just long enough" <|
        \_ ->
          "abcd"
            |> validateName
            |> Expect.equal (Model.ValidName "abcd")

      , test "accepts alpha digit dash underscore" <|
        \_ ->
          "aB9-_"
            |> validateName
            |> Expect.equal (Model.ValidName "aB9-_")

      , test "rejects whitespace" <|
        \_ ->
          "foo bar"
            |> validateName
            |> Expect.equal (Model.InvalidName Model.InvalidCharacters)

      , test "rejects other punctuation" <|
        \_ ->
          let
            trailingCharacters =
              [ "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "{" ]

            hasInvalidCharacters = \r -> r == (Model.InvalidName Model.InvalidCharacters)
          in
            trailingCharacters
              |> List.map (\s -> String.append "foobar" s)
              |> List.map validateName
              |> List.all hasInvalidCharacters
              |> Expect.true "all characters should be invalid"
      ]
    ]
