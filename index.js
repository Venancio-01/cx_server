/*
 * @Author: liqingshan
 * @Date: 2021-09-22 10:08:19
 * @LastEditTime: 2021-12-22 14:23:35
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\index.js
 * @Description:
 */
const udp_client = require("./methods/UDP.js");
const io = require("./methods/Websocket.js");
const Koa = require("./methods/Koa.js");
const { UDP_PORT, WEBSOCKET_PORT, KOA_PORT } = require("./config/index.js");

const init = async () => {
  // 启动 UDP 服务并绑定端口、开启广播选项
  udp_client.bind(UDP_PORT, () => {
    udp_client.setBroadcast(true);
  });

  // 启动 Websocket 服务
  Websocket.listen(WEBSOCKET_PORT);

  // 启动 Koa 服务
  Koa.listen(KOA_PORT);
  console.log("init success!");
};

init();
