'use babel';

const osc = require('node-osc');
const {Emitter} = require('event-kit')

/**
 * A class used to receive messages from the Sonic Pi server.
 */
class SonicPiOSCServer {

  /**
   * Creates an instance of the `SonicPiOSCServer` Class
   * @constructor
   * @classdesc A class used to receive and acknowledge messages from the Sonic Pi server.
   * @param {string} ip - the IP address of this OSC server
   * @param {number} port - the port to listen on
   * @param {string} spider_ip - the IP address of the Sonic Pi server
   * @param {number} spider_port - the port to send acknowledgements to
   *
   */
  constructor(ip, port, spider_ip, spider_port) {
    let _this = this;

    this.m_port = port;
    this.m_ip = ip;
    this.emitter = new Emitter();
    this.osc_client = new osc.Client(spider_ip, spider_port);

    this.osc_server = new osc.Server(port, ip, () => {
      console.log(`OSC server is listening on ${ip}:${port}`);
    });

    this.osc_server.on('message', function (msg) {
      switch (msg[0]) {
        /**
         * Logging
         *
         * @event SonicPiOSCServer#log
         * @type {object}
         * @property {string} type - `info`, `error` or `multi_message`
         * @property {object} message_info - Varies depending on the type
         */
        case "/log/info":
          _this.emitter.emit('log', "info", msg.slice(1));
          break;
        case "/log/error":
          _this.emitter.emit('log', "error", msg.slice(1));
          break;
        case "/log/multi_message":
          _this.emitter.emit('log', "multi_message", msg.slice(1));
          break;

        // Boot errors
        case "/exited-with-boot-error":
          var info = {
            message: msg[1]
          };
          _this.emitter.emit("boot_error", info);
          break;


        /**
         * Runtime/syntax errors
         *
         * @event SonicPiOSCServer#error
         * @type {object}
         * @property {string} type - Either `runtime_error` or `syntax_error`
         * @property {number} job_id
         * @property {string} message
         * @property {number} line_number
         * @property {string} line_number_string - Syntax errors only
         * @property {string} line_string - Syntax errors only
         * @property {string} backtrace - Runtime errors only
         */
        case "/error":
          var error_info = {
            type: "runtime_error",
            job_id: parseInt(msg[1]),
            message: msg[2],
            backtrace: msg[3],
            line_number: parseInt(msg[4])
          }
          _this.emitter.emit("error", error_info);
          break;
        case "/syntax_error":
          var error_info = {
            type: "syntax_error",
            job_id: parseInt(msg[1]),
            message: msg[2],
            line_string: msg[3],
            line_number: parseInt(msg[4]),
            line_number_string: msg[5]
          }
          _this.emitter.emit("error", error_info);
          break;

        /**
         * Emitted when the Sonic Pi server exits.
         *
         * @event SonicPiOSCServer#exited
         */
        case "/exited":
          _this.emitter.emit('exited');

        /**
         * Emitted when the Sonic Pi server acknowledges a message.
         *
         * @event SonicPiOSCServer#ack
         * @type {object}
         * @property {object} id
         */
        case "/ack":
          var info = {
            id: msg[1]
          }
          _this.emitter.emit('ack', info);

        default:

      }
      console.log(`Message recieved: ${msg}`);
      _this.osc_client.send("/ack");
    })
  }

  destructor() {
    this.osc_server.close();
    this.emitter.dispose();
  }
}

module.exports = {
  SonicPiOSCServer
};
