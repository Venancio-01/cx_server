/*
 * @Author: liqingshan
 * @Date: 2022-03-23 10:37:02
 * @LastEditTime: 2022-03-23 10:48:56
 * @LastEditors: liqingshan
 * @FilePath: \cx_server\tools\time.js
 * @Description:
 */
const formatTime = (time, format) => {
  var t = new Date(time);
  var tf = function (i) {
    return (i < 10 ? "0" : "") + i;
  };
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
    switch (a) {
      case "yyyy":
        return tf(t.getFullYear());
      case "MM":
        return tf(t.getMonth() + 1);
      case "mm":
        return tf(t.getMinutes());
      case "dd":
        return tf(t.getDate());
      case "HH":
        return tf(t.getHours());
      case "ss":
        return tf(t.getSeconds());
    }
  });
};

module.exports = {
  formatTime,
};
