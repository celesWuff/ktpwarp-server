import { USERS } from "./config";
import { HEADERS } from "./constants";
import { CredentialType } from "./types";
import { fancyFetch, getReqtimestamp } from "./util";
import { LabelledLogger } from "./logger";

const logger = new LabelledLogger("auth");

export let credentials: CredentialType[] = [];

export async function login(username: string, password: string) {
  const _response = await fancyFetch("https://openapiv5.ketangpai.com/UserApi/login", {
    method: "POST",
    headers: HEADERS,
    body: {
      email: username,
      password,
      remember: "1",
      source_type: 1,
      reqtimestamp: getReqtimestamp(),
    },
  });
  const response: any = await _response.json();

  return response.data.token;
}

export async function loginAll() {
  logger.info("Logging in...")
  
  while (true) {
    let tokens = await Promise.all(USERS.map((user) => login(user.username, user.password)));

    credentials = tokens.map((token, index) => ({ friendlyName: USERS[index].friendlyName, token }));

    for (const credential of credentials) {
      if (typeof credential.token === "undefined") {
        logger.info("At least one login failed, retrying...");
        continue;
      } else {
        logger.info(`${credentials.length} user(s) logged in`);
        return;
      }
    }
  }
}
