import { 签到Events } from "./events";
import { getAuthenticatedHeaders, getReqtimestamp, randomRange } from "./util";
import { credentials } from "./auth";
import { classes } from "./classes";
import { DEFAULT_LATITUDE, MAX_DELAY_SECONDS, MIN_DELAY_SECONDS } from "./config";
import { CredentialType, 签到ClassType } from "./types";
import axiosRetry from "axios-retry";
import axios from "axios";

axiosRetry(axios, { retries: 3 });

export function register签到EventHandlers() {
  签到Events.on("incoming签到", fetch签到Details);
  签到Events.on("new数字签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, process数字签到, class_, 签到Id));
  签到Events.on("newGps签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, processGps签到, class_, 签到Id));
  签到Events.on("new签入签出签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, process签入签出签到, class_, 签到Id));
  // "ticketid" 保留全小写
  签到Events.on("submitQrcode", (ticketid, expire, sign) => processQrcode签到(ticketid, expire, sign));
  签到Events.on("manualCheck", () => {
    for (const class_ of classes) 签到Events.emit("incoming签到", class_.classId);
  });
}

async function delayWrapper(delaySeconds: number, fn: Function, ...args: unknown[]) {
  console.log(`[签到] Delaying 签到 for ${delaySeconds} seconds...`);

  签到Events.once("cancel", () => {
    签到Events.emit("cancelSuccess");
    签到Events.removeAllListeners("cancel");
    签到Events.removeAllListeners("skip");
    fn = () => {};
  });

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delaySeconds * 1000);
    签到Events.once("skip", () => {
      签到Events.emit("skipSuccess");
      resolve();
    });
  });

  签到Events.removeAllListeners("cancel");
  签到Events.removeAllListeners("skip");

  fn(...args);
}

async function fetch签到Details(classId: string) {
  console.log(`[签到] Fetching 签到 details for class ${classId}...`);

  const headers = getAuthenticatedHeaders(credentials[0]);

  const response = await axios.post(
    "https://openapiv5.ketangpai.com/AttenceApi/getNotFinishAttenceStudent",
    {
      courseid: classId,
      reqtimestamp: getReqtimestamp(),
    },
    { headers }
  );

  const incomplete签到s = response.data.data.lists;

  const class_ = classes.find((class_) => class_.classId == classId);
  
  if (!class_) {
    console.log(`[签到] Class ${classId} not found, skipping...`);
    return;
  }

  const delaySeconds = randomRange(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS);

  for (const 签到 of incomplete签到s) {
    if (签到.type == "1") {
      签到Events.emit("new数字签到", class_, delaySeconds, 签到.id);
    }

    if (签到.type == "2") {
      签到Events.emit("newGps签到", class_, delaySeconds, 签到.id);
    }

    if (签到.type == "3") {
      签到Events.emit("newQrcode签到", class_);
    }

    if (签到.type == "4") {
      签到Events.emit("new签入签出签到", class_, delaySeconds, 签到.id);
    }
  }
}

async function process数字签到(class_: 签到ClassType, 签到Id: string) {
  console.log(`[签到] Processing 数字签到 for class ${class_.friendlyName} (${class_.classId})...`);

  // extract 数字签到 code
  try {
    const headers = getAuthenticatedHeaders(credentials[0]);

    const response = await axios.post(
      "https://openapiv5.ketangpai.com/AttenceApi/getDigitAttence",
      {
        id: 签到Id,
        reqtimestamp: getReqtimestamp(),
      },
      { headers }
    );

    const code: string = response.data.data.data.code;
    console.log(`[签到] 数字签到 code is ${code}`);
    签到Events.emit("数字签到code", code);

    Promise.all(
      credentials.map((credential) => {
        executeNonQrcode签到(credential, 签到Id, "", "", code);
      })
    );
  } catch (e) {
    console.log(`[签到] Error fetching 数字签到 code: ${e}`);
    credentials.map((credential) => {
      签到Events.emit("签到failure", credential, "无法获取数字签到码，签到已结束或被删除？");
    });
  }
}

async function processGps签到(class_: 签到ClassType, 签到Id: string) {
  console.log(`[签到] Processing GPS 签到 for class ${class_.friendlyName} (${class_.classId})...`);

  const latitude = class_.latitude ? class_.latitude : DEFAULT_LATITUDE;
  const longitude = class_.longitude ? class_.longitude : DEFAULT_LATITUDE;

  Promise.all(
    credentials.map((credential) => {
      executeNonQrcode签到(credential, 签到Id, latitude, longitude);
    })
  );
}

async function process签入签出签到(class_: 签到ClassType, 签到Id: string) {
  console.log(`[签到] Processing 签入签出签到 for class ${class_.friendlyName} (${class_.classId})...`);

  const latitude = class_.latitude ? class_.latitude : DEFAULT_LATITUDE;
  const longitude = class_.longitude ? class_.longitude : DEFAULT_LATITUDE;

  // 先完成这一次签到
  Promise.all(
    credentials.map((credential) => {
      executeNonQrcode签到(credential, 签到Id, latitude, longitude);
    })
  );

  // 计算预计的签出时间，签出没有 WebSocket 通知，所以需要提前设置
  try {
    const headers = getAuthenticatedHeaders(credentials[0]);

    const response = await axios.post(
      "https://openapiv5.ketangpai.com/SummaryApi/attence",
      {
        courseid: class_.classId,
        page: 1,
        size: "10",
        reqtimestamp: getReqtimestamp(),
      },
      { headers }
    );

    const 签到Objects = response.data.data.data;
    const 签到Object = 签到Objects.find((签到Object: any) => 签到Object.id == 签到Id);
    const 签出DelaySeconds = 签到Object.checkouttime - new Date().getTime() / 1000;

    // 若不大于 0，代表当前签到是签出
    if (签出DelaySeconds > 0) {
      console.log(`[签到] 签出 will be executed in ${签出DelaySeconds} seconds`);

      setTimeout(() => {
        签到Events.emit("new签入签出签到", class_, randomRange(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS), 签到Id);
      }, 签出DelaySeconds * 1000);
    }
  } catch (e) {
    console.log(`[签到] Error fetching 签入签出签到 info: ${e}`);
  }
}

async function processQrcode签到(ticketid: string, expire: string, sign: string) {
  console.log(`[签到] Processing qrcode 签到 for ticketid ${ticketid}...`);

  Promise.all(
    credentials.map((credential) => {
      executeQrcode签到(credential, ticketid, expire, sign);
    })
  );
}

async function executeNonQrcode签到(credential: CredentialType, 签到Id: string, latitude = "", longitude = "", code = "") {
  console.log(`[签到] Executing non-qrcode 签到 for user ${credential.friendlyName}...`);

  const headers = getAuthenticatedHeaders(credential);

  const response = await axios.post(
    "https://openapiv5.ketangpai.com/AttenceApi/checkin",
    {
      id: 签到Id,
      code,
      unusual: "",
      latitude,
      longitude,
      accuracy: "",
      clienttype: 1,
      reqtimestamp: getReqtimestamp(),
    },
    { headers }
  );

  if (response.data.data.state == 1) {
    console.log(`[签到] Successfully 签到 for user ${credential.friendlyName}`);
    签到Events.emit("签到success", credential);
  } else {
    console.log(`[签到] Failed to 签到 for user ${credential.friendlyName}, reason: ${response.data.message}`);
    签到Events.emit("签到failure", credential, response.data.message);
  }
}

async function executeQrcode签到(credential: CredentialType, ticketid: string, expire: string, sign: string) {
  console.log(`[签到] Executing qrcode 签到 for user ${credential.friendlyName}...`);

  const headers = getAuthenticatedHeaders(credential);

  const response = await axios.post(
    "https://openapiv5.ketangpai.com/AttenceApi/AttenceResult",
    {
      ticketid,
      expire,
      sign,
      reqtimestamp: getReqtimestamp(),
    },
    { headers }
  );

  if (response.data.data.state == 8) {
    console.log(`[签到] Successfully 签到 for user ${credential.friendlyName}`);
    签到Events.emit("签到success", credential);
  } else {
    console.log(`[签到] Failed to 签到 for user ${credential.friendlyName}, reason: ${response.data.message}`);
    签到Events.emit("签到failure", credential, response.data.message);
  }
}
