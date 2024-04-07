import { CLASSES, FAKE_IP_PREFIX } from "./config";
import { HEADERS } from "./constants";
import { LabelledLogger } from "./logger";
import { ClassType, CredentialType } from "./types";
import { fetch } from "@adobe/fetch";

const logger = new LabelledLogger("util");

// 为了消灭 (用户数量 - 1)/254 的概率出现“IP 地址冲突”，使用 Fisher-Yates shuffle 算法替代直接的随机数生成
class FakeIp {
  private prefixes: string[] = [];
  private suffixes: number[] = [];

  // for backward compatibility
  private fakeIpPrefix: string | string[] = FAKE_IP_PREFIX;

  constructor() {
    this.generatePrefixes();
    this.generateSuffixes();
  }

  private generatePrefixes() {
    if (typeof this.fakeIpPrefix === "string") {
      this.prefixes = [this.fakeIpPrefix];
      return;
    }

    this.prefixes = [];

    for (const prefix of this.fakeIpPrefix) {
      this.prefixes.push(prefix);
    }

    for (let i = this.prefixes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.prefixes[i], this.prefixes[j]] = [this.prefixes[j], this.prefixes[i]];
    }
  }

  private generateSuffixes() {
    this.suffixes = [];

    for (let i = 1; i <= 254; i++) {
      this.suffixes.push(i);
    }

    for (let i = this.suffixes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.suffixes[i], this.suffixes[j]] = [this.suffixes[j], this.suffixes[i]];
    }
  }

  public next() {
    if (this.prefixes.length === 0) {
      this.generatePrefixes();
    }

    if (this.suffixes.length === 0) {
      this.generateSuffixes();
    }

    return this.prefixes.pop()!.concat(this.suffixes.pop()!.toString());
  }

  public reset() {
    this.generatePrefixes();
    this.generateSuffixes();
  }
}

export const fakeIp = new FakeIp();

export function getReqtimestamp(): number {
  return Date.now();
}

export function randomRange(min: number, max: number) {
  return Math.round(Math.random() * (max - min)) + min;
}

export function getAuthenticatedHeaders(credential: CredentialType): any {
  const headers = structuredClone(HEADERS);
  headers["token"] = credential.token;
  headers["X-Forwarded-For"] = fakeIp.next();
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
