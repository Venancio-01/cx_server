const Koa = require("koa");
const cors = require("koa2-cors");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const shell = require("shelljs");
const { UDP_PORT, UDP_ADDRESS } = require("../config/index.js");
const udp_client = require("./UDP.js");
const { getSweepInfo, getSweepMessage } = require("../api/sweep.js");
const fs = require("fs");
const { pinyin } = require("pinyin-pro");

const app = new Koa();
const router = new Router();
app.use(bodyParser());
app.use(
  cors({
    origin: function (ctx) {
      return "*"; // 允许来自所有域名请求
    },
  })
);

/**
 * @description: 同步全局参数
 * @param {*}
 * @return {*}
 */
router.post("/handleSyncGlobalParams", (ctx) => {
  const data = ctx.request.body;
  const { params } = data;

  console.log(params, "params");
  handleUDPSend(params);
  ctx.body = "success";
});

/**
 * @description: 上报扫频信息
 * @param {*}
 * @return {*}
 */
router.post("/reportSweepInfo", async (ctx) => {
  const data = ctx.request.body;
  const { command } = data;
  await getSweepInfo(command);
  ctx.body = "success";
});

/**
 * @description: 获取 msg 队列数据
 * @param {*}
 * @return {*}
 */
router.get("/getMessage", async (ctx) => {
  const result = await getSweepMessage();
  ctx.body = result;
});

/**
 * @description: 获取设备健康信息
 * @param {*}
 * @return {*}
 */
router.get("/getHealthInfo", (ctx) => {
  ctx.body = handleGetHealthInfo();
});

/**
 * @description: 执行 shell 命令
 * @param {*}
 * @return {*}
 */
router.post("/sendShellCommand", async (ctx) => {
  const data = ctx.request.body;
  const { command } = data;
  let result = "";
  try {
    result = await handleShellCommand(command);
  } catch (e) {
    result = e;
  }
  ctx.body = result;
});

/**
 * @description: 上传区域地图
 * @param {*}
 * @return {*}
 */
router.post("/sendShellCommand", (ctx) => {
  const data = ctx.request.body;
  const { city } = data;
  console.log(city, "city");
  generateMapDir(city);
  ctx.body = "success";
});

app.use(router.routes()); //作用：启动路由
app.use(router.allowedMethods());
// app.use(async (ctx) => {
//   // 同步全局参数
//   if (ctx.url == "/handleSyncGlobalParams" && ctx.method === "POST") {
//     const data = ctx.request.body;
//     const { params } = data;

//     console.log(params, "params");
//     handleUDPSend(params);
//     ctx.body = "success";
//   } else if (ctx.url == "/reportSweepInfo" && ctx.method === "POST") {
//     const data = ctx.request.body;
//     const { command } = data;
//     await getSweepInfo(command);
//     ctx.body = "success";
//   } else if (ctx.url == "/getMessage" && ctx.method === "GET") {
//     const result = await getSweepMessage();
//     ctx.body = result;
//   } else if (ctx.url == "/getHealthInfo" && ctx.method === "GET") {
//     ctx.body = handleGetHealthInfo();
//   } else if (ctx.url == "/sendShellCommand" && ctx.method === "POST") {
//     const data = ctx.request.body;
//     const { command } = data;
//     let result = "";
//     try {
//       result = await handleShellCommand(command);
//     } catch (e) {
//       result = e;
//     }
//     ctx.body = result;
//   } else if (ctx.url == "/handleUpload" && ctx.method === "POST") {
//     const data = ctx.request.body;
//     const { city } = data;
//     console.log(city, "city");
//     generateMapDir(city);
//     ctx.body = "success";
//   }
// });

/**
 * @description: 根据汉字创建对应汉字全拼的文件夹，并复制 mapcache 到新创建的文件夹中去
 * @param {city}
 * @return {*}
 */
const generateMapDir = (city) => {
  const py = pinyin(city, { toneType: "none", type: "array" }).join("");
  const oldPath = "/data/lighttpd/www/htdocs/mapcache/*";
  const newPath = `/data/lighttpd/www/htdocs/${py}`;

  // 如果不存在，则新建文件夹
  if (!fs.existsSync(newPath)) {
    shell.mkdir("-p", newPath);
  }

  shell.cp("-r", oldPath, newPath);
};

/**
 * @description: 执行 shell 命令
 * @param {command} shell 语句
 * @return {*}
 */
const handleShellCommand = (command) => {
  return new Promise((resolve, reject) => {
    const result = shell.exec(command);
    const { stdout, stderr, code } = result;

    if (code == 0) {
      resolve(stdout);
    } else {
      reject(stderr);
    }
    console.log(result, "result");
  });
};

// 发送 UDP 命令
const handleUDPSend = (params) => {
  const data = {
    status: 102,
    params,
  };
  const handleData = JSON.stringify(data);
  udp_client.send(handleData, 0, handleData.length, UDP_PORT, UDP_ADDRESS, (err) => {
    console.log(err, "UDP error");
  });
};

/**
 * @description: 获取设备的健康信息
 * @param {*}
 * @return {*}
 */
const handleGetHealthInfo = () => {
  const fileContent = shell.cat("/sys/class/thermal/thermal_zone*/temp");
  const arr = fileContent.stdout.split("\n");
  const hostTemperature = arr[0] ? Number(arr[0] / 1000) : "";

  return {
    hostTemperature,
  };
};

module.exports = app;
