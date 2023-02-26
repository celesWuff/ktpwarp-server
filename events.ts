import { TypedEmitter } from 'tiny-typed-emitter';
import { 互动答题EventType, 签到EventType } from "./types";

export const 签到Events = new TypedEmitter<签到EventType>();
export const 互动答题Events = new TypedEmitter<互动答题EventType>();
