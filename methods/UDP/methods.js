const { sendWebsocketMessage } = require("../Websocket.js");
const { sendUDPMessage } = require("./index");
const { getTopologyNodeInfo, getWatchNodes, getAdjacentNodes, getPower } = require("../../api/topology.js");
const { sendATCommand } = require("../../api/index.js");
const { getCurrentDevice } = require("../../api/device.js");
const generateCoordinates = require("../GPS.js");
const { IP: localIP } = require("../../config/index.js");
const { json_stringify } = require("../../tools/common");
const { uniqBy, debounce } = require("lodash");
const logger = require("../../tools/logger");
const { formatTime } = require("../../tools/time");

let topologyContent = [];
let mapContent = [];
let timer = null;
let now = null;

/**
 * @description: 处理接收到拓扑图 UDP 广播
 * @param {*}
 * @return {*}
 */
const handleReceiveTopologyUDPmessages = ({ result = null, isWatchNode = false, deviceInfo = null, power = "" }) => {
  const parseDeviceInfo = {
    ...deviceInfo,
    power,
    name: deviceInfo.name ? decodeURIComponent(deviceInfo.name) : "",
  };
  const time = new Date().getTime() - now;
  const response = {
    result,
    isWatchNode,
    deviceInfo: parseDeviceInfo,
    time,
  };
  const index = topologyContent.findIndex((item) => item.deviceInfo.id === parseDeviceInfo.id);
  if (index === -1) {
    topologyContent.push(response);
  } else {
    topologyContent.splice(index, 1, response);
  }
  const data = {
    type: "topology",
    content: topologyContent,
  };

  sendWebsocketMessage(data);
};

/**
 * @description: 处理接收到地图的 UDP 广播
 * @param {*}
 * @return {*}
 */
const handleReceiveMapUDPmessages = ({ coordinate = null }) => {
  const response = {
    coordinate,
  };
  mapContent.push(json_stringify(response));
  const data = {
    type: "map",
    content: mapContent,
  };
  sendWebsocketMessage(data);
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
    now = new Date().getTime();
  }

  // 查询是否监听节点
  const isWatch = await getWatchNodes();

  // 查询本机设备信息
  const deviceInfo = await getLocalDeviceInfo();

  // 查询功率
  const power = await getPower();

  // 查询 3005 拓扑图节点数据
  const nodes = await findCompleteTopologyNodeInfo(isWatch);

  console.log(nodes, "nodes");

  let processNodes = nodes;
  if (!isWatch) {
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

    processNodes = nodes.reduce((prev, node, index) => {
      if (index == 0) {
        prev.push(node);
      } else {
        const [, , , ...info] = adjacentNodesInfoList[index - 1].split(",");
        const item = `${node},${info.join(",")}`;

        prev.push(item);
      }

      return prev;
    }, []);
  }

  const data = {
    type: "receive topology",
    result: processNodes,
    isWatchNode: isWatch,
    deviceInfo,
    power,
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
    type: "receive map",
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
  // if (senderIP == localIP) {
  //   clearInterval(timer);
  //   timer = setTimeout(async () => {
  //     setATCommand(params, true);
  //   }, 2000);
  // } else {
  //   setATCommand(params);
  // }
  console.log(params, "params");
  if (senderIP === localIP) return;
  setATCommand(params);
};

/**
 * @description: 找寻完整的拓扑图数据，通过递归 3005 命令的方式
 * @param {*}
 * @return {*}
 */

// let topology_timer = null;
let topologyData = []; // 保存下拓扑图数据
let isWatch_timer = null;
let inListenState = false; // 是否处在监听状态

// 不轮询版本
// const findCompleteTopologyNodeInfo = (isWatch) => {
//   // clearTimeout(topology_timer);
//   return new Promise(async (res, rej) => {
//     if (isWatch) {
//       if (inListenState) return res(topologyData);

//       const response = await getTopologyNodeInfo();
//       const { msg, success } = response;
//       if (success) {
//         const TEN_MINS = 1000 * 60 * 10;
//         topologyData = msg.filter((item) => item !== "OK" && item.includes("DWEBUIRPT"));
//         inListenState = true;
//         isWatch_timer = setTimeout(() => {
//           inListenState = false;
//           clearInterval(isWatch_timer);
//         }, TEN_MINS);
//       }
//       res(topologyData);
//     } else {
//       inListenState = false;
//       const response = await getTopologyNodeInfo();
//       const { msg, success } = response;
//       if (success) {
//         if (global.loggerSwitch) logger.info(json_stringify(response));
//         const processMsg = msg.filter((item) => item !== "OK" && item.includes("DWEBUIRPT"));
//         res(processMsg);
//       } else {
//         res(topologyData);
//       }
//     }
//   });
// };

// 轮询版本
const findCompleteTopologyNodeInfo = (isWatch) => {
  // clearTimeout(topology_timer);
  return new Promise(async (res, rej) => {
    if (isWatch) {
      if (inListenState) return res(topologyData);

      const response = await getTopologyNodeInfo();
      const { msg, success } = response;
      if (success) {
        const TEN_MINS = 1000 * 60 * 10;
        topologyData = msg.filter((item) => item !== "OK" && item.includes("DWEBUIRPT"));
        inListenState = true;
        isWatch_timer = setTimeout(() => {
          inListenState = false;
          clearInterval(isWatch_timer);
        }, TEN_MINS);
      }
      res(topologyData);
    } else {
      // clearTimeout(topology_timer);
      inListenState = false;
      const response = await getTopologyNodeInfo();
      const { msg, success } = response;
      console.log(msg, "3005 msg");
      if (success) {
        const hasOK = msg.length > 1 && msg[msg.length - 1] == "OK" && msg.some((item) => item.includes("^DWEBUIRPT:3005,1"));
        if (!hasOK) {
          res(findCompleteTopologyNodeInfo(isWatch));
        } else {
          if (global.loggerSwitch) logger.info(json_stringify(response));
          const processMsg = msg.filter((item) => item !== "OK" && item.includes("DWEBUIRPT"));
          res(processMsg);
        }
      } else {
        res(topologyData);
      }
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
  const [id, name] = deviceInfo;
  return { id, name: name ? encodeURIComponent(name) : "" };
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
