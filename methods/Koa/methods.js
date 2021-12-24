/*
 * @Author: liqingshan
 * @Date: 2021-12-23 10:19:45
 * @LastEditTime: 2021-12-24 15:03:17
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\methods\Koa\methods.js
 * @Description:
 */
const shell = require("shelljs");
const fs = require("fs");
const { pinyin } = require("pinyin-pro");
const { sendATCommand } = require("../../api/index");
const { extractionResponseData } = require("../../tools/common");
const { difference } = require("lodash");

/**
 * @description: 获取设备的健康信息
 * @param {*}
 * @return {*}
 */
const getHealthInfo = () => {
  const fileContent = shell.cat("/sys/class/thermal/thermal_zone*/temp");
  const arr = fileContent.stdout.split("\n");
  const hostTemperature = arr[0] ? Number(arr[0] / 1000) : "";

  return {
    hostTemperature,
  };
};

/**
 * @description: 执行 shell 命令
 * @param {command} shell 语句
 * @return {*}
 */
const executeShellCommands = (command) => {
  return new Promise((resolve, reject) => {
    const result = shell.exec(command);
    const { stdout, stderr, code } = result;

    if (code == 0) {
      resolve(stdout);
    } else {
      reject(stderr);
    }
  });
};

/**
 * @description: 根据汉字创建对应汉字全拼的文件夹，并复制 mapcache 到新创建的文件夹中去
 * @param {city}
 * @return {*}
 */
const generateMapDir = (city) => {
  const py = pinyin(city, { toneType: "none", type: "array" }).join("");
  const oldPath = "/data/lighttpd/www/htdocs/mapcache/*";
  const newPath = `/data/lighttpd/www/htdocs/${py}`;

  //   const oldPath = "D:\\Projects\\morningcore_webui\\public\\mapcache\\*";
  //   const newPath = `D:\\Projects\\morningcore_webui\\public\\${py}`;

  // 如果不存在，则新建文件夹
  if (!fs.existsSync(newPath)) {
    shell.mkdir("-p", newPath);
  }

  shell.cp("-r", oldPath, newPath);
};

/**
 * @description: 删除由 mapcache 复制的地图文件夹
 * @param {*}
 * @return {*}
 */
const deleteMapDir = (city) => {
  const py = pinyin(city, { toneType: "none", type: "array" }).join("");

  //   const path = `D:\\Projects\\morningcore_webui\\public\\${py}`;
  const path = `/data/lighttpd/www/htdocs/${py}`;

  // 如果存在，则删除
  if (fs.existsSync(path)) {
    shell.rm("-rf", path);
  }
};

const getDevList = async () => {
  const deviceList = [];
  const result = await sendATCommand("AT^DEVLIST?");
  const arr = extractionResponseData(result.msg[0]);
  const idList = arr.filter((item, index) => index > 0);

  for (let i = 0; i < idList.length; i++) {
    const sn = idList[i];
    const [success, result] = await getDevInfo(sn);
    if (success) deviceList.push(result);
  }

  return deviceList;
};

const getDevInfo = async (id) => {
  const result = await sendATCommand(`AT^GETDEV=${id}`);
  const success = result.msg[0].includes("^GETDEV");
  let data = null;
  if (success) {
    const arr = extractionResponseData(result.msg[0]);
    const deviceId = arr[0] || "";
    const name = arr[1] ? decodeURI(arr[1]) : "";
    const ip = arr[2] || "";
    data = {
      name: `${name}:${deviceId}`,
      ip,
      id,
    };
  }

  return [success, data];
};

module.exports = {
  getHealthInfo,
  executeShellCommands,
  generateMapDir,
  deleteMapDir,
  getDevList,
};
