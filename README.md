# sonic-pi-js-api
An experimental JavaScript API to interact with the Sonic Pi server.

## Features
Booting:
* [x] Boot and initialise the server
* [x] Shutdown the server

Basic commands:
* [x] Run code
* [x] Stop all jobs

Buffers/workspaces:
* [ ] Load workspaces - partially implemented
* [x] Save and play buffer
* [x] Save workspaces
* [x] Buffer new line and indent

Options:
* [x] Main volume
* [ ] Safe mode
* [x] External synths
* [ ] MIDI - partial
* [ ] Link

## Attributions
* Heavily based on on the [official C++ Sonic Pi API](https://github.com/sonic-pi-net/sonic-pi/tree/dev/app/api) (although not a fully exact copy)

### Dependencies
* [node-osc](https://github.com/MylesBorins/node-osc) - LGPL 3.0 or later
* [jsdoc](https://github.com/jsdoc/jsdoc) (development only) - Apache 2.0 License

## License
This package is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for the full license.
