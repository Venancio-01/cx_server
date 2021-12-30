const axios = require("axios").default;
const { API_BASE } = require("../config/index.js");
const { json_stringify } = require("../tools/common");
const logger = require("../tools/logger");

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
    const needRawData = response.config.headers.needRawData;
    let res = response.data;
    if (typeof res == "string") res = parseStringTypeResponse(res, needRawData);
    else if (typeof res == "object") res = parseObjectTypeResponse(res);
    // if (global.loggerSwitch) logger.info(json_stringify(res));
    // console.log(res, "res");
    return res;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 将 response data 处理成数组形式
const extractionResponseData = (msg) => {
  const data = Array.isArray(msg) ? msg[0] : "";
  const index = data.indexOf(":");
  const handleData = data.substring(index + 1, data.length);
  return handleData.split(",").map((item) => item.replace(/\"/g, ""));
};

const hasResponseErr = (data = "") => {
  const list = ["+CMEERROR", "+CME ERROR"];
  return list.some((item) => data.includes(item));
};

// 将响应的字符串数据转化成 object 对象
const parseStringTypeResponse = (response, needRawData) => {
  const retcode = response.split("\n").reduce((acc, cur) => {
    const target = '"retcode":';
    if (cur.includes(target)) acc = cur[cur.indexOf(target) + target.length];
    return acc;
  }, "");

  const processedData = response.replace(/ /g, "").replace(/[\n\r]/g, "@");
  const parameterArr = processedData
    .match(/"msg":(\S*)}}/)[1]
    .split("@")
    .filter((item) => item.length > 0 && item.replace(/\\/g, ""));

  const success = !hasResponseErr(parameterArr[0]);
  const hasOK = processedData.includes("OK");

  return {
    retcode,
    msg: success ? (needRawData ? parameterArr : extractionResponseData(parameterArr)) : parameterArr,
    success,
    hasOK,
  };
};

const parseObjectTypeResponse = (response) => {
  let success = true;
  if (response.response.error) {
    success = false;
  }

  return {
    ...response,
    success,
  };
};

/**
 * 封装发送AT指令的请求
 * @param url
 * @param data
 * @returns {Promise}
 */
const sendATCommand = (ATCommand, needRawData = false) => {
  const data = {
    action: "sendcmd",
    AT: ATCommand,
  };
  const config = needRawData
    ? {
        headers: { needRawData: true },
      }
    : {};
  return new Promise((resolve, reject) => {
    instance.post("atservice.fcgi", data, config).then(
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
