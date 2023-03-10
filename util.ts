import { FAKE_IP_PREFIX } from "./config";
import { HEADERS } from "./constants";
import { CredentialType } from "./types";

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

export function restartServer() {
  console.log("[util] Shutting down server and let pm2 restart it!");
  setTimeout(() => process.exit(0), 1000);
}
