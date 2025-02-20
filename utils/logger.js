const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../logs/app.log");

// Ensure log directory exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

const Logger = {
  info: (message, data = {}) => {
    const log = `[INFO] ${new Date().toISOString()} - ${message} ${JSON.stringify(data)}\n`;
    fs.appendFileSync(logFilePath, log);
    console.log(log);
  },

  error: (message, error = {}) => {
    const log = `[ERROR] ${new Date().toISOString()} - ${message} ${JSON.stringify(error)}\n`;
    fs.appendFileSync(logFilePath, log);
    console.error(log);
  },
};

module.exports = Logger;
