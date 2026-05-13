# Wander 项目交接文档

Wander 是一个 Chrome New Tab 插件。它会从用户的 Chrome 书签里随机抽取 6 个网页，并以 editorial collage 的方式展示出来。这个项目适合作为一个 vibe coding 小项目放到个人网站上展示，也可以打包成 zip 让别人下载、手动安装。

当前代码没有构建流程，也没有依赖。插件目录里的文件可以直接作为 Chrome unpacked extension 加载。

## 当前文件结构

```text
bookmark-newtab/
  manifest.json
  newtab.html
  newtab.js
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
    wander-mark.svg
  WANDER_HANDOFF.md
```

核心文件只有三个：

- `manifest.json`：Chrome extension 配置，声明 New Tab override、书签权限和插件图标。
- `newtab.html`：页面结构、样式、版式模板和动效。
- `newtab.js`：读取书签、随机抽取、渲染卡片、处理 shuffle 动效。

`icons/` 里是插件图标资源，已经被 `manifest.json` 引用。

## 功能范围

当前版本做了这些事：

- 覆盖 Chrome New Tab 页面。
- 读取 Chrome bookmarks。
- 从全部书签中随机抽取 6 个。
- 展示标题、文件夹、域名和一个基于域名首字母的小标记。
- 用 4 套不同的 editorial spread 模板显示这 6 个书签。
- 点击 Shuffle 时重新抽取并重新排版。
- 点击书签后在当前标签页打开目标网页。
- 插件没有联网抓取网页描述，也没有远程字体、远程图片或第三方依赖。

当前版本没有做这些事：

- 不提供搜索框。
- 不支持固定某个书签。
- 不支持只随机某个文件夹。
- 不抓取网页 meta description。
- 不记录用户历史。
- 不向服务器上传任何数据。

Chrome Bookmarks API 本身不提供网页 description。如果以后要加网页描述，需要新增 host 权限并 fetch 目标网页，这会带来权限提示、速度、跨域失败和隐私解释成本。除非明确要做，不建议默认加入。

## 本地测试方式

在 Chrome 里测试：

1. 打开 `chrome://extensions/`。
2. 打开右上角 Developer mode。
3. 点击 Load unpacked。
4. 选择 `bookmark-newtab/` 这个文件夹。
5. 打开一个新标签页，看是否显示 Wander 页面。

修改代码后，如果 Chrome 没有自动更新：

1. 回到 `chrome://extensions/`。
2. 找到 Wander。
3. 点击 reload。
4. 再打开新标签页测试。

直接打开 `newtab.html` 也能看到 mock 数据预览。真实书签只会在 Chrome extension 环境里读取。

## 放进网站项目

如果要把它放到另一个网站项目里，建议把整个插件目录作为一个独立子目录，不要把 `newtab.html`、`newtab.js`、`manifest.json` 拆散到网站源码里。

推荐结构：

```text
your-website/
  public/
    downloads/
      wander-extension.zip
  projects/
    wander/
      manifest.json
      newtab.html
      newtab.js
      icons/
      WANDER_HANDOFF.md
```

如果网站项目没有 `projects/` 目录，也可以放在：

```text
your-website/
  apps/
    wander/
```

或：

```text
your-website/
  content/
    projects/
      wander/
```

关键原则是：插件源码目录保持完整，下载包放到网站的公开静态资源目录里。

## 打包 zip

在 `bookmark-newtab/` 的上一级目录执行 PowerShell：

```powershell
Compress-Archive -Path .\bookmark-newtab\manifest.json, .\bookmark-newtab\newtab.html, .\bookmark-newtab\newtab.js, .\bookmark-newtab\icons -DestinationPath .\wander-extension.zip -Force
```

如果当前就在 `bookmark-newtab/` 目录里执行：

```powershell
Compress-Archive -Path .\manifest.json, .\newtab.html, .\newtab.js, .\icons -DestinationPath .\wander-extension.zip -Force
```

打包后可以把 `wander-extension.zip` 放到网站的静态资源目录，比如：

```text
public/downloads/wander-extension.zip
```

网站页面上可以提供一个下载链接：

```html
<a href="/downloads/wander-extension.zip" download>Download Wander for Chrome</a>
```

用户下载 zip 后需要解压，再用 Chrome 的 Load unpacked 加载解压后的文件夹。Chrome 不支持直接安装普通 zip 文件，除非发布到 Chrome Web Store 或做成 `.crx`，所以网站文案里要写清楚这一点。

## 网站展示页建议

网站上展示这个项目时，可以写清楚三件事：

- 它解决的问题：书签收藏后容易被忘掉，Wander 让这些旧链接重新出现在每天打开的新标签页。
- 它的使用方式：每次打开 New Tab 随机展示 6 个书签，点击 Shuffle 可以重新洗牌。
- 它的隐私边界：只读取本地 Chrome 书签，不上传数据，不抓网页内容。

可以使用这样的项目介绍：

```text
Wander is a Chrome New Tab extension that resurfaces forgotten bookmarks. Every new tab becomes a quiet editorial spread of six saved links, loosely arranged so old references can show up again while you work.
```

中文版本：

```text
Wander 是一个 Chrome New Tab 插件。它会从你的书签里随机抽取 6 个网页，用杂志拼贴式的排版展示出来，让那些收藏后被忘掉的链接重新出现。
```

## 给 Codex / GPT 5.5 的操作说明

如果后续 Codex 或 GPT 5.5 要继续维护这个插件，请先读这几个文件：

1. `manifest.json`
2. `newtab.html`
3. `newtab.js`
4. `WANDER_HANDOFF.md`

修改前先确认目标是哪一类：

- 视觉调整：主要改 `newtab.html` 里的 CSS。
- 随机逻辑、版式选择、shuffle 行为：主要改 `newtab.js`。
- 插件名称、权限、图标、New Tab override：改 `manifest.json`。
- 图标资源：改 `icons/`。

不要默认新增构建工具。这个项目目前是纯静态 Chrome extension，保持无依赖会更方便别人下载、解压和加载。

不要默认新增权限。现在只有：

```json
"permissions": ["bookmarks"]
```

如果新增 `host_permissions` 或网络抓取，需要同步更新网站说明，解释为什么需要更多权限。

## 当前设计边界

页面设计方向是安静的 editorial bookmark collage。整体是暖纸张底色、serif 标题、不规则但外边界齐平的 6 块矩形。6 个书签内部可以有不同长宽比例，但组合起来必须形成一个大的长方形，外侧上、下、左、右四条边要齐平。

Shuffle 动效的边界：

- 可以有切牌、发牌、轻微位移动画。
- 不要让卡片最终停在旋转、漂移或缩放后的状态。
- 最终静止状态必须边界齐平。
- 不要让同一次 shuffle 触发两轮卡片刷新。

已有验证点：

- `node --check newtab.js`
- Chrome 本地加载 extension。
- 桌面宽度检查：6 张卡片组成一个外边界齐平的大矩形。
- 移动宽度检查：375px 下不能出现水平溢出。
- Shuffle 检查：点击一次只产生一次发牌动画，不出现二次闪烁。

## 发布前检查

每次准备把 zip 放到网站前，按这个顺序检查：

1. Chrome 能通过 Load unpacked 加载插件。
2. 打开新标签页能看到真实书签。
3. 点击 5 次 Shuffle，没有重复闪烁。
4. 6 张卡片整体边界齐平。
5. 点击任意书签，会在当前标签页打开目标网页。
6. `manifest.json` 里的插件名、版本号和图标路径正确。
7. zip 里包含 `manifest.json`、`newtab.html`、`newtab.js` 和 `icons/`。

版本号在 `manifest.json` 里：

```json
"version": "1.0"
```

如果只是网站文案更新，不需要改版本号。如果插件行为、视觉或权限有变化，建议递增版本号。

