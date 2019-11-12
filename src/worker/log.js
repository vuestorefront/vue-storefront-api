var winston = require('winston');

winston.emitErrs = true;

if (!global.logger) {
  global.logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: 'info',
        handleExceptions: false,
        json: false,
        prettyPrint: true,
        colorize: true,
        timestamp: true
      })
    ],
    exitOnError: false
  });
}

module.exports = global.logger;
