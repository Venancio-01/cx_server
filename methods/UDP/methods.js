/*
 * @Author: liqingshan
 * @Date: 2021-12-23 10:19:19
 * @LastEditTime: 2021-12-23 15:45:30
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\methods\UDP\methods.js
 * @Description:
 */

const { senWebsocketMessage } = require("../Websocket.js");
const { sendUDPMessage } = require("./index");
const { getTopologyNodeInfo, getWatchNodes, getAdjacentNodes } = require("../../api/topology.js");
const { sendATCommand } = require("../../api/index.js");
const { getCurrentDevice } = require("../../api/device.js");
const generateCoordinates = require("../GPS.js");
const { IP: localIP } = require("../../config/index.js");
const { json_stringify } = require("../../tools/common");

let topologyContent = [];
let mapContent = [];
let timer = null;

/**
 * @description: 处理接收到拓扑图 UDP 广播
 * @param {*}
 * @return {*}
 */
const handleReceiveTopologyUDPmessages = ({ result = null, isWatchNode = false, deviceInfo = null }) => {
  console.log("type:topology");
  const response = {
    result,
    isWatchNode,
    deviceInfo,
  };
  topologyContent.push(response);
  const data = {
    type: "topology",
    content: topologyContent,
  };
  senWebsocketMessage(data);
};

/**
 * @description: 处理接收到地图的 UDP 广播
 * @param {*}
 * @return {*}
 */
const handleReceiveMapUDPmessages = ({ coordinate = null }) => {
  console.log("type:map");
  const response = {
    coordinate,
  };
  mapContent.push(json_stringify(response));
  const data = {
    type: "map",
    content: mapContent,
  };
  senWebsocketMessage(data);
};

/**
 * @description: 开始广播拓扑图的 UDP 消息
 * @param {*} senderIP 目标IP
 * @param {*} senderPort 目标
 * @return {*}
 */
const broadcastNodeInfo = async (senderIP, senderPort) => {
  // 如果接受到自己广播给自己的消息，清空消息队列
  if (senderIP == localIP) {
    topologyContent = [];
  }

  const nodes = await findCompleteTopologyNodeInfo();

  console.log(nodes, "nodes");

  const adjacentNodesInfoList = [];

  for (let i = 0; i < nodes.length; i++) {
    const item = nodes[i];
    const paramArr = item.split(",");
    const isLocal = paramArr[1] == "1";
    if (!isLocal) {
      const sn = paramArr[paramArr.length - 1].split("|")[0];
      adjacentNodesInfoList.push(await getAdjacentNodes(sn));
    }
  }

  const isWatch = await getWatchNodes();

  const processNodes = nodes.reduce((prev, node, index) => {
    if (index == 0) {
      prev.push(node);
    } else {
      const [, , , ...info] = adjacentNodesInfoList[index - 1].split(",");
      const item = `${node},${info.join(",")}`;

      prev.push(item);
    }

    return prev;
  }, []);

  // 设备信息
  const deviceInfo = await getLocalDeviceInfo();

  const data = {
    type: "receive topology",
    result: processNodes,
    isWatchNode: isWatch,
    deviceInfo,
  };
  sendUDPMessage({ port: senderPort, address: senderIP, data });
};

/**
 * @description: 开始广播地图的 UDP 消息
 * @param {*} senderIP
 * @param {*} senderPort
 * @return {*}
 */
const broadcastMapInfo = async (senderIP, senderPort) => {
  // 如果接受到自己广播给自己的消息，清空消息队列
  if (senderIP == localIP) {
    mapContent = [];
  }
  let coordinate = null;
  try {
    coordinate = await generateCoordinates();
  } catch (err) {}

  const data = {
    status: 10101,
    coordinate,
  };
  sendUDPMessage({ port: senderPort, address: senderIP, data });
};

/**
 * @description: 广播同步全局参数
 * @param {*}
 * @return {*}
 */
const broadcastSynchronizeParameter = (senderIP, params) => {
  if (senderIP == localIP) {
    clearInterval(timer);
    timer = setTimeout(async () => {
      setATCommand(params, true);
    }, 2000);
  } else {
    setATCommand(params);
  }
};

/**
 * @description: 找寻完整的拓扑图数据，通过递归 3005 命令的方式
 * @param {*}
 * @return {*}
 */
const findCompleteTopologyNodeInfo = () => {
  return new Promise(async (res, rej) => {
    const nodes = await getTopologyNodeInfo();
    const hasOk = nodes.some((item) => item == "OK");
    if (!hasOk) res(findCompleteTopologyNodeInfo());
    else {
      const processMsg = nodes.filter((item) => item !== "OK" && item.includes("DWEBUIRPT"));
      res(processMsg);
    }
  });
};

/**
 * @description: 获取本机设备信息
 * @param {*}
 * @return {*}
 */
const getLocalDeviceInfo = async () => {
  const deviceInfo = await getCurrentDevice();
  const [id, name] = deviceInfo.replace("^CURDEV:", "").split(",");
  return { id, name };
};

/**
 * @description: 设置
 * @param {*} params AT 命令参数
 * @param {*} isLocal 是否是来自本机的请求
 * @return {*}
 */
const setATCommand = async (params, isLocal = false) => {
  for (let i = 0; i < params.length; i++) {
    const result = await sendATCommand(`AT^DWEBUISET=${params[i]}`);
    const prefix = params[i].substring(0, 4);
    console.log(result, isLocal ? `${prefix} local result` : `${prefix} result`);
  }
};

module.exports = {
  handleReceiveTopologyUDPmessages,
  handleReceiveMapUDPmessages,
  broadcastNodeInfo,
  broadcastMapInfo,
  broadcastSynchronizeParameter,
};
