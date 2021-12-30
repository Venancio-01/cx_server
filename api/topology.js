/*
 * @Author: liqingshan
 * @Date: 2021-09-22 14:08:28
 * @LastEditTime: 2021-12-28 17:54:41
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\api\topology.js
 * @Description:
 */
const { sendATCommand } = require("./index.js");

// 获取普通节点信息
const getTopologyNodeInfo = async () => {
  const result = await sendATCommand("AT^DWEBUIRPT=3005", true);
  return result;
};

// 获取相邻节点信息
const getAdjacentNodes = async (sn) => {
  const result = await sendATCommand(`AT^DWEBUIRPT=3006,${sn}`, true);
  const { msg } = result;
  return msg[0];
};

// 获取监听节点信息
const getWatchNodes = async () => {
  const result = await sendATCommand("AT^DWEBUISET=2008");
  const { msg } = result;
  const isWatch = msg[0] == 1;
  return isWatch;
};

module.exports = {
  getTopologyNodeInfo,
  getWatchNodes,
  getAdjacentNodes,
};
