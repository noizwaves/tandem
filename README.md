# Tandem

Remote pair programming tool

## Quickstart

1. Install Node 8 via `brew install node@8`
1. Install latest Yarn via `brew install yarn`
1. Install Elm 0.18 via `npm install -g elm`
1. Install dependencies via `yarn`
1. Rebuild robotjs for electron via `npm rebuild robotjs --runtime=electron --target=1.7.8 --disturl=https://atom.io/download/atom-shell`

1. Start the app via `yarn start`

## Installation

### Optional

1. `brew install direnv`


## Building for macOS

1. Build via `yarn build`
1. Run via `electron .`

### With debugging / dev tools

1. Build via `yarn build:debug`
1. Run via `electron .`


## Architecture

### Concierge

The signalling server, written in Java and Spring.
It uses WebSockets to facilitate clients and hosts in exchanging offers and answers.

#### Development

1. `cd concierge`
1. `gw bootRun`

#### Deployment

1. `cd concierge`
1. `gw build`
1. `cf push`
