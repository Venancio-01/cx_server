/*
 * @Author: liqingshan
 * @Date: 2021-12-07 14:46:14
 * @LastEditTime: 2021-12-07 14:49:16
 * @LastEditors: liqingshan
 * @FilePath: \morningcore_server\tools\common.js
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

module.exports = {
  json_parse,
  json_stringify,
};
