const winston = require('winston')
const os      = require('os');
const path    = require('path');

const options = {
  file: {
    level: 'info',
    filename: path.join(os.homedir(), '/.atom/.sb_sonic_pi/logs/package.log'),
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false
})

module.exports = logger
