# Tandem

Remote pair programming tool

## Quickstart

1. Install Node 8 via `brew install node@8`
1. Install latest Yarn via `brew install yarn`
1. Install dependencies via `yarn`

1. Build and start the app via `yarn build` and `yarn start`

## Installation

### Optional

1. `brew install direnv`


## Building for macOS

1. Build via `yarn build`
1. Run via `yarn start.`

### With debugging / dev tools

1. Build via `yarn build:dev`
1. Run via `yarn start:dev`


## Configuration

The Tandem app observes environment variables for configuration.

### At build time

- `TANDEM_DEBUG_TOOLS`: show Chrome developer tools, WebRTC stats, GPU stats, etc.

### At run time

- `TANDEM_LOG_LEVEL`: sets logging level. Accepts `error`, `warn`, `info`, or `debug`.


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
