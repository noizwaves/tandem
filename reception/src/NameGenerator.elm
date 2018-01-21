module NameGenerator exposing (randomName)

import Array exposing (fromList)
import Char
import Random


randomName : Random.Generator String
randomName =
  let
    adjectives = fromList
      [ "indigo"
      , "green"
      , "blue"
      , "lively"
      , "aching"
      , "tired"
      , "silky"
      , "woeful"
      , "fluffy"
      , "egotistical"
      , "cloudlike"
      , "crispy"
      ]

    nouns = fromList
      [ "puppy"
      , "kitten"
      , "elephant"
      , "seal"
      , "lizard"
      , "hippo"
      , "squirrel"
      , "elk"
      , "moose"
      , "cheetah"
      , "lentil"
      ]

    adjective = randomStringArrayItem adjectives
    noun = randomStringArrayItem nouns

    lowerCaseCodes = List.range (Char.toCode 'a') (Char.toCode 'z')
    upperCaseCodes = List.range (Char.toCode 'A') (Char.toCode 'Z')
    digitCodes = List.range (Char.toCode '0') (Char.toCode '9')

    alphaNumeric = List.concat [ lowerCaseCodes, upperCaseCodes, digitCodes ]
      |> List.map Char.fromCode
      |> List.map String.fromChar
      |> Array.fromList
      |> randomStringArrayItem

    alphaNumericString = alphaNumeric
      |> Random.list 6
      |> Random.map String.concat
  in
    Random.map3 (\s t u -> s ++ "-" ++ t ++ "-" ++ u) adjective noun alphaNumericString

randomStringArrayItem : Array.Array String -> Random.Generator String
randomStringArrayItem items =
  let
    index = Random.int 1 ((Array.length items) - 1)
    getAtIndex = \i -> Maybe.withDefault "" (Array.get i items)
  in
    Random.map getAtIndex index

lowerCaseCodes : List Char.KeyCode
lowerCaseCodes = List.range (Char.toCode 'a') (Char.toCode 'z')

upperCaseCodes : List Char.KeyCode
upperCaseCodes = List.range (Char.toCode 'A') (Char.toCode 'Z')

digitCodes : List Char.KeyCode
digitCodes = List.range (Char.toCode '0') (Char.toCode '9')


