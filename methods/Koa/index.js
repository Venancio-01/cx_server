const Koa = require("koa");
const cors = require("koa2-cors");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const { sendUDPMessage } = require("../UDP/index.js");
const { getSweepInfo, getSweepMessage } = require("../../api/sweep.js");
const { KOA_PORT } = require("../../config/index.js");
const { getHealthInfo, executeShellCommands, generateMapDir, deleteMapDir, getDevList } = require("./methods");

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
  sendUDPMessage({
    data: {
      type: "broadcast sync global",
      params,
    },
  });

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
  ctx.body = getHealthInfo();
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
    result = await executeShellCommands(command);
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
router.post("/handleUpload", (ctx) => {
  const data = ctx.request.body;
  const { city } = data;
  generateMapDir(city);
  ctx.body = "success";
});

/**
 * @description: 删除上传的地图文件夹
 * @param {*}
 * @return {*}
 */
router.post("/deleteMapDir", (ctx) => {
  const data = ctx.request.body;
  const { city } = data;
  deleteMapDir(city);
  ctx.body = "success";
});

/**
 * @description: 获取设备信息
 * @param {*}
 * @return {*}
 */
router.get("/getDevList", async (ctx) => {
  const result = await getDevList();
  ctx.body = {
    code: 0,
    data: result,
    message: "success",
  };
});

app.use(router.routes()); //作用：启动路由
app.use(router.allowedMethods());

/**
 * @description: 绑定 Koa 服务
 * @param {*}
 * @return {*}
 */
const bindKoaServer = () => {
  app.listen(KOA_PORT);
};

module.exports = { bindKoaServer };
