import { CLASSES, FAKE_IP_PREFIX } from "./config";
import { HEADERS } from "./constants";
import { LabelledLogger } from "./logger";
import { ClassType, CredentialType } from "./types";
import { fetch } from "@adobe/fetch";

const logger = new LabelledLogger("util");

// 为了消灭 (用户数量 - 1)/254 的概率出现“IP 地址冲突”，使用 Fisher-Yates shuffle 算法替代直接的随机数生成
class FakeIpSuffix {
  private nums: number[] = [];

  constructor() {
    this.generateAndShuffle();
  }

  private generateAndShuffle() {
    for (let i = 1; i <= 254; i++) {
      this.nums.push(i);
    }

    for (let i = this.nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.nums[i], this.nums[j]] = [this.nums[j], this.nums[i]];
    }
  }

  public next() {
    if (this.nums.length === 0) {
      this.generateAndShuffle();
    }
    return this.nums.pop();
  }
}

const fakeIpSuffix = new FakeIpSuffix();

export function getReqtimestamp(): number {
  return Date.now();
}

export function randomRange(min: number, max: number) {
  return Math.round(Math.random() * (max - min)) + min;
}

export function getAuthenticatedHeaders(credential: CredentialType): any {
  const headers = structuredClone(HEADERS);
  headers["token"] = credential.token;
  headers["X-Forwarded-For"] = FAKE_IP_PREFIX + fakeIpSuffix.next();
  return headers;
}

function checkIfInClassNow(class_: ClassType): boolean {
  const now = new Date();
  const nowDayOfWeek = now.getDay();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const targetDayOfWeek = class_.dayOfWeek;
  const targetStartHour = parseInt(class_.startTime.split(":")[0]);
  const targetStartMinute = parseInt(class_.startTime.split(":")[1]);
  const targetEndHour = parseInt(class_.endTime.split(":")[0]);
  const targetEndMinute = parseInt(class_.endTime.split(":")[1]);
  if (nowDayOfWeek === targetDayOfWeek) {
    if (nowHour > targetStartHour || (nowHour === targetStartHour && nowMinute >= targetStartMinute)) {
      if (nowHour < targetEndHour || (nowHour === targetEndHour && nowMinute <= targetEndMinute)) {
        return true;
      }
    }
  }
  return false;
}

export function getCurrentClass() {
  for (const class_ of CLASSES) {
    if (checkIfInClassNow(class_)) {
      return class_;
    }
  }
  return null;
}

export function getDeduplicatedClasses() {
  const currentClass = getCurrentClass();
  const simpleDeduplicatedClasses = CLASSES.filter((value, index, self) => index === self.findIndex((t) => t.classId === value.classId));

  if (currentClass === null) {
    return simpleDeduplicatedClasses;
  } else {
    return [currentClass, ...simpleDeduplicatedClasses.filter((class_) => class_.classId !== currentClass.classId)];
  }
}

export async function fancyFetch(...args: Parameters<typeof fetch>) {
  const maxRetries = 3;
  let retry = 0;

  while (retry < maxRetries) {
    try {
      return await fetch(...args);
    } catch (e) {
      retry++;
      if (retry === maxRetries) {
        throw e;
      }
      logger.warn(`Retrying fetch... (${retry}/${maxRetries}), error: ${(e as any).code?.toString()}`);
    }
  }
  throw new Error("Unreachable");
}
