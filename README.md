# Tandem

Remote pair programming tool


## Quickstart

1. `yarn`
1. `yarn build`
1. `yarn start`


## Installation

### MacOS

1. Install Node 8 via:
    1. `brew install node@10`
    1. Add Node's `bin` path to `PATH`
1. Install latest Yarn via `brew install yarn --ignore-dependencies`
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
1. Install Yarn by following [this guide](https://yarnpkg.com/lang/en/docs/install/#linux-tab)
1. Install [robotjs build dependencies](https://github.com/octalmage/robotjs#building) via `sudo apt-get install libxtst-dev libpng++-dev`
1. Install node-gyp via `yarn global add node-gyp`


## Building

1. Build via `yarn build`
1. Run via `yarn start`

### For Development

1. Build via `yarn build`
1. Run via `yarn start:dev`

### For Debugging

1. Build via `yarn build`
1. Run via `yarn start:debug`


## Configuration

The Tandem app observes environment variables for configuration.

### Development

- `TANDEM_DEBUG_WINDOWS`: show WebRTC stats, GPU stats, etc.
- `TANDEM_DEVELOPER_TOOLS`: show Chrome developer tools in windows

### Logging

- `TANDEM_LOG_LEVEL`: sets logging level. Accepts `error`, `warn`, `info`, or `debug`.
- `TANDEM_PRINT_SENSITIVE_VALUES_IN_LOGS`: replaces highly sensitive (i.e. key codes on key events) into logs. This triggers key logger behaviour. **Use at your own risk!**
- `TANDEM_VERBOSE_CHROMIUM`: Turns on verbose logging out of the Chromium process within Electron.


## Architecture

### Concierge

The signalling server, written in Java 8 and Spring.

This is located under the `concierge` directory. [Read more here](concierge/README.md).
