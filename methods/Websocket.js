/*
 * @Author: liqingshan
 * @Date: 2021-09-22 10:10:20
 * @LastEditTime: 2022-03-16 10:06:51
 * @LastEditors: liqingshan
 * @FilePath: \cx_server\methods\Websocket.js
 * @Description:
 */
const ws = require("nodejs-websocket");
const { WEBSOCKET_PORT } = require("../config/index.js");
const { sendUDPMessage } = require("./UDP/index.js");
const { json_stringify } = require("../tools/common");

const websocket = ws.createServer((connection) => {
  connection.on("text", (str) => {
    if (str == "broadcast topology") {
      sendUDPMessage({
        data: {
          type: "broadcast topology",
        },
      });
    } else if (str == "broadcast map") {
      sendUDPMessage({
        data: {
          type: "broadcast map",
        },
      });
    }
  });

  connection.on("close", (code, reason) => {
    console.log("Connection closed", code, reason);
  });

  connection.on("error", (error) => {
    console.log("Connection error", error);
  });
});

/**
 * @description: 绑定 websocket 服务
 * @param {*}
 * @return {*}
 */
const bindWebsocketServer = () => {
  websocket.listen(WEBSOCKET_PORT);
};

/**
 * @description: 发送 websocket 消息
 * @param {*}
 * @return {*}
 */
const senWebsocketMessage = (content) => {
  websocket.connections.forEach((connection) => {
    connection.sendText(json_stringify(content));
  });
};

module.exports = { bindWebsocketServer, senWebsocketMessage };
