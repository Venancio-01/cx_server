const os = require("os");

const getIPAddress = () => {
  var interfaces = os.networkInterfaces();
  if (process.env.NODE_ENV == "production") {
    for (var devName in interfaces) {
      var iface = interfaces[devName];
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
          return alias.address;
        }
      }
    }
  } else {
    return interfaces.br0[0] ? interfaces.br0[0].address : "";
  }
};

const getNetmask = () => {
  var interfaces = os.networkInterfaces();
  if (process.env.NODE_ENV == "production") {
    for (var devName in interfaces) {
      var iface = interfaces[devName];
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
          return alias.netmask;
        }
      }
    }
  } else {
    return interfaces.br0[0].netmask;
  }
};

const getBroadcastAddress = function (netAddress, localNumber) {
  if (!netAddress) return "";

  var netArr = netAddress.split(".");
  var length = netArr.length;
  var more = localNumber % 8;
  var except = parseInt(localNumber / 8);
  if (more != 0) ++except;
  except = length - except;
  for (var i = except; i < length; i++) {
    var netPart = Number(netArr[i]);
    var temp = convertBinary(netPart);
    if ("" == temp) {
      temp = "00000000";
    }
    if (i == except) {
      if (more == 0) {
        temp = "11111111";
      } else {
        temp = temp.substring(0, 8 - more) + getNumber(more);
      }
      var result = Number(temp);
      result = binaryToDecimal(result);
      netArr[i] = result + "";
    } else {
      netArr[i] = "255";
    }
  }
  return netArr.join(".");
};

//获取主机位0的个数
const getLocalNumber = function (subnetMask) {
  var maskArr = subnetMask.split(".");
  var length = maskArr.length;
  for (var i = 0; i < length; i++) {
    var maskPart = Number(maskArr[i]);
    var temp = convertBinary(maskPart);
    if ("11111111" != temp) {
      var index = temp.lastIndexOf("1") + 1;
      var result = 8 - index + (length - i - 1) * 8;
      return result;
    }
  }
  return 0;
};
//转成二进制
const convertBinary = function (sum) {
  var binary = "";
  while (sum != 0 && sum != 1) {
    binary = binary.slice(0, 1) + (sum % 2) + binary.slice(1);
    sum = parseInt(sum / 2);
    if (sum == 0 || sum == 1) {
      binary = binary.slice(0, 1) + (sum % 2) + binary.slice(1);
    }
  }
  return binary.toString();
};
//获取1的字符串
const getNumber = function (number) {
  var result = "";
  for (var i = 0; i < number; i++) {
    result = "1" + result;
  }
  return result;
};

//二进制转十进制
const binaryToDecimal = function (binaryNumber) {
  var decimal = 0;
  var p = 0;
  while (true) {
    if (binaryNumber == 0) {
      break;
    } else {
      var temp = binaryNumber % 10;
      decimal += temp * Math.pow(2, p);
      binaryNumber = parseInt(binaryNumber / 10);
      p++;
    }
  }
  return decimal;
};

module.exports = {
  getIPAddress,
  getNetmask,
  getBroadcastAddress,
  getLocalNumber,
};
