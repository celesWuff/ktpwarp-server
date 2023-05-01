import { credentials } from "./auth";
import { 互动答题_CHECK_DELAY_SECONDS, 互动答题_CHECK_INTERVAL_SECONDS } from "./config";
import { 互动答题Events } from "./events";
import { CredentialType } from "./types";
import { getAuthenticatedHeaders, getReqtimestamp, getCurrentClass, fancyFetch } from "./util";
import { LabelledLogger } from "./logger";

const logger = new LabelledLogger("互动答题");

let 互动答题WatcherInterval: NodeJS.Timer;

export function register互动答题Watchers() {
  互动答题WatcherInterval = setInterval(互动答题WatcherLoop, 互动答题_CHECK_INTERVAL_SECONDS * 1000);
}

async function 互动答题WatcherLoop() {
  const class_ = getCurrentClass();

  if (class_) {
    const hasIncomplete互动答题 = await checkIncomplete互动答题(credentials[0], class_.classId);

    if (hasIncomplete互动答题) {
      logger.info(`Incoming 互动答题 for class ${class_.friendlyName} (${class_.classId})`);

      互动答题Events.emit("incoming互动答题", class_);

      clearInterval(互动答题WatcherInterval);
      await new Promise((resolve) => setTimeout(resolve, (互动答题_CHECK_DELAY_SECONDS - 互动答题_CHECK_INTERVAL_SECONDS) * 1000));
      register互动答题Watchers();
    }
  }
}

async function checkIncomplete互动答题(credential: CredentialType, classId: string) {
  const headers = getAuthenticatedHeaders(credential);

  const _response = await fancyFetch("https://openapiv100.ketangpai.com/FutureV2/CourseMeans/getCourseContent", {
    method: "POST",
    headers,
    body: {
      courseid: classId,
      courserole: 0,
      contenttype: 3,
      dirid: "0",
      lessonlink: [],
      desc: "3",
      page: 1,
      limit: 20,
      reqtimestamp: getReqtimestamp(),
    },
  });
  const response: any = await _response.json();

  if (response.data.list.length === 0) {
    return false;
  }

  if (response.data.list[0].testInfo.state == 0) {
    return true;
  } else {
    return false;
  }

}
