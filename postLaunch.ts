import { 签到Events } from "./events";

export function postLaunch() {
    签到Events.emit("manualCheck");
}
