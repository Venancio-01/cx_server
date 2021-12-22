const udp_client = require("./UDP.js");
const { UDP_PORT, UDP_ADDRESS } = require("../config/index.js");
const ws = require("nodejs-websocket");

const websocket = ws.createServer(function (socket) {
  socket.on("text", (str) => {
    console.log(str);
    if (str == "init") {
      handleUDPSend(101);
    } else if (str == "getMapData") {
      handleUDPSend(103);
    }
  });
});

const handleUDPSend = (code) => {
  const data = {
    status: code,
  };
  const handleData = JSON.stringify(data);
  udp_client.send(handleData, 0, handleData.length, UDP_PORT, UDP_ADDRESS, (err) => {
    console.log(err, "UDP error");
  });
};

module.exports = websocket;
