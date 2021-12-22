const { sendATCommand } = require("./index.js");

// 获取普通节点信息
const getNodes = async () => {
  const result = await sendATCommand("AT^DWEBUIRPT=3005");
  const { msg } = result;
  return msg;
};

// 获取相邻节点信息
const getAdjacentNodes = async (sn) => {
  const result = await sendATCommand(`AT^DWEBUIRPT=3006,${sn}`);
  const { msg } = result;
  return msg[0];
};

// 获取监听节点信息
const getWatchNodes = async () => {
  const result = await sendATCommand("AT^DWEBUISET=2008");
  const { msg } = result;
  const isWatch = msg[0].split(",")[1] == 1;
  return isWatch;
};

module.exports = {
  getNodes,
  getWatchNodes,
  getAdjacentNodes,
};
