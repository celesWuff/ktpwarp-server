import { UserType, 互动答题ClassType, 签到ClassType } from "./types";  // 别动这一行

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
// 例如，此处设置为 "/hunter2" 且使用 TLS，则在 ktpwarp-web（或其他访问方式）填写的地址应为 "wss://example.com:11451/hunter2"
// 如果使用 nginx 等反向代理服务器，也需要在 nginx 配置文件中设置相同的路径

// 如果不需要设置路径，可以将此值设置为 "/"，但最好不要这么做
// 强烈建议将此值设置为一个难以猜测的字符串，相当于登录密码
export const WEBSOCKET_SERVER_PATH = "/kfccrazythursdayvme50";

// 启用 Telegram 机器人
// 如果不需要 Telegram 机器人功能，请将此值设置为 false
export const ENABLE_TELEGRAM_BOT = true;

// Telegram 机器人 Token
export const TELEGRAM_BOT_TOKEN = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Telegram 机器人接收消息的群组或用户 ID
export const TELEGRAM_CHAT_ID = 1234567890;

// Telegram 机器人 API URL，可以将此值设置为 Telegram Bot API 反向代理服务器的地址
// 如果部署 ktpwarp-server 的网络环境可以直接访问 Telegram Bot API，则不需要修改此值
export const TELEGRAM_BOT_API_URL = "https://api.telegram.org";

// 将二维码提交给 Telegram 机器人时，是否让机器人回应不是课堂派二维码的图片
// 设置为 true，机器人会发送“不是课堂派二维码”和“无法识别二维码”两种消息
export const TELEGRAM_BOT_REPLY_INVALID_QRCODE = false;

////////////////////// 用户设置 //////////////////////

// 用户信息，可以添加多个用户
// 可以使用手机号码或邮箱地址作为用户名
// 注意，第一个用户将被用于监测签到，因此需要保证第一个用户的课程是完整的
export const USERS: UserType[] = [
  {
    friendlyName: "学生的名字，可以随便设置一个，不需要严格与实际名字一致，这个名字会出现在签到结果的播报中",
    username: "2023114514@example.com",
    password: "password123",
  },
  {
    friendlyName: "另一个学生",
    username: "13800138000",
    password: "hunter2",
  },
];

////////////////////// 签到任务设置 //////////////////////

// 模拟 IP 地址：为避免签到出现“IP 地址冲突”，将使用此值作为签到 IP 地址的前缀，后面会随机生成一个 1 至 254 的数字
// 例如，如果此值为“58.32.12.”，则课堂派实际记录的签到 IP 地址为 58.32.12.1 至 58.32.12.254 之间的一个，每个用户都不同
export const FAKE_IP_PREFIX = "58.32.12.";

// 自动采集所有课程，作为需要监测签到的目标
// 若有新加入的课程需要监测签到，需手动重启，ktpwarp-server 不会实时监测新加入的课程
export const AUTO_FETCH_CLASSES = true;

// 如果不开启“自动采集课程”，则需要手动设置需要监测签到的课程
// 即使开启了“自动采集课程”，也可以在这里设置每门课程的经纬度和别名，这里的优先级会比自动采集更高
export const 签到_CLASSES: 签到ClassType[] = [
  {
    // 课程名字，可以随便设置一个，不一定要严格与实际名字一致，这个名字会出现在签到结果的播报中
    friendlyName: "摸鱼学导论",

    // 课程 ID，可以在课程页面的 URL 中找到
    classId: "MDAwMDAwMDAwMLOGvZAAAAAAAAAyoQ",

    // 用于 GPS 签到的经纬度
    latitude: "39.90403",
    longitude: "116.40753",
  },
  {
    // 一个不设置经纬度的例子，会使用默认经纬度进行 GPS 签到
    friendlyName: "划水学原理",
    classId: "MDAwMDAwMDAwMLOGvZBBBBBBBBByoQ",
  },
];

// 不需要监测签到的课程
// 会从“自动采集课程”的结果中忽略这些课程
// 如果没有需要忽略的课程的话，可以保持不动，下面给出的两个课程 ID 不是真实的课程 ID
export const IGNORED_CLASS_IDS: string[] = [
  "MDAwMDAwMDAwMLOGvZXXXXXXXXXyoQ",
  "MDAwMDAwMDAwMLOGvZYYYYYYYYYyoQ",
];

// GPS 签到的默认经纬度，如果某个签到任务没有单独设置经纬度，则使用此值
export const DEFAULT_LATITUDE = "31.230416";
export const DEFAULT_LONGITUDE = "121.473701";

// 数字签到、GPS 签到、签入签出签到，随机延迟时间的最小与最大值，单位为秒
export const MIN_DELAY_SECONDS = 15;
export const MAX_DELAY_SECONDS = 45;

////////////////////// 互动答题设置 //////////////////////

// 启用互动答题检查
// 请注意，只能检测并播报是否有新的互动答题出现，不能自动答题
export const ENABLE_互动答题_CHECK = false;

// 互动答题检查间隔，单位为秒
export const 互动答题_CHECK_INTERVAL_SECONDS = 15;

// 在检测到互动答题后，等待多长时间后再重新开始检测，单位为秒
export const 互动答题_CHECK_DELAY_SECONDS = 300;

// 需检测互动答题的课程
// 检测互动答题不能使用“自动采集课程”，必须手动设置
// 并且，你需要手动指定每门课的开始与结束时间，这有些麻烦，但目前只能这样
// 因此，对于你确定不会发布互动答题的课程，可以不添加
export const 互动答题_CLASSES: 互动答题ClassType[] = [
  {
    friendlyName: "摸鱼学导论",
    classId: "MDAwMDAwMDAwMLOGvZAAAAAAAAAyoQ",

    // 课程在星期几上课，0 代表星期日，1 代表星期一，以此类推
    dayOfWeek: 1,

    // 课程开始时间，格式为“时:分”，例如“8:00”，使用 24 小时制
    startTime: "8:00",

    // 课程结束时间
    endTime: "9:50",
  },
  {
    friendlyName: "划水学原理",
    classId: "MDAwMDAwMDAwMLOGvZBBBBBBBBByoQ",
    dayOfWeek: 2,
    startTime: "14:00",
    endTime: "15:50",
  },
];
