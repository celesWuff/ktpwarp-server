import { 签到Events } from "./events";
import { getAuthenticatedHeaders, getReqtimestamp, getCurrentClass, randomRange, fancyFetch } from "./util";
import { credentials } from "./auth";
import { CLASSES, DEFAULT_LATITUDE, DEFAULT_LONGITUDE, MAX_DELAY_SECONDS, MIN_DELAY_SECONDS, 签到_CHECK_INTERVAL_SECONDS } from "./config";
import { ClassType, CredentialType } from "./types";
import { LabelledLogger } from "./logger";

const logger = new LabelledLogger("签到");

let hasPending签到 = false;

export function register签到EventHandlers() {
  签到Events.on("new数字签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, process数字签到, class_, 签到Id));
  签到Events.on("newGps签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, processGps签到, class_, 签到Id));
  签到Events.on("new签入签出签到", (class_, delaySeconds, 签到Id) => delayWrapper(delaySeconds, process签入签出签到, class_, 签到Id));
  // "ticketid" 保留全小写
  签到Events.on("submitQrcode", (ticketid, expire, sign) => processQrcode签到(ticketid, expire, sign));
  签到Events.on("manualCheck", () => {
    for (const class_ of CLASSES) checkIncomplete签到(class_);
  });
}

export function register签到Watchers() {
  setInterval(签到WatcherLoop, 签到_CHECK_INTERVAL_SECONDS * 1000);
}

function 签到WatcherLoop() {
  const currentClass = getCurrentClass();

  if (currentClass) {
    checkIncomplete签到(currentClass);
  }
}

async function delayWrapper(delaySeconds: number, fn: Function, ...args: unknown[]) {
  logger.info(`Delaying 签到 for ${delaySeconds} seconds...`);

  签到Events.once("cancel", () => {
    签到Events.emit("cancelSuccess");
    签到Events.removeAllListeners("cancel");
    签到Events.removeAllListeners("skip");
    hasPending签到 = false;
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

async function checkIncomplete签到(class_: ClassType) {
  const headers = getAuthenticatedHeaders(credentials[0]);

  const _response = await fancyFetch("https://openapiv100.ketangpai.com/AttenceApi/getNotFinishAttenceStudent", {
    method: "POST",
    headers,
    body: {
      courseid: class_.classId,
      reqtimestamp: getReqtimestamp(),
    },
  });
  const response: any = await _response.json();

  const incomplete签到s = response.data.lists;
  const 签到 = incomplete签到s[0];

  // 在 ktpwarp-server 动作之前就已撤销或结束的签到，按取消签到处理
  if (!签到 && hasPending签到) {
    logger.warn("签到 has been cancelled before we move on!");
    hasPending签到 = false;
    签到Events.emit("cancel");
  }
  if (!签到 || hasPending签到) return;

  hasPending签到 = incomplete签到s.length > 0;

  const delaySeconds = randomRange(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS);

  if (签到.type == "1") {
    logger.info(`Found 数字签到 for class ${class_.friendlyName} (${class_.classId})`);
    签到Events.emit("new数字签到", class_, delaySeconds, 签到.id);
  }

  if (签到.type == "2") {
    logger.info(`Found GPS 签到 for class ${class_.friendlyName} (${class_.classId})`);
    签到Events.emit("newGps签到", class_, delaySeconds, 签到.id);
  }

  if (签到.type == "3") {
    logger.info(`Found 二维码签到 for class ${class_.friendlyName} (${class_.classId})`);
    签到Events.emit("newQrcode签到", class_);

    // 二维码签到没有 delayWrapper，在此处理签到被撤回的事件
    签到Events.once("cancel", () => {
      签到Events.emit("cancelSuccess");
      hasPending签到 = false;
    });
  }

  if (签到.type == "4") {
    logger.info(`Found 签入签出签到 for class ${class_.friendlyName} (${class_.classId})`);
    签到Events.emit("new签入签出签到", class_, delaySeconds, 签到.id);
  }
}

async function process数字签到(class_: ClassType, 签到Id: string) {
  logger.info(`Processing 数字签到 for class ${class_.friendlyName} (${class_.classId})...`);
  hasPending签到 = false;

  // extract 数字签到 code
  try {
    const headers = getAuthenticatedHeaders(credentials[0]);

    const _response = await fancyFetch("https://openapiv100.ketangpai.com/AttenceApi/getDigitAttence", {
      method: "POST",
      headers,
      body: {
        id: 签到Id,
        reqtimestamp: getReqtimestamp(),
      },
    });
    const response: any = await _response.json();

    const code: string = response.data.data.code;
    logger.info(`数字签到 code is ${code}`);
    签到Events.emit("数字签到code", code);

    Promise.all(
      credentials.map((credential) => {
        executeNonQrcode签到(credential, 签到Id, "", "", code);
      })
    );
  } catch (e) {
    logger.error(`Error fetching 数字签到 code: ${e}`);
    credentials.map((credential) => {
      签到Events.emit("签到failure", credential, "无法获取数字签到码，签到已结束或被删除？");
    });
  }
}

async function processGps签到(class_: ClassType, 签到Id: string) {
  logger.info(`Processing GPS 签到 for class ${class_.friendlyName} (${class_.classId})...`);
  hasPending签到 = false;

  const latitude = class_.latitude ? class_.latitude : DEFAULT_LATITUDE;
  const longitude = class_.longitude ? class_.longitude : DEFAULT_LONGITUDE;

  Promise.all(
    credentials.map((credential) => {
      executeNonQrcode签到(credential, 签到Id, latitude, longitude);
    })
  );
}

async function process签入签出签到(class_: ClassType, 签到Id: string) {
  logger.info(`Processing 签入签出签到 for class ${class_.friendlyName} (${class_.classId})...`);
  hasPending签到 = false;

  const latitude = class_.latitude ? class_.latitude : DEFAULT_LATITUDE;
  const longitude = class_.longitude ? class_.longitude : DEFAULT_LONGITUDE;

  Promise.all(
    credentials.map((credential) => {
      executeNonQrcode签到(credential, 签到Id, latitude, longitude);
    })
  );
}

async function processQrcode签到(ticketid: string, expire: string, sign: string) {
  logger.info(`Processing qrcode 签到 for ticketid ${ticketid}...`);
  hasPending签到 = false;

  Promise.all(
    credentials.map((credential) => {
      executeQrcode签到(credential, ticketid, expire, sign);
    })
  );
}

async function executeNonQrcode签到(credential: CredentialType, 签到Id: string, latitude = "", longitude = "", code = "") {
  logger.info(`Executing non-qrcode 签到 for user ${credential.friendlyName}...`);

  const headers = getAuthenticatedHeaders(credential);

  const _response = await fancyFetch("https://openapiv100.ketangpai.com/AttenceApi/checkin", {
    method: "POST",
    headers,
    body: {
      id: 签到Id,
      code,
      unusual: "",
      latitude,
      longitude,
      accuracy: "",
      clienttype: 1,
      reqtimestamp: getReqtimestamp(),
    },
  });
  const response: any = await _response.json();

  if (response.data.state == 1) {
    logger.info(`Successfully 签到 for user ${credential.friendlyName}`);
    签到Events.emit("签到success", credential);
  } else {
    logger.info(`Failed to 签到 for user ${credential.friendlyName}, reason: ${response.message}`);
    签到Events.emit("签到failure", credential, response.message);
  }
}

async function executeQrcode签到(credential: CredentialType, ticketid: string, expire: string, sign: string) {
  logger.info(`Executing qrcode 签到 for user ${credential.friendlyName}...`);

  const headers = getAuthenticatedHeaders(credential);

  const _response = await fancyFetch("https://openapiv100.ketangpai.com/AttenceApi/AttenceResult", {
    method: "POST",
    headers,
    body: {
      ticketid,
      expire,
      sign,
      reqtimestamp: getReqtimestamp(),
    },
  });
  const response: any = await _response.json();

  if (response.data.state == 8) {
    logger.info(`Successfully 签到 for user ${credential.friendlyName}`);
    签到Events.emit("签到success", credential);
  } else {
    logger.info(`Failed to 签到 for user ${credential.friendlyName}, reason: ${response.message}`);
    签到Events.emit("签到failure", credential, response.message);
  }
}
