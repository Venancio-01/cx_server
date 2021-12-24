/*
 * @Author: liqingshan
 * @Date: 2021-09-22 10:08:48
 * @LastEditTime: 2021-12-23 14:24:28
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\methods\UDP\index.js
 * @Description:
 */
const dgram = require("dgram");
const { json_parse } = require("../../tools/common");
const { UDP_PORT, UDP_ADDRESS } = require("../../config/index");

const udp_client = dgram.createSocket("udp4");

/**
 * @description: UDP 发送消息
 * @param {port} 发送的端口，默认为本机端口
 * @param {address} 发送的地址，默认为本机地址
 * @param {data} 发送的数据
 * @return {*}
 */
const sendUDPMessage = ({ port = UDP_PORT, address = UDP_ADDRESS, data }) => {
  const stringifyData = JSON.stringify(data);
  udp_client.send(stringifyData, 0, stringifyData.length, port, address, (err) => {
    console.log(err, "UDP Message Send Error");
  });
};

/**
 * @description: 绑定 UDP 服务
 * @param {*}
 * @return {*}
 */
const bindUDPServer = () => {
  udp_client.bind(UDP_PORT, () => {
    udp_client.setBroadcast(true);
  });
};

module.exports = { bindUDPServer, sendUDPMessage };

// 关闭处理
udp_client.on("close", () => {
  console.log("udp client closed.");
});

//错误处理
udp_client.on("error", () => {
  console.log("some error on udp client.");
});

const { handleReceiveTopologyUDPmessages, handleReceiveMapUDPmessages, broadcastNodeInfo, broadcastMapInfo, broadcastSynchronizeParameter } = require("./methods");
// 接收消息
udp_client.on("message", async (msg, rinfo) => {
  const data = json_parse(msg.toString());
  const { port: senderPort, address: senderIP } = rinfo;
  const { type, params = [] } = data;

  console.log(senderIP, "sender IP");

  // 广播获取到的拓扑图节点信息
  if (type === "broadcast topology") {
    await broadcastNodeInfo(senderIP, senderPort);
  }
  // 广播同步全局参数
  else if (type === "broadcast sync global") {
    broadcastSynchronizeParameter(senderIP, params);
  }
  // 广播获取到的地图坐标
  else if (type === "broadcast map") {
    broadcastMapInfo(senderIP, senderPort);
  }
  // 接收到拓扑图节点坐标，通过 websocket 发给页面
  else if (type === "receive topology") {
    handleReceiveTopologyUDPmessages(data);
  }
  // 接收到地图坐标，通过 websocket 发给页面
  else if (type === "receive map") {
    handleReceiveMapUDPmessages(data);
  }
});