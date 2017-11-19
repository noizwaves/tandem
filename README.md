# Tandem

Remote pair programming tool

## Quickstart

1. Install latest Node via `brew install node`
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
