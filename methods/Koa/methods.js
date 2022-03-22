/*
 * @Author: liqingshan
 * @Date: 2021-12-23 10:19:45
 * @LastEditTime: 2022-03-21 12:25:07
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\methods\Koa\methods.js
 * @Description:
 */
const shell = require("shelljs");
const fs = require("fs");
const { pinyin } = require("pinyin-pro");
const { sendATCommand } = require("../../api/index");
const { difference, uniqBy } = require("lodash");

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
  let oldPath = "";
  let newPath = "";

  if (process.env.NODE_ENV == "production") {
    oldPath = "D:\\Projects\\morningcore_webui\\public\\mapcache\\*";
    newPath = `D:\\Projects\\morningcore_webui\\public\\${py}`;
  } else {
    oldPath = "/data/lighttpd/www/htdocs/mapcache/*";
    newPath = `/data/lighttpd/www/htdocs/${py}`;
  }

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

  const path = process.env.NODE_ENV == "production" ? `D:\\Projects\\morningcore_webui\\public\\${py}` : `/data/lighttpd/www/htdocs/${py}`;

  // 如果存在，则删除
  if (fs.existsSync(path)) {
    shell.rm("-rf", path);
  }
};

/**
 * @description: 删除由 mapcache 复制的地图文件夹
 * @param {*}
 * @return {*}
 */
const compressMapDir = (city) => {
  const py = pinyin(city, { toneType: "none", type: "array" }).join("");
  const path = process.env.NODE_ENV == "production" ? `D:\\Projects\\morningcore_webui\\public\\${py}` : `/data/lighttpd/www/htdocs/${py}`;
  const targetPath = process.env.NODE_ENV == "production" ? `D:\\Projects\\morningcore_webui\\public\\${py}.tar` : `/data/lighttpd/www/htdocs/${py}.tar`;
  // 如果存在，则压缩
  if (fs.existsSync(path)) {
    shell.exec(`tar -cf ${targetPath} ${path}`);
  }
};

/**
 * @description: 清除日志目录下的日志文件
 * @param {*}
 * @return {*}
 */
const clearLogInfo = () => {
  const path = process.env.NODE_ENV == "production" ? `D:\\Projects\\morningcore_server\\logs` : `/data/local/log/udp_logs`;
  shell.rm("-rf", path);
};

// let deviceList = [];
// const getDevList = async () => {
//   const { msg, success, response } = await sendATCommand("AT^DEVLIST?");
//   if (success) {
//     if (msg[0] == 0) {
//       return [success, []];
//     } else {
//       const idList = msg.filter((item, index) => index > 0);
//       const oldIdList = deviceList.map((item) => item.id);

//       // 	// 检查是否有新增的设备
//       const addList = difference(idList, oldIdList);
//       // 	// 检查是否有移除的设备
//       const removeList = difference(oldIdList, idList);

//       if (addList.length > 0) {
//         for (let i = 0; i < addList.length; i++) {
//           const sn = addList[i];
//           const [success, result] = await getDevInfo(sn);
//           if (success) deviceList.push(result);
//         }
//       } else if (removeList.length > 0) {
//         deviceList = deviceList.filter((item) => !removeList.includes(item.id));
//       }

//       // 去重
//       deviceList = uniqBy(deviceList, "id");

//       return [success, deviceList];
//     }
//   } else {
//     return [success, response];
//   }
// };

const getDevList = async () => {
  const { msg, success, response } = await sendATCommand("AT^DEVLIST?");
  if (!success) return [success, response];

  if (msg[0] == 0) {
    return [success, []];
  } else {
    const idList = msg.filter((item, index) => index > 0);
    const deviceList = [];
    for (let i = 0; i < idList.length; i++) {
      const sn = idList[i];
      const [success, result] = await getDevInfo(sn);
      if (success) deviceList.push(result);
    }
    return [success, deviceList];
  }
};

const getDevInfo = async (id) => {
  const { msg, success } = await sendATCommand(`AT^GETDEV=${id}`);
  let data = null;
  if (success) {
    const deviceId = msg[0] || "";
    const name = msg[1] || "";
    const ip = msg[2] || "";
    data = {
      name: `${name}:${deviceId}`,
      ip,
      id,
    };
  }

  return [success, data];
};

const getModeChangeStatus = () => {
  const result = shell.exec("getprop sys.lc.setting");
  const { stdout, stderr, code } = result;
  return [true, stdout];
};

const getWifiChangeStatus = () => {
  const result = shell.exec("getprop system.boot.wifi.mode");
  const { stdout, stderr, code } = result;
  return [true, stdout];
};

const moveOTAFile = (fileName) => {
  const command = `mv /data/lighttpd/www/htdocs/${fileName} /data/ota/`;
  const result = shell.exec(command);
  const { stdout } = result;
  return [true, stdout];
};

module.exports = {
  getHealthInfo,
  executeShellCommands,
  generateMapDir,
  deleteMapDir,
  compressMapDir,
  getDevList,
  clearLogInfo,
  getModeChangeStatus,
  getWifiChangeStatus,
  moveOTAFile,
};
