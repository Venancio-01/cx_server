const axios = require("axios").default;
const { API_BASE } = require("../config/index.js");

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// 请求前置过滤器
instance.interceptors.request.use(
  (config) => {
    config.headers["Content-Type"] = "Content-Type: text/plain; charset=UTF-8";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应数据拦截并做通用处理
instance.interceptors.response.use(
  (response) => {
    let res = response.data;
    if (typeof response.data == "string") res = handleString2ObjectResponse(res);
    return res;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 将响应的字符串数据转化成 object 对象
const handleString2ObjectResponse = (data) => {
  const retcode = data.split("\n").reduce((acc, cur) => {
    const target = '"retcode":';
    if (cur.includes(target)) acc = cur[cur.indexOf(target) + target.length];
    return acc;
  }, "");

  const processedData = data.replace(/ /g, "").replace(/[\n\r]/g, "@");
  const parameterArr = processedData
    .match(/"msg":(\S*)}}/)[1]
    .split("@")
    .filter((item) => item.length > 0 && item.replace(/\\/g, ""));

  return {
    retcode,
    msg: parameterArr,
  };
};

/**
 * 封装发送AT指令的请求
 * @param url
 * @param data
 * @returns {Promise}
 */
const sendATCommand = (ATCommand) => {
  const data = {
    action: "sendcmd",
    AT: ATCommand,
  };

  return new Promise((resolve, reject) => {
    instance.post("atservice.fcgi", data).then(
      (response) => {
        resolve(response);
      },
      (err) => {
        reject(err);
      }
    );
  });
};

/**
 * 封装获取信息AT指令的请求
 * @param url
 * @param data
 * @returns {Promise}
 */
const getMessageATCommand = (ATCommand) => {
  const data = {
    action: "get_msg",
    AT: "",
  };

  return new Promise((resolve, reject) => {
    instance.post("atservice.fcgi", data).then(
      (response) => {
        resolve(response);
      },
      (err) => {
        reject(err);
      }
    );
  });
};

module.exports = {
  sendATCommand,
  getMessageATCommand,
};
