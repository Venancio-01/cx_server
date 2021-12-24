const { bindUDPServer } = require("./methods/UDP/index.js");
const { bindWebsocketServer } = require("./methods/Websocket.js");
const { bindKoaServer } = require("./methods/Koa/index.js");

const init = async () => {
  // 启动 UDP 服务并绑定端口、开启广播选项
  bindUDPServer();

  // 启动 Websocket 服务
  bindWebsocketServer();

  // 启动 Koa 服务
  bindKoaServer();

  console.log("init success!");
};

init();
