/*
 * @Author: liqingshan
 * @Date: 2021-10-29 16:00:34
 * @LastEditTime: 2022-03-31 10:09:32
 * @LastEditors: liqingshan
 * @FilePath: \cx_server\api\device.js
 * @Description:
 */
const { sendATCommand } = require("./index.js");

//  获取当前节点电台ID、名称
const getCurrentDevice = async () => {
  const { msg } = await sendATCommand("AT^CURDEV?");
  console.log(msg, "getCurrentDevice");
  return msg;
};

module.exports = {
  getCurrentDevice,
};
