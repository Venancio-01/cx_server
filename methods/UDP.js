const dgram = require("dgram");
const { getNodes, getWatchNodes, getAdjacentNodes } = require("../api/topology.js");
const { IP: localIP } = require("../config/index.js");
const { sendATCommand } = require("../api/index.js");
const { getCurrentDevice } = require("../api/device.js");
const generateCoordinates = require("./GPS.js");
const { json_parse, json_stringify } = require("../tools/common");

let topologyContent = [];
let mapContent = [];
let timer = null;

const udp_client = dgram.createSocket("udp4");
module.exports = udp_client;
const websocket = require("./Websocket.js");

udp_client.on("close", () => {
  console.log("udp client closed.");
});

//错误处理
udp_client.on("error", () => {
  console.log("some error on udp client.");
});

// 接收消息
udp_client.on("message", async (msg, rinfo) => {
  const data = json_parse(msg.toString());
  const { port: senderPort, address: senderIP } = rinfo;
  const { status, result = null, isWatchNode = false, params = [], deviceInfo = null, coordinate = null } = data;

  console.log(senderPort, "sender port");
  console.log(senderIP, "sender IP");

  // 广播获取到的节点信息
  if (status == 101) {
    console.log("status:101");
    await broadcastNodeInfo(senderIP, senderPort);
  }
  // 广播同步全局参数
  else if (status == 102) {
    console.log("status:102");
    broadcastSynchronizeParameter(senderIP, params);
  }
  // 广播地图坐标
  else if (status == 103) {
    console.log("status:103");
    broadcastMapInfo(senderIP, senderPort);
  }
  // 接收到 UDP 广播后通过 Websocket 将数据发送给页面
  else if (status == 10100) {
    console.log("status:10100");
    const response = {
      result,
      isWatchNode,
      deviceInfo,
    };
    topologyContent.push(json_stringify(response));
    sendDataToPageViaWebSocket(topologyContent, "topology");
  } else if (status == 10101) {
    console.log("status:10101");
    const response = {
      coordinate,
    };
    mapContent.push(json_stringify(response));
    sendDataToPageViaWebSocket(mapContent, "map");
  }
});

const getDeviceInfo = async () => {
  const deviceInfo = await getCurrentDevice();
  const [id, name] = deviceInfo.replace("^CURDEV:", "").split(",");
  return { id, name };
};

const broadcastNodeInfo = async (senderIP, senderPort) => {
  // 如果接受到自己广播给自己的消息，清空消息队列
  if (senderIP == localIP) {
    topologyContent = [];
  }

  const nodes = await judgeSuccessGetNodes();

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

  const deviceInfo = await getDeviceInfo();
  const data = {
    status: 10100,
    result: processNodes,
    isWatchNode: isWatch,
    deviceInfo,
  };
  const processData = json_stringify(data);
  console.log(processData, "processData");
  udp_client.send(processData, 0, processData.length, senderPort, senderIP);
};

const broadcastMapInfo = async (senderIP, senderPort) => {
  // 如果接受到自己广播给自己的消息，清空消息队列
  if (senderIP == localIP) {
    mapContent = [];
  }
  let coordinate = null;
  try {
    coordinate = await generateCoordinates();
  } catch (err) {
    console.log(err);
  }

  const data = {
    status: 10101,
    coordinate,
  };
  const processData = json_stringify(data);
  console.log(processData, "processData2");
  udp_client.send(processData, 0, processData.length, senderPort, senderIP);
};

// 筛选出成功获取成功的节点信息
const judgeSuccessGetNodes = () => {
  return new Promise(async (res, rej) => {
    const nodes = await getNodes();
    const hasOk = nodes.some((item) => item == "OK");
    if (!hasOk) res(judgeSuccessGetNodes());
    else {
      const processMsg = nodes.filter((item) => item !== "OK");
      res(processMsg);
    }
  });
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
 * @description:
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

/**
 * @description: 通过 websocket 把数据发送到 webui
 * @param {*}
 * @return {*}
 */
const sendDataToPageViaWebSocket = (content, path) => {
  const connections = websocket.connections.find((item) => item.path.includes(path));
  connections.sendText(json_stringify(content));
};
