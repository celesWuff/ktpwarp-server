import { UserType, ClassType } from "./types"; // 别动这一行
export const CONFIG_VERSION = 2; // 这行也别动

////////////////////// ktpwarp-server 系统设置 //////////////////////

// WebSocket 服务器端口
// ktpwarp-web 与 Android app 等都将通过此方式通信
export const WEBSOCKET_SERVER_PORT = 11451;

// 开启 TLS（HTTPS），若要通过 HTTPS 的 ktpwarp-web 访问，则必须配置此项
// 你也可以使用 nginx 等反向代理服务器来实现 HTTPS
export const WEBSOCKET_ENABLE_TLS = false;
export const TLS_CERT_PATH = "/path/to/cert.pem";
export const TLS_KEY_PATH = "/path/to/key.pem";

// WebSocket 服务器路径
// 例如，此处设置为 "/hunter2" 且使用 TLS，则在 ktpwarp-web（或其他访问方式）填写的地址形如 "wss://example.com:11451/hunter2"
// 不使用 TLS 时，则使用 "ws://..." 形式

// 如果使用 nginx 等反向代理服务器，也需要在 nginx 配置文件中设置相同的路径
// 如果不需要设置路径，可以将此值设置为 "/"，但最好不要这么做
// 强烈建议将此值设置为一个难以猜测的字符串，相当于登录密码
export const WEBSOCKET_SERVER_PATH = "/kfccrazythursdayvme50";

// 启用 Telegram 机器人
// 如果不需要 Telegram 机器人功能，请将此值设置为 false
export const ENABLE_TELEGRAM_BOT = true;

// Telegram 机器人 Token
export const TELEGRAM_BOT_TOKEN = "4567890123:ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Telegram 机器人接收消息的群组或用户 ID
export const TELEGRAM_CHAT_ID = 1234567890;

// Telegram 机器人隐私模式：设置为 true 时，机器人仅会响应白名单内的群组或用户
export const TELEGRAM_BOT_PRIVACY_MODE = true;
export const TELEGRAM_BOT_PRIVACY_MODE_WHITELIST = [
  // 上方的 TELEGRAM_CHAT_ID 会被自动添加到白名单中
  9876543210, -1001234567890,
];

// 将二维码提交给 Telegram 机器人时，是否让机器人回应不是课堂派二维码的图片
// 设置为 true，机器人会发送“不是课堂派二维码”和“无法识别二维码”两种消息
// 如果您的机器人所在的群仅用来收发签到消息，并且您想要观察机器人是否接收到了图片，那么可以开启这个选项
export const TELEGRAM_BOT_REPLY_INVALID_QRCODE = false;

// Telegram 机器人 API URL，可以将此值设置为 Telegram Bot API 反向代理服务器的地址
// 如果部署 ktpwarp-server 的网络环境可以直接访问 Telegram Bot API，则不需要修改此值
export const TELEGRAM_BOT_API_URL = "https://api.telegram.org";

////////////////////// 用户设置 //////////////////////

// 用户信息，可以添加多个用户
// 可以使用手机号码、邮箱地址，或“ktp”开头的账号名字作为用户名

// 注意，第一个用户将被用于监测签到，因此需要保证第一个用户的课程是完整的（即：第二位及以后的用户所加入的课程，必须是第一位用户所加入的课程的子集）
// 存在特殊情况：若某一门课进行二维码签到，则原本不在该课程内的用户，在执行二维码签到后会被加入该课程；其他类型的签到不受影响，签到不会生效，也不会被加入到对应课程
export const USERS: UserType[] = [
  {
    friendlyName: "学生的名字，可以随便设置一个，不需要严格与实际名字一致，这个名字会出现在签到结果的播报中",
    username: "ktp0123456789",
    password: "password123",
  },
  {
    friendlyName: "另一个学生",
    username: "13800138000",
    password: "hunter2",
  },
];

////////////////////// 签到任务设置 //////////////////////

// 设置需要监测签到的课程
export const CLASSES: ClassType[] = [
  {
    // 课程名字，可以随便设置一个，不一定要严格与实际名字一致，这个名字会出现在签到结果的播报中
    friendlyName: "摸鱼学导论",

    // 课程 ID，可以在课程页面的 URL 中找到
    classId: "MDAwMDAwMDAwMLOGvZAAAAAAAAAyoQ",

    // 课程在星期几上课，0 代表星期日，1 代表星期一，以此类推
    dayOfWeek: 1,

    // 课程监测的开始时间，格式为“时:分”，例如“8:00”，使用 24 小时制
    // 建议将此值设置为课程开始时间之前的 5 至 10 分钟，例如 8:10 开始的课程可以设置为 8:00
    startTime: "8:00",

    // 课程监测的结束时间
    // 建议将此值设置为课程结束时间之后的 5 至 10 分钟
    endTime: "9:50",

    // 用于 GPS 签到的经纬度
    latitude: "39.90403",
    longitude: "116.40753",
  },
  {
    // 一个不设置经纬度的例子，会使用默认经纬度进行 GPS 签到
    friendlyName: "划水学原理",
    classId: "MDAwMDAwMDAwMLOGvZBBBBBBBBByoQ",
    dayOfWeek: 1,
    // 时间不能和其他课程重叠，即一门课程的开始时间必须晚于上一门课程的结束时间
    startTime: "9:51",
    endTime: "10:50",
  },
];

// GPS 签到的默认经纬度，如果某个签到任务没有单独设置经纬度，则使用此值
export const DEFAULT_LATITUDE = "31.230416";
export const DEFAULT_LONGITUDE = "121.473701";

// 监测签到的时间间隔，单位为秒
export const 签到_CHECK_INTERVAL_SECONDS = 15;

// 数字签到、GPS 签到、签入签出签到，随机延迟时间的最小与最大值，单位为秒
export const MIN_DELAY_SECONDS = 15;
export const MAX_DELAY_SECONDS = 45;

// 模拟 IP 地址：为避免签到出现“IP 地址冲突”，将使用此值作为签到 IP 地址的前缀，后面会随机生成一个 1 至 254 的数字
// 例如，如果此值为“58.32.12.”，则课堂派实际记录的签到 IP 地址为 58.32.12.1 至 58.32.12.254 之间的一个，每个用户都不同
export const FAKE_IP_PREFIX = [
  "58.32.12.",
  "103.28.212.",
  "202.101.31.",
  "124.74.9.",
]; // 您可以添加多个 IP 地址前缀，程序会随机选择一个，并且会优先选择不重复的；IP 地址前缀数量应不少于用户数量

////////////////////// 互动答题设置 //////////////////////

// 启用互动答题监测
// 请注意，只能监测并播报是否有新的互动答题出现，不能自动答题
export const ENABLE_互动答题_CHECK = false;

// 互动答题监测间隔，单位为秒
export const 互动答题_CHECK_INTERVAL_SECONDS = 15;

// 在监测到互动答题后，等待多长时间后再重新开始监测，单位为秒
export const 互动答题_CHECK_DELAY_SECONDS = 300;
