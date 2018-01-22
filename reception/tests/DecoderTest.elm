module DecoderTest exposing (..)

import Expect exposing (Expectation)
import Json.Decode as Decode
import Fuzz exposing (Fuzzer, int, list, string)
import Test exposing (..)

import Decoder exposing (decodeConnectionStats)
import Model exposing (ConnectionStats, ConnectionMethod(..))

suite : Test
suite =
  describe "Decoder module"
    [ describe "decodeConnectionStats"
      [ test "all values present" <|
        \_ ->
          "{\"roundTripTimeMs\":1234,\"connection\":{\"method\":\"relay\",\"relayLocation\":\"Earth\"}}"
            |> Decode.decodeString decodeConnectionStats
            |> Expect.equal (Ok (ConnectionStats (Just Relay) (Just "Earth") (Just 1234)))
      , test "null values present" <|
        \_ ->
          "{\"roundTripTimeMs\":null,\"connection\":{\"method\":null,\"relayLocation\":null}}"
            |> Decode.decodeString decodeConnectionStats
            |> Expect.equal (Ok (ConnectionStats Nothing Nothing Nothing))
     ]
    ]
