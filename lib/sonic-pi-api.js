'use babel';

const os               = require('os');
const process          = require('process');
const fs               = require('fs');
const path             = require('path');
const osc              = require('node-osc');

const SonicPiOSCServer = require('../osc/osc-server');
const proc_utils       = require('../utils/proc_utils.js');
// const logger        = require('../utils/logger.js');


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A class used to initiate, interface with, and shutdown the Sonic Pi server.
 */
class SonicPiAPI {

  /**
   * @typedef {Object} Result
   * @memberof SonicPiAPI
   * @property {boolean} success - Whether the operation was successful
   * @property {string} error_message - An error message if something went wrong - only present if `success` is false
   */

   /**
    * @typedef {Object} BootDaemonOutput
    * @memberof SonicPiAPI
    * @property {number} token - null if failed to get output
    * @property {Object[]} ports - null if failed to get output
    * @property {number} ports.daemon
    * @property {number} ports.gui_listen_to_spider
    * @property {number} ports.gui_send_to_spider
    * @property {number} ports.scsynth
    * @property {number} ports.tau_osc_cues
    * @property {number} ports.tau
    * @property {number} ports.phx_http
    */

  /**
   * Creates an instance of the `SonicPiAPI` Class
   * @constructor
   * @classdesc A class used to initiate, interface with, and shutdown the Sonic Pi server.
   */
  constructor() {
    this.running = false;
    this.use_udp = false;
    this.m_paths =  {
      RootPath: "", // Sonic Pi Application root
      RubyPath: "", // Path to ruby executable
      BootDaemonPath: "", // Path to the ruby server script

      SamplePath: "", // Path to the samples folder
      UserPath: "",
      ServerErrorLogPath: "",
      ServerOutputLogPath: "",
      ProcessLogPath: "",
      SCSynthLogPath: "",
      GUILogPath: ""
    }
    this.m_ports = {}
    this.m_guid = "";
    this.m_token = null;
    this.osc_server = null;
    this.osc_client = null;
  }

  /**
   * Destructor for the Sonic Pi API Class
   * @private
   */
  destructor() {
    this.shutdown();
  }

  /**
   * Shuts down the Sonic Pi server
   */
  shutdown() {
    // Ask the server to exit
    if (!this.m_bootDaemonProcess)
    {
      console.log("Server process is not running.");
    } else {
      // Ask the server to exit
      // This happens really fast, and the process is typically gone before we get to the sleep below.
      this.osc_client.send('/exit', this.m_token);

      // Reproc is having a hard time figuring out that the process has gone because
      // the ruby server is holding onto a socket and not cleaning it up.
      // We use a quick platform-independent check for exit instead, and just give it a second
      // for that check to succeed before doing reproc's wait/terminate/kill process which
      // will inevitably succeed too; just with a longer delay.
      // We should fix the ruby layer and remove these extra checks
      sleep(1000);

      // Quick check for it if it now gone
      if (this.m_bootDaemonProcess)
      {
        const _this = this;
        // OK, wait to stop it, terminate it, then till it.
        setTimeout(() => {
          _this.m_bootDaemonProcess.kill("SIGSTOP");
        }, 1000);
        setTimeout(() => {
          _this.m_bootDaemonProcess.kill("SIGTERM");
        }, 2000);
        setTimeout(() => {
          _this.m_bootDaemonProcess.kill("SIGKILL");
        }, 3000);
      }

      console.log("Server process gone");
    }

    // Stop the osc server and clients
    if (this.osc_server) {
      delete this.osc_server;
    }
    if (this.osc_client) {
      delete this.osc_client;
    }
    if (this.daemon_keep_alive) {
      clearInterval(this.daemon_keep_alive);
    }
    if (this.daemon_osc_client) {
      delete this.daemon_osc_client;
    }

    this.running = false;
  }

  /**
   * Set the main volume
   * @param {number} vol - A number from 0 to 100 indicating the volume
   * @param {number} [silent=0]
   * @throws {RangeError} Argument vol must be between 0 and 100 inclusive.
   */
  set_volume(vol, silent=0) {
    if (vol < 0 || vol > 100) {
        throw RangeError("Volume outside of valid range - `vol` must be between 0 and 100 inclusive");
    }

    console.log(`[GUI] - Changing volume to ${vol}%`);
    v = (vol / 100) * 2.0;
    this.osc_client.send('/mixer-amp', this.m_token, v, silent);
  }

  /**
   * Handle and log a startup error
   * @param {string} message - Error message
   * @private
   */
  startup_error(message) {
    var stack = new Error().stack;
    console.error(`Failed to start Sonic Pi server: ${message}\nStack trace: ${stack}`);
    self.shutdown();
    return {
      success: false,
      error_message: message
    };
  }

  /**
   * Start the boot daemon
   * @private
   * @returns {Promise<BootDaemonOutput>}
   */
  start_boot_daemon() {
    console.log("Launching Sonic Pi Boot Daemon:");
    const _this = this;

    var cmd = this.m_paths.RubyPath;
    var args = [];

    args.push(this.m_paths.BootDaemonPath);

    console.log("Args: " + args.join(", "));

    this.m_bootDaemonProcess = proc_utils.start_process(cmd, args);
    if (!this.m_bootDaemonProcess) {
      atom.notifications.addError("The Boot Daemon could not be started!");
      console.error("Failed to start Boot Daemon!");
      return false;
    }

    console.log("Attempting to read Boot Daemon output");
    return new Promise((resolve, reject) => {
      _this.m_bootDaemonProcess.stdout.once('data', (data) => {
        console.log(`Received chunk ${data}`);

        var list = data.toString().split(" ");

        var token = list.pop();
        var ports = list;

        // Redirect stdout and stderr
        out_pipe = fs.createWriteStream(this.m_paths.DaemonLogPath);
        _this.m_bootDaemonProcess.stdout.pipe(out_pipe);
        _this.m_bootDaemonProcess.stderr.pipe(out_pipe);
        console.log(`Token: ${token}`)
        console.log(`Ports: ${ports}`)
        if (ports.length == 7) {
          resolve({
            token: parseInt(token),
            ports: {
              daemon:               parseInt(ports[0]),
              gui_listen_to_spider: parseInt(ports[1]),
              gui_send_to_spider:   parseInt(ports[2]),
              scsynth:              parseInt(ports[3]),
              tau_osc_cues:         parseInt(ports[4]),
              tau:                  parseInt(ports[5]),
              phx_http:             parseInt(ports[6])
            }
          });
        } else {
          resolve({
            token: null,
            ports: null
          });
        }
      });
      _this.m_bootDaemonProcess.once('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Run code
   * @param {string} code - The code to run
   */
  run_code(code) {
    this.osc_client.send('/run-code', this.m_token, code);
  }

  /**
   * Stop all jobs
   */
  stop_all_jobs() {
    this.osc_client.send('/stop-all-jobs', this.m_token);
  }

  /**
   * Initialise the Sonic Pi server
   * @param {string} root - Root path of Sonic Pi
   * @async
   * @returns {Result} The result of the initialisation process
   */
  async init(root) {
    if (this.running) {
      return this.startup_error("Sonic Pi server is already running");
    }

    if (!fs.existsSync(path.normalize(root))) {
      return this.startup_error(`Could not find root path: ${root}`);
    }
    this.m_paths.RootPath = path.normalize(root);

    // Find ruby path
    if (process.platform == "win32") {
      this.m_paths.RubyPath = path.join(this.m_paths.RootPath, "app/server/native/ruby/bin/ruby.exe");
    } else {
      this.m_paths.RubyPath = path.join(this.m_paths.RootPath, "app/server/native/ruby/bin/ruby");
    }

    if (!fs.existsSync(this.m_paths.RubyPath)) {
      this.m_paths.RubyPath = "ruby";
    }

    // Check script paths
    this.m_paths.BootDaemonPath = path.join(this.m_paths.RootPath, "app/server/ruby/bin/daemon.rb");
    if (!fs.existsSync(this.m_paths.BootDaemonPath)) {
      return this.startup_error(`Could not find boot daemon script path: ${this.m_paths.BootDaemonPath}`);
    }

    // Samples
    this.m_paths.SamplePath = path.join(this.m_paths.RootPath, "etc/samples");

    // Sonic Pi home directory
    this.m_paths.UserPath = path.join(os.homedir(), ".sonic-pi");
    var logPath = path.join(this.m_paths.UserPath, "log");

    // Make the log folder and check we can write to it.
    // This is ~/.sonic-pi/log
    m_homeDirWriteable = true;
    try {
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath);
        fs.writeFileSync(path.join(logPath, ".writeTest"), "test");
        fs.unlinkSync(path.join(logPath, ".writeTest"));
      }
    } catch (err) {
      console.error(`Home directory not writable: ${err}`);
      m_homeDirWriteable = false;
    }

    // Our log paths
    this.m_paths.DaemonLogPath       = path.join(logPath, "daemon.log");
    this.m_paths.ServerErrorLogPath  = path.join(logPath, "server-errors.log");
    this.m_paths.ServerOutputLogPath = path.join(logPath, "server-output.log");
    this.m_paths.ProcessLogPath      = path.join(logPath, "processes.log");
    this.m_paths.SCSynthLogPath      = path.join(logPath, "scsynth.log");
    this.m_paths.GUILogPath          = path.join(logPath, "gui.log");

    // // Setup redirection of log from this app to our log file
    // // stdout into ~/.sonic-pi/log/gui.log
    // if (m_homeDirWriteable && (m_logOption == LogOption::File))
    // {
    //     m_coutbuf = std::cout.rdbuf();
    //     m_stdlog.open(m_paths.GUILogPath.string().c_str());
    //     std::cout.rdbuf(m_stdlog.rdbuf());
    // }

    console.log("Welcome to Sonic Pi");
    console.log("===================");

    var result = await this.start_boot_daemon();

    if (!result) {
      return this.startup_error("Failed to start boot baemon")
    }

    this.m_token = result.token;
    this.m_ports = result.ports

    console.log(`Token: ${this.m_token}`)
    console.log(`Ports: ${this.m_ports}`)
    if (this.m_token == null) {
      return this.startup_error(`Unable to get client token from boot daemon`);
    }

    this.daemon_osc_client = new osc.Client("127.0.0.1", this.m_ports.daemon);
    let _this = this;
    this.daemon_keep_alive = setInterval(() => {
      _this.daemon_osc_client.send("/daemon/keep-alive", _this.m_token);
    }, 4000);

    this.osc_client = new osc.Client("127.0.0.1", this.m_ports.gui_send_to_spider);
    this.osc_server = new SonicPiOSCServer("127.0.0.1", this.m_ports.gui_listen_to_spider, "127.0.0.1", this.m_ports.gui_send_to_spider);

    this.running = true;
    console.log("Init SonicPi Succeeded...");
    return {
      success: true,
    };

  }
}

module.exports = {
    SonicPiAPI
};
