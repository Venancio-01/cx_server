const GPS = require("gps");
const shell = require("shelljs");

let timer = null;

const interceptionContent = () => {
  return new Promise((res, rej) => {
    clearInterval(timer);
    timer = setTimeout(() => {
      rej(new Error("time out"));
    }, 2000);

    const result = shell.exec("busybox head -n 22 /dev/ttyS1", { async: true });
    result.stdout.on("data", (data) => {
      const arr = data.split("\n").filter((item) => item.length > 3);
      const target = arr.find((item) => item.includes("GNGGA"));
      clearInterval(timer);
      res(target);
    });
  });
};

const generateCoordinates = async () => {
  let result = null;
  try {
    result = await interceptionContent();
  } catch (err) {
    console.log(err);
  }
  if (result) {
    const Parse = GPS.Parse(result);
    const { lat, lon } = Parse;
    return {
      lat,
      lon,
    };
  } else {
    return null;
  }
};

module.exports = generateCoordinates;
