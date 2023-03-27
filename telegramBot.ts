import { Telegraf } from "telegraf";
import { credentials } from "./auth";
import {
  CLASSES,
  TELEGRAM_BOT_API_URL,
  TELEGRAM_BOT_PRIVACY_MODE,
  TELEGRAM_BOT_PRIVACY_MODE_WHITELIST,
  TELEGRAM_BOT_REPLY_INVALID_QRCODE,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  互动答题_CHECK_DELAY_SECONDS,
} from "./config";
import { KTPWARP_SERVER_VERSION, NODEJS_VERSION, WEEKDAY_NAMES } from "./constants";
import { 互动答题Events, 签到Events } from "./events";
import { CredentialType } from "./types";
import { getCurrentClass } from "./util";
import Jimp from "jimp";
import jsQR from "jsqr";
import axiosRetry from "axios-retry";
import axios from "axios";
import { LabelledLogger } from "./logger";

const logger = new LabelledLogger("telegram bot");
axiosRetry(axios, { retries: 3 });

const motd = `ktpWarp: 课堂派自动签到
https://github.com/celesWuff/ktpwarp-server
copyright (c) 2023 celesWuff, licensed under MIT License

ktpwarp-server ${KTPWARP_SERVER_VERSION}
Node.js ${NODEJS_VERSION}

使用 /check 手动检查签到、/skip 跳过等待时间、/cancel 取消签到、/schedule 查看课程表。`;

const schedule = CLASSES.map((c) => `${c.friendlyName}，每周${WEEKDAY_NAMES[c.dayOfWeek]}，${c.startTime} 至 ${c.endTime}`).join("\n");

export async function createTelegramBot() {
  logger.info("Launching Telegram Bot");

  const bot = new Telegraf(TELEGRAM_BOT_TOKEN, { telegram: { apiRoot: TELEGRAM_BOT_API_URL } });

  bot.use((ctx, next) => {
    const whitelist = TELEGRAM_BOT_PRIVACY_MODE_WHITELIST.slice();
    whitelist.push(TELEGRAM_CHAT_ID);

    if (!ctx.chat || !TELEGRAM_BOT_PRIVACY_MODE || whitelist.includes(ctx.chat.id)) {
      return next();
    }
  });

  bot.start((ctx) => {
    logger.info("Received /start command from: " + ctx.chat.id);
    ctx.reply(motd, {
      disable_web_page_preview: true,
    });
  });

  bot.command("check", (ctx) => {
    logger.info("Received /check command from: " + ctx.chat.id);
    签到Events.emit("manualCheck");
    ctx.reply("正在为所有课程检查签到，若有新的签到将会通知您。");
  });

  bot.command("skip", (ctx) => {
    logger.info("Received /skip command from: " + ctx.chat.id);
    签到Events.emit("skip");
  });

  bot.command("cancel", (ctx) => {
    logger.info("Received /cancel command from: " + ctx.chat.id);
    签到Events.emit("cancel");
  });

  bot.command("schedule", (ctx) => {
    logger.info("Received /schedule command from: " + ctx.chat.id);
    let currentClass = getCurrentClass();

    if (currentClass) {
      ctx.reply(`正在检查：${currentClass.friendlyName}\n\n${schedule}`);
    } else {
      ctx.reply(schedule);
    }
  });

  // XXX
  bot.on("photo", async (ctx) => {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;

    logger.verbose(`Received photo from ${ctx.chat.id}, file ID: ${fileId}`);
    // ctx.reply("正在识别二维码。");

    const url = await ctx.telegram.getFileLink(fileId);
    const response = await axios.get(url.toString(), { responseType: "arraybuffer" });
    const arrayBuffer = response.data;

    const image = await Jimp.read(arrayBuffer);
    const rgbaData = image.bitmap.data;
    const rgbaArray = new Uint8ClampedArray(rgbaData.buffer);

    const qrcode = jsQR(rgbaArray, image.bitmap.width, image.bitmap.height);

    if (qrcode) {
      const qrcodeText = qrcode.data;
      logger.verbose(`QR code text: ${qrcodeText}`);

      if (qrcodeText.startsWith("https://w.ketangpai.com/checkIn/checkinCodeResult")) {
        try {
          const url = new URL(qrcodeText);
          const params = new URLSearchParams(url.search);

          const ticketid = params.get("ticketid");
          const expire = params.get("expire");
          const sign = params.get("sign");

          if (!ticketid || !expire || !sign) throw new Error("Invalid QR code");

          签到Events.emit("submitQrcode", ticketid, expire, sign);
        } catch (e) {
          logger.error("Failed to parse QR code: " + e);
          ctx.reply("已接收到课堂派二维码，但无法识别出签到信息，因此将不会签到。");
        }
      } else {
        TELEGRAM_BOT_REPLY_INVALID_QRCODE ? ctx.reply("不是课堂派二维码。") : null;
      }
    } else {
      TELEGRAM_BOT_REPLY_INVALID_QRCODE ? ctx.reply("无法识别二维码。") : null;
    }
  });

  bot.launch();

  function sendMessage(message: string) {
    bot.telegram.sendMessage(TELEGRAM_CHAT_ID, message);
    logger.verbose(`Sent message to ${TELEGRAM_CHAT_ID}: ${message}`)
  }

  签到Events.on("skipSuccess", () => sendMessage("已跳过等待时间。"));
  签到Events.on("cancelSuccess", () => sendMessage("已取消签到。"));

  签到Events.on("new数字签到", (class_, delaySeconds, _) =>
    sendMessage(`课程 ${class_.friendlyName} 发现数字签到，将在 ${delaySeconds} 秒后签到。\n\n按 /skip 跳过等待时间，按 /cancel 取消。`)
  );
  签到Events.on("newGps签到", (class_, delaySeconds, _) =>
    sendMessage(`课程 ${class_.friendlyName} 发现 GPS 签到，将在 ${delaySeconds} 秒后签到。\n\n按 /skip 跳过等待时间，按 /cancel 取消。`)
  );
  签到Events.on("newQrcode签到", (class_) =>
    sendMessage(`课程 ${class_.friendlyName} 发现二维码签到，请使用您喜欢的方式扫描二维码，或直接向机器人回复一张二维码图片。`)
  );
  签到Events.on("new签入签出签到", (class_, delaySeconds, _) =>
    sendMessage(`课程 ${class_.friendlyName} 发现签入签出签到，将在 ${delaySeconds} 秒后签入（或签出）。\n\n按 /skip 跳过等待时间，按 /cancel 取消。`)
  );

  签到Events.on("数字签到code", (code) => sendMessage(`数字签到码为 ${code}。`));
  签到Events.on("submitQrcode", () => sendMessage("接收到课堂派二维码，正在签到。"));

  let allUsers签到Result: { friendlyName: string, message: string }[] = [];

  function collectAndBroadcast签到Result(credential: CredentialType, failureMessage?: string) {
    const friendlyName = credential.friendlyName;
    const message = failureMessage ? failureMessage : "签到成功";
    allUsers签到Result.push({ friendlyName, message });

    if (Object.keys(allUsers签到Result).length === credentials.length) {
      const message = Object.entries(allUsers签到Result)
        .map(([_, result]) => `${result.friendlyName}：${result.message}`)
        .join("\n");
      sendMessage(message);

      allUsers签到Result = [];
    }
  }

  签到Events.on("签到success", collectAndBroadcast签到Result);
  签到Events.on("签到failure", collectAndBroadcast签到Result);

  互动答题Events.on("incoming互动答题", (class_) => sendMessage(`课程 ${class_.friendlyName} 发现互动答题，${互动答题_CHECK_DELAY_SECONDS} 秒后恢复检测。`));
}
