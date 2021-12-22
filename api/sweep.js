const { sendATCommand, getMessageATCommand } = require("./index.js");

const getSweepInfo = (command) => {
  return sendATCommand(`AT^DWEBUIRPT=3001,${command}`);
};

//  获取扫频节点数据
const getSweepMessage = () => {
  return getMessageATCommand();
};

module.exports = {
  getSweepInfo,
  getSweepMessage,
};
