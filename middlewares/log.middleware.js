const fs = require("fs");
const path = require("path");

// Create or append to a log file
const logFilePath = path.join(__dirname, "../requests.log");

const formatDate = (date) => {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  const formattedDate = new Intl.DateTimeFormat("en-IN", options).format(date);

  // Extract hours, minutes, and seconds in IST
  const hoursIST = date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return { formattedDate, formattedTime: hoursIST };
};

const logRequest = (req, res, next) => {
  const now = new Date();
  const { formattedDate, formattedTime } = formatDate(now);

  const logEntry =
    `Date: ${formattedDate}\n` +
    `Time: ${formattedTime}\n` +
    `Endpoint: ${req.method} ${req.originalUrl}\n` +
    `User: ${req.user ? req.user.email : "Anonymous"}\n` +
    `IP: ${req.ip}\n` +
    `---------------------------------\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });

  next();
};

module.exports = { logRequest };
