# sonic-pi-js-api
An experimental JavaScript API to start and interact with the Sonic Pi server. Compatible with Sonic Pi v4.x.

[![npm (scoped)](https://img.shields.io/npm/v/@sunderb/sonic-pi-js-api)](https://www.npmjs.com/package/@sunderb/sonic-pi-js-api)


## 📖 Documentation
Documentation is available online at https://sunderb.me/sonic-pi-js-api/latest/


## ✨ Features
| Feature | Implemented? |
| --- | --- |
| **Booting** | |
| Boot and initialise the server    | ✅ Yes | 
| Shutdown the server               | ✅ Yes | 
| **Basic commands** |  |
| Run code                          | ✅ Yes | 
| Stop all jobs                     | ✅ Yes |
| **Buffers/workspaces** | | 
| Load workspaces                   | 🚧 Partial |
| Save workspaces                   | ✅ Yes (untested) | 
| Save and play buffer              | ✅ Yes (untested) | 
| Buffer new line and indent        | ✅ Yes (untested) |
| **Recordings** | |
| Start recording                   | ❌ No |
| Stop recording                    | ❌ No |
| **Logging** | |
| Handle and emit log messages      | ✅ Yes | 
| Handle and emit errors            | 🚧 Partial |
| **Options & IO** | |
| Main volume                       | ✅ Yes |
| Safe mode                         | ❌ No |
| External synths                   | ✅ Yes |
| MIDI options                      | 🚧 Partial |
| Link                              | ❌ No |

## Attributions
* Heavily based on on the [official C++ Sonic Pi API](https://github.com/sonic-pi-net/sonic-pi/tree/dev/app/api) (although not a fully exact copy) - MIT License

### Dependencies
* [node-osc](https://github.com/MylesBorins/node-osc) - LGPL 3.0 or later
* [jsdoc](https://github.com/jsdoc/jsdoc) (development only) - Apache 2.0 License

## License
This package is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for the full license.
