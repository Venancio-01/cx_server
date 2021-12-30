const { getIPAddress, getNetmask, getBroadcastAddress, getLocalNumber } = require("../tools/index.js");

const IP = getIPAddress();
const netmask = getNetmask();
const localNum = getLocalNumber(netmask);
const broadcastAddress = getBroadcastAddress(IP, localNum);

const KOA_PORT = 35677;
const UDP_PORT = 35678;
const WEBSOCKET_PORT = 35679;
const UDP_ADDRESS = broadcastAddress;
const API_BASE = process.env.NODE_ENV == "production" ? "http://i7vmyseg.dnat.tech/" : "127.0.0.1";
global.loggerSwitch = false;

module.exports = {
  UDP_PORT,
  UDP_ADDRESS,
  WEBSOCKET_PORT,
  API_BASE,
  IP,
  KOA_PORT,
};
