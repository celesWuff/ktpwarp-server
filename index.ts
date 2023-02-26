import { loginAll } from "./auth";
import { createTelegramBot } from "./telegramBot";
import { fetchClasses } from "./classes";
import { ENABLE_TELEGRAM_BOT, ENABLE_互动答题_CHECK } from "./config";
import { createKtpWebsocketClient } from "./ktpWebsocketClient";
import { createWebsocketServer } from "./websocketServer";
import { register互动答题Watchers } from "./互动答题";
import { register签到EventHandlers } from "./签到";

// 课堂派混用了 class 与 course 两个词，我们统一用 class
// 此外，课堂派的 API 中大量使用“attence”这个拼写错误的词指代“签到”，我们将直接使用汉字，互动答题同理

async function main() {
  await loginAll();
  await fetchClasses();

  register签到EventHandlers();
  if (ENABLE_互动答题_CHECK) register互动答题Watchers();

  createKtpWebsocketClient();
  createWebsocketServer();
  if (ENABLE_TELEGRAM_BOT) createTelegramBot();
}

main();
