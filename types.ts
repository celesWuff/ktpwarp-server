export interface 签到EventType {
  incoming签到: (classId: string) => void;
  new数字签到: (class_: 签到ClassType, delaySeconds: number, 签到Id: string) => void;
  newGps签到: (class_: 签到ClassType, delaySeconds: number, 签到Id: string) => void;
  newQrcode签到: (class_: 签到ClassType) => void;
  new签入签出签到: (class_: 签到ClassType, delaySeconds: number, 签到Id: string) => void;
  submitQrcode: (ticketid: string, expire: string, sign: string) => void;
  manualCheck: () => void;
  cancel: () => void;
  cancelSuccess: () => void;
  skip: () => void;
  skipSuccess: () => void;
  数字签到code: (code: string) => void;
  签到success: (credential: CredentialType) => void;
  签到failure: (credential: CredentialType, failureMessage: string) => void;
}

export interface 互动答题EventType {
  incoming互动答题: (class_: 互动答题ClassType) => void;
}

export interface UserType {
  friendlyName: string;
  username: string;
  password: string;
}

export interface 签到ClassType {
  friendlyName: string;
  classId: string;
  latitude?: string;
  longitude?: string;
}

export interface 互动答题ClassType {
  friendlyName: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CredentialType {
  friendlyName: string;
  token: string;
}

export interface 签到ResultType {
  friendlyName: string;
  message: string;
}
