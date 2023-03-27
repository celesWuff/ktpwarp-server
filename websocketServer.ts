import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import {
  WEBSOCKET_ENABLE_TLS,
  TLS_CERT_PATH,
  TLS_KEY_PATH,
  WEBSOCKET_SERVER_PATH,
  WEBSOCKET_SERVER_PORT,
  ENABLE_互动答题_CHECK,
  CLASSES,
  USERS,
} from "./config";
import { KTPWARP_SERVER_VERSION, NODEJS_VERSION } from "./constants";
import { 互动答题Events, 签到Events } from "./events";
import { 签到HistoryType, 签到HistoryResultType } from "./types";
import { getCurrentClass } from "./util";
import { LabelledLogger } from "./logger";

const logger = new LabelledLogger("websocket server");

declare interface HeartbeattableSocket extends WebSocket {
  isAlive: boolean;
}

export async function createWebsocketServer() {
  let server;

  if (WEBSOCKET_ENABLE_TLS) {
    const https = await import("https");
    const fs = await import("fs");
    server = https.createServer({
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH),
    });
  } else {
    const http = await import("http");
    server = http.createServer();
  }

  const wss = new WebSocketServer({ noServer: true });

  let pending签到: 签到HistoryType | null = null;
  let finished签到s: 签到HistoryType[] = [];

  function pushNewResultIntoPending签到(result: 签到HistoryResultType) {
    if (!pending签到) {
      logger.error("A new 签到 result comes but pending签到 is null? result: " + JSON.stringify(result));
      return;
    }

    if (!pending签到.results) {
      pending签到.results = [];
    }

    pending签到.results.push(result);
  }

  wss.on("connection", (ws: HeartbeattableSocket, req) => {
    const remoteAddress = req.socket.remoteAddress;
    const xForwardedFor = req.headers["x-forwarded-for"];
    const userAgent = req.headers["user-agent"];

    if (xForwardedFor) {
      logger.info(`New connection from ${remoteAddress} (x-forwarded-for: ${xForwardedFor}), user-agent: ${userAgent}`);
    } else {
      logger.info(`New connection from ${remoteAddress}, user-agent: ${userAgent}`);
    }

    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    ws.send(
      JSON.stringify({
        type: "welcome",
        data: {
          ktpwarpServerVersion: KTPWARP_SERVER_VERSION,
          nodejsVersion: NODEJS_VERSION,
          classCount: CLASSES.length, // obsolete, only for compatibility
          互动答题ClassCount: ENABLE_互动答题_CHECK ? CLASSES.length : 0, // obsolete, only for compatibility
          schedule: CLASSES,
          currentClass: getCurrentClass(),
          finished签到s,
          pending签到,
        },
      })
    );

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (xForwardedFor) {
          logger.info(`${remoteAddress} (${xForwardedFor}) requested ${message.type?.toString()}`);
        } else {
          logger.info(`${remoteAddress} requested ${message.type?.toString()}`);
        }

        if (message.type === "manualCheck") {
          签到Events.emit("manualCheck");
        }

        if (message.type === "skip") {
          签到Events.emit("skip");
        }

        if (message.type === "cancel") {
          签到Events.emit("cancel");
        }

        if (message.type === "submitQrcode") {
          if (!pending签到) {
            // class_ 为 null，表示有用户在程序发现新二维码签到之前，就已经提交了二维码；这个情况应该仅可能发生在二维码签到时
            pending签到 = { type: "newQrcode签到", data: { class_: null } };
          }
          const { ticketid, expire, sign } = message.data;
          签到Events.emit("submitQrcode", ticketid, expire.toString(), sign);
        }
      } catch (e) {}
    });

    ws.on("close", () => {
      if (xForwardedFor) {
        logger.info(`${remoteAddress} (${xForwardedFor}) disconnected`);
      } else {
        logger.info(`${remoteAddress} disconnected`);
      }
    });

    ws.on("error", console.error);
  });

  签到Events.on("new数字签到", (class_, delaySeconds, 签到Id) => {
    pending签到 = { type: "new数字签到", data: { class_, delaySeconds, 签到Id } };
    wss.clients.forEach((client) => client.send(JSON.stringify(pending签到)));
  });

  签到Events.on("newGps签到", (class_, delaySeconds, 签到Id) => {
    pending签到 = { type: "newGps签到", data: { class_, delaySeconds, 签到Id } };
    wss.clients.forEach((client) => client.send(JSON.stringify(pending签到)));
  });

  签到Events.on("newQrcode签到", (class_) => {
    pending签到 = { type: "newQrcode签到", data: { class_ } };
    wss.clients.forEach((client) => client.send(JSON.stringify(pending签到)));
  });

  签到Events.on("new签入签出签到", (class_, delaySeconds, 签到Id) => {
    pending签到 = { type: "new签入签出签到", data: { class_, delaySeconds, 签到Id } };
    wss.clients.forEach((client) => client.send(JSON.stringify(pending签到)));
  });

  签到Events.on("skipSuccess", () => {
    wss.clients.forEach((client) => client.send(JSON.stringify({ type: "skipSuccess" })));
  });

  签到Events.on("cancelSuccess", () => {
    pending签到 = null;
    wss.clients.forEach((client) => client.send(JSON.stringify({ type: "cancelSuccess" })));
  });

  签到Events.on("数字签到code", (code) => {
    wss.clients.forEach((client) => client.send(JSON.stringify({ type: "数字签到code", data: { code } })));
  });

  签到Events.on("submitQrcode", () => {
    wss.clients.forEach((client) => client.send(JSON.stringify({ type: "receivedQrcode" })));
  });

  签到Events.on("签到success", (credential) => {
    const payload = { type: "签到success", data: { friendlyName: credential.friendlyName } };
    pushNewResultIntoPending签到(payload);
    wss.clients.forEach((client) => client.send(JSON.stringify(payload)));
  });

  签到Events.on("签到failure", (credential, failureMessage) => {
    const payload = { type: "签到failure", data: { friendlyName: credential.friendlyName, failureMessage } };
    pushNewResultIntoPending签到(payload);
    wss.clients.forEach((client) => client.send(JSON.stringify(payload)));
  });

  互动答题Events.on("incoming互动答题", (class_) => {
    wss.clients.forEach((client) => client.send(JSON.stringify({ type: "incoming互动答题", data: { class_ } })));
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      const ws_ = ws as HeartbeattableSocket;

      if (ws_.isAlive === false) return ws_.terminate();

      ws_.isAlive = false;
      ws_.ping();
    });
  }, 25000);

  setInterval(() => {
    if (pending签到 && pending签到.results?.length === USERS.length) {
      finished签到s.push({ ...pending签到, results: pending签到.results });

      pending签到 = null;
    }

    if (!getCurrentClass()) {
      finished签到s = [];
    }
  }, 1000);

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url!);

    if (pathname === WEBSOCKET_SERVER_PATH) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(WEBSOCKET_SERVER_PORT, () => {
    logger.info(`WebSocket server listening on port ${WEBSOCKET_SERVER_PORT}`);
  });
}
