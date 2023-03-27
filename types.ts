export interface 签到EventType {
  new数字签到: (class_: ClassType, delaySeconds: number, 签到Id: string) => void;
  newGps签到: (class_: ClassType, delaySeconds: number, 签到Id: string) => void;
  newQrcode签到: (class_: ClassType) => void;
  new签入签出签到: (class_: ClassType, delaySeconds: number, 签到Id: string) => void;
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
  incoming互动答题: (class_: ClassType) => void;
}

export interface UserType {
  friendlyName: string;
  username: string;
  password: string;
}

export interface ClassType {
  friendlyName: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  latitude?: string;
  longitude?: string;
}

export interface CredentialType {
  friendlyName: string;
  token: string;
}

export interface 签到HistoryType {
  type: string;
  data: {
    // class_ 为 null，表示有用户在程序发现新二维码签到之前，就已经提交了二维码；这个情况应该仅可能发生在二维码签到时
    class_: ClassType | null;
    delaySeconds?: number;
    签到Id?: string;
  };
  results?: 签到HistoryResultType[];
}

export interface 签到HistoryResultType {
  type: string;
  data: {
    friendlyName: string;
    failureMessage?: string;
  };
}
