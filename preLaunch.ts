import { CONFIG_VERSION } from "./config";
import { CURRENT_CONFIG_VERSION } from "./constants";
import { setupLogger } from "./logger";

export function preLaunch() {
  setupLogger();
  
  if (CONFIG_VERSION !== CURRENT_CONFIG_VERSION) {
    throw new Error("Your config.ts is outdated. Please copy config.example.ts to config.ts and re-configure again.");
  }
}
