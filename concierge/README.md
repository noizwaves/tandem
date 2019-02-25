# Concierge

Signalling server backend for Tandem


## Quickstart

The signalling server, written in Java 8 and Spring.
It uses WebSockets to facilitate clients and hosts in exchanging offers and answers.

## Development

1. `cd concierge`
1. `gw bootRun`

## Deployment

1. `cd concierge`
1. `gw build`
1. `cf push`

If a different ICE server (either TURN for relaying or STUN) is desired, use the following environment variables:

- `TANDEM_ICE_URLS`: the URL of the ICE server, i.e. `turn:some-turn-server.tandem.stream:3478?transport=udp` or `stun:stun.l.google.com:19302`
- `TANDEM_ICE_USERNAME`: the username
- `TANDEM_ICE_CREDENTIAL`: the password
- `TANDEM_ICE_LOCATION`: a description of the location of the TURN server
