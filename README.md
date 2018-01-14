# Tandem

Remote pair programming tool


## Quickstart

1. `yarn`
1. `yarn build`
1. `yarn start`


## Installation

### MacOS

1. Install Node 8 via `brew install node@8`
1. Install latest Yarn via `brew install yarn`
1. Install node-gyp via `yarn global add node-gyp`
1. Install dependencies via `yarn`

#### Optional

1. `brew install direnv`

### Windows

1. Install Node 8 from website
1. Install Yarn from website
1. [Install windows build essentials for node-gyp](https://github.com/nodejs/node-gyp#option-1) by:
  1. Opening a Command Prompt with administrative access
  1. Running `npm install --global --production windows-build-tools --add-python-to-path`
1. Install node-gyp via `yarn global add node-gyp`
1. Install dependencies via `yarn`

### Linux

1. Install Node 8 following [this guide](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
1. Install Yarn by followg [this guide](https://yarnpkg.com/lang/en/docs/install/#linux-tab)
1. Install [robotjs build dependencies](https://github.com/octalmage/robotjs#building) via `sudo apt-get install libxtst-dev libpng++-dev`
1. Install node-gyp via `yarn global add node-gyp`


## Building

1. Build via `yarn build`
1. Run via `yarn start`

### For Development

1. Build via `yarn build:dev`
1. Run via `yarn start:dev`

### For Debugging

1. Build via `yarn build:debug`
1. Run via `yarn start:dev`


## Configuration

The Tandem app observes environment variables for configuration.

### At build time

- `TANDEM_DEBUG_TOOLS`: show Chrome developer tools, WebRTC stats, GPU stats, etc.

### At run time

- `TANDEM_LOG_LEVEL`: sets logging level. Accepts `error`, `warn`, `info`, or `debug`.
- `TANDEM_PRINT_SENSITIVE_VALUES_IN_LOGS`: replaces highly sensitive (i.e. key codes on key events) into logs. This triggers key logger behaviour. **Use at your own risk!**


## Architecture

### Concierge

The signalling server, written in Java 8 and Spring.
It uses WebSockets to facilitate clients and hosts in exchanging offers and answers.

#### Development

1. `cd concierge`
1. `gw bootRun`

#### Deployment

1. `cd concierge`
1. `gw build`
1. `cf push`
