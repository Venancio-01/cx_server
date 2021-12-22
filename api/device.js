const { sendATCommand } = require("./index.js");

//  获取当前节点电台ID、名称
const getCurrentDevice = async () => {
  const result = await sendATCommand("AT^CURDEV?");
  const { msg } = result;
  return msg[0];
};

module.exports = {
  getCurrentDevice,
};
