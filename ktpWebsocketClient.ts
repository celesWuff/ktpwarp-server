import WebSocket from "ws";
import { 签到Events } from "./events";
import { credentials } from "./auth";

export async function createKtpWebsocketClient() {
  const ws = new WebSocket("wss://websocketv5.ketangpai.com", [credentials[0].token, "defeca7e"]);
  const keepAlivePayload = JSON.stringify({ cmd: "AttendClass.setActive", data: { classId: null, classTimeId: null, courserole: 0 } });

  const keepAliveInterval = setInterval(() => ws.send(keepAlivePayload), 25 * 1000);

  ws.on("open", () => {
    console.log("[ktpWebsocketClient] WebSocket connection established");
    ws.send(JSON.stringify({ cmd: "ping", data: 10 }));
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    if (message.cmd === "KeTangPaiPublishAttendance") {
      console.log("[ktpWebsocketClient] Incoming 签到 event");
      签到Events.emit("incoming签到", message.data.classId);
    }
  });

  ws.on("close", () => {
    console.log("[ktpWebsocketClient] WebSocket connection closed, reconnecting...");
    clearInterval(keepAliveInterval);
    createKtpWebsocketClient();
  });
}
