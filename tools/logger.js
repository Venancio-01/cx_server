/*
 * @Author: liqingshan
 * @Date: 2021-12-27 09:51:57
 * @LastEditTime: 2022-03-31 10:28:09
 * @LastEditors: liqingshan
 * @FilePath: \cx_server\tools\logger.js
 * @Description:
 */

const { createLogger, format, transports } = require("winston");

const log_file_path = process.env.NODE_ENV == "production" ? "logs/server.log" : "/data/local/log/udp_logs/server.log";

module.exports = createLogger({
  transports: [
    new transports.File({
      filename: log_file_path,
      level: "info",
      format: format.combine(
        format.timestamp({ format: "MMMM-DD-YYYY HH:mm:ss" }),
        format.align(),
        format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`)
      ),
      maxSize: "20m",
      maxFiles: "2d",
    }),
  ],
});
