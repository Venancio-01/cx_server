/*
 * @Author: liqingshan
 * @Date: 2021-12-07 14:46:14
 * @LastEditTime: 2022-03-25 13:45:32
 * @LastEditors: liqingshan
 * @FilePath: \cx_server\tools\common.js
 * @Description:
 */

const json_parse = (data) => {
  let result = {};
  try {
    result = JSON.parse(data);
  } catch (e) {
    console.log(e, "parse error");
  }

  return result;
};

const json_stringify = (data) => {
  let result = "";
  try {
    result = JSON.stringify(data);
  } catch (e) {
    console.log(e, "stringify error");
  }

  return result;
};

const extractionResponseData = (data = "") => {
  const index = data.indexOf(":");
  const handleData = data.substring(index + 1, data.length);
  return handleData.split(",").map((item) => item.replace(/\"/g, ""));
};

module.exports = {
  json_parse,
  json_stringify,
  extractionResponseData,
};
