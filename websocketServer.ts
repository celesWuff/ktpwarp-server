import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { classes } from "./classes";
import {
  WEBSOCKET_ENABLE_TLS,
  TLS_CERT_PATH,
  TLS_KEY_PATH,
  WEBSOCKET_SERVER_PATH,
  WEBSOCKET_SERVER_PORT,
  ENABLE_互动答题_CHECK,
  互动答题_CLASSES,
} from "./config";
import { KTPWARP_SERVER_VERSION, NODEJS_VERSION } from "./constants";
import { 互动答题Events, 签到Events } from "./events";
import { CredentialType, 互动答题ClassType, 签到ClassType } from "./types";
import { restartServer } from "./util";

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

  wss.on("connection", (ws: HeartbeattableSocket) => {
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    ws.send(
      JSON.stringify({
        type: "welcome",
        data: {
          ktpwarpServerVersion: KTPWARP_SERVER_VERSION,
          nodejsVersion: NODEJS_VERSION,
          classCount: classes.length,
          互动答题ClassCount: ENABLE_互动答题_CHECK ? 互动答题_CLASSES.length : 0,
        },
      })
    );

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

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
          const { ticketid, expire, sign } = message.data;
          签到Events.emit("submitQrcode", ticketid, expire.toString(), sign);
        }

        if (message.type === "restart") {
          ws.send(JSON.stringify({ type: "adios" }));
          restartServer();
        }
      } catch (e) {}
    });

    ws.on("error", console.error);

    function skipSuccess() {
      ws.send(JSON.stringify({ type: "skipSuccess" }));
    }

    function cancelSuccess() {
      ws.send(JSON.stringify({ type: "cancelSuccess" }));
    }

    function new数字签到(class_: 签到ClassType, delaySeconds: number, 签到Id: string) {
      ws.send(JSON.stringify({ type: "new数字签到", data: { class_, delaySeconds, 签到Id } }));
    }

    function newGps签到(class_: 签到ClassType, delaySeconds: number, 签到Id: string) {
      ws.send(JSON.stringify({ type: "newGps签到", data: { class_, delaySeconds, 签到Id } }));
    }

    function newQrcode签到(class_: 签到ClassType) {
      ws.send(JSON.stringify({ type: "newQrcode签到", data: { class_ } }));
    }

    function new签入签出签到(class_: 签到ClassType, delaySeconds: number, 签到Id: string) {
      ws.send(JSON.stringify({ type: "new签入签出签到", data: { class_, delaySeconds, 签到Id } }));
    }

    function 数字签到code(code: string) {
      ws.send(JSON.stringify({ type: "数字签到code", data: { code } }));
    }

    function submitQrcode() {
      ws.send(JSON.stringify({ type: "receivedQrcode" }));
    }

    function 签到success(credential: CredentialType) {
      ws.send(JSON.stringify({ type: "签到success", data: { friendlyName: credential.friendlyName } }));
    }

    function 签到failure(credential: CredentialType, failureMessage: string) {
      ws.send(JSON.stringify({ type: "签到failure", data: { friendlyName: credential.friendlyName, failureMessage } }));
    }

    function incoming互动答题(class_: 互动答题ClassType) {
      ws.send(JSON.stringify({ type: "incoming互动答题", data: { class_ } }));
    }

    签到Events.on("skipSuccess", skipSuccess);
    签到Events.on("cancelSuccess", cancelSuccess);
    签到Events.on("new数字签到", new数字签到);
    签到Events.on("newGps签到", newGps签到);
    签到Events.on("newQrcode签到", newQrcode签到);
    签到Events.on("new签入签出签到", new签入签出签到);
    签到Events.on("数字签到code", 数字签到code);
    签到Events.on("submitQrcode", submitQrcode);
    签到Events.on("签到success", 签到success);
    签到Events.on("签到failure", 签到failure);
    互动答题Events.on("incoming互动答题", incoming互动答题);

    ws.on("close", () => {
      签到Events.off("skipSuccess", skipSuccess);
      签到Events.off("cancelSuccess", cancelSuccess);
      签到Events.off("new数字签到", new数字签到);
      签到Events.off("newGps签到", newGps签到);
      签到Events.off("newQrcode签到", newQrcode签到);
      签到Events.off("new签入签出签到", new签入签出签到);
      签到Events.off("数字签到code", 数字签到code);
      签到Events.off("submitQrcode", submitQrcode);
      签到Events.off("签到success", 签到success);
      签到Events.off("签到failure", 签到failure);
      互动答题Events.off("incoming互动答题", incoming互动答题);
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      const ws_ = ws as HeartbeattableSocket;

      if (ws_.isAlive === false) return ws_.terminate();

      ws_.isAlive = false;
      ws_.ping();
    });
  }, 25000);

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
    console.log(`[websocketServer] WebSocket server listening on port ${WEBSOCKET_SERVER_PORT}`);
  });
}
