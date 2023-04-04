# ktpwarp-server

ktpWarp: 课堂派自动签到

特色：

- 无需再忍受课堂派公众号每次近 10 MB 的资源文件加载

- 自动完成数字签到、GPS 签到、签入签出签到，无需人工干预

- 针对二维码签到的高效缓解措施

- 自动采集新加入的课程，仅需进行一次重启

- 支持多用户

- 支持监测互动答题

- 通过 Telegram 机器人、Web 网页前端、iOS MITM 模块与 Android app 与服务器进行交互，可接收签到结果广播，也可进行提交二维码、手动检查、跳过签到等待时间和取消签到等操作

  - Telegram 机器人：已包含在本项目中

  - Web 客户端：[ktpwarp-web](https://github.com/celesWuff/ktpwarp-web)

  - iOS MITM 模块（重定向课堂派扫码结果到 ktpWarp）：[ktpwarp-ios-mitm](https://github.com/celesWuff/ktpwarp-ios-mitm)

  - Android app：[ktpwarp-android](https://github.com/celesWuff/ktpwarp-android)

## 注意

ktpWarp 仍处于 Beta 阶段，这代表 ktpWarp 尚未在生产环境中得到大规模的验证。

因此，ktpWarp 仍可能存在着未知的 Bug 或签到“脱靶”。如果您发现了 Bug，欢迎您在 Issues 中报告。

## 限制

课堂派的二维码签到使用了一个疑似 HMAC-SHA1 的签名来验证签到二维码的有效期，因此 ktpWarp 无法自主完成二维码签到，也不能通过已过期的二维码进行签到。

但是，您可以使用上面列出的任何一种交互方式进行签到，仅需进行一次扫码即可为 ktpWarp 系统中的所有用户签到。

Android app 的扫码速度最快，而 iOS MITM 模块可以让您自行选择任何一种扫码工具，您可以使用您手上最快的扫码器，因此首先推荐使用这两种方式。

## 部署

1. 安装 Node.js 18 或更高版本

2. 运行 `corepack enable`，如果您熟悉 Node.js，也可以选择您喜欢的方式使用 pnpm，或其他包管理器

3. 将 `config.example.ts` 重命名为 `config.ts` 并修改其中的配置

3. 运行 `pnpm install`

4. 运行 `pnpm start` 启动

5. 运行 `pnpm stop` 停止

## 名字

ktpWarp 是整个项目的名称，包括了 ktpwarp-server、ktpwarp-web、ktpwarp-ios-mitm 和 ktpwarp-android。

ktpwarp-server 是 ktpWarp 项目的核心，它负责与课堂派进行交互，完成签到，它也配备了充当客户端的 Telegram 机器人，供用户进行操作。

其余三个项目均为 ktpwarp-server 的客户端。

ktpwarp-web 是 ktpWarp 项目的 Web 前端，它负责与 ktpwarp-server 交互，提供 Web 界面，您也可以在浏览器中打开 ktpwarp-web 来进行扫码，但速度不如另外两个。

ktpwarp-ios-mitm 是 ktpWarp 项目的 iOS MITM 脚本，它负责将您扫描到的每一个课堂派签到二维码重定向给 ktpwarp-server，同时也提供 Web 界面。

ktpwarp-android 是 ktpWarp 项目的 Android app，它能够直接进行扫码并将结果提交给 ktpwarp-server，同时提供 Android 界面。

## 许可证

MIT License
