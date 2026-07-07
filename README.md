# 手势控制宇宙探索器 🌌

一个使用手势控制的 3D 宇宙探索网页应用。

## 功能特点

- 🎮 **手势控制**：通过摄像头识别最多两只手来控制 3D 宇宙场景
- 🌟 **沉浸式宇宙**：星星、星云、银河、星系、粒子等多种宇宙元素
- 🖐️ **实时手部追踪**：显示手部骨架，包括关节和连接线
- 🎯 **直观操作**：张开、合拢、单手捏合拖动、双手捏合 3D 控制、任意手指指向等自然手势
- 🪐 **天体视角**：点击太阳或行星进入对应视角，也可以一键回到全宇宙

## 控制说明

| 手势 | 功能 |
|------|------|
| 任意手指指向左/右 | 场景持续横向旋转 |
| 任意手指指向上/下 | 场景持续纵向旋转 |
| 拇指食指捏合并移动 | 整个场景跟随捏合点上下左右拖动 |
| 两只手同时拇食捏合 | 中点移动控制平移；双手拉开/靠近控制远近；双手扭转控制 3D 旋转 |
| 手掌张开 | 持续放大（向宇宙深处靠近） |
| 握拳或五指合拢 | 优先持续缩小（从宇宙深处后退） |
| 手势保持 | 动作持续；手势停止后动作停止 |

## 视角说明

| 操作 | 功能 |
|------|------|
| 点击太阳或行星 | 相机进入该天体视角 |
| 点击左下角视角按钮 | 直接切换到太阳、行星或全宇宙 |
| 进入天体视角后继续做手势 | 在当前视角下继续缩放、旋转、拖动 |

## 技术栈

- **Three.js** - 3D 渲染引擎
- **MediaPipe Hands** - 手部识别和追踪
- **原生 HTML/CSS/JavaScript** - 无框架依赖

## 文件结构

```
手势操作/
├── index.html          # 主页面
├── main.js             # 主入口，初始化和协调
├── universeScene.js    # 3D 宇宙场景
├── server.js           # 本地静态服务器
├── start.html          # 跳转到主页面的兼容入口
├── vercel.json         # Vercel 静态站点配置
├── .gitignore          # Git 忽略规则
└── README.md           # 说明文档
```

## 使用方法

### 方法一：直接打开

1. 双击 `index.html` 文件
2. 允许浏览器访问摄像头
3. 开始使用手势探索宇宙！

### 方法二：使用本地服务器（推荐）

由于浏览器安全限制，建议使用本地服务器运行：

**使用 Python：**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**使用 Node.js：**
```bash
node server.js
```

或使用任意静态服务器：

```bash
npx http-server -p 8000
```

**使用 VS Code：**
1. 安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

然后在浏览器中访问 `http://localhost:8000`

## 浏览器兼容性

推荐使用以下浏览器：
- Google Chrome（推荐）
- Microsoft Edge
- Firefox

## 注意事项

1. **摄像头权限**：首次使用需要允许浏览器访问摄像头
2. **光线条件**：确保手部有足够的光线，便于识别
3. **手部位置**：将手放在摄像头画面中央，距离适中
4. **网络连接**：首次加载需要下载 MediaPipe 模型文件

## 界面说明

- **左上角状态面板**：显示摄像头状态、手部识别状态、手势状态、当前视角、缩放等级、旋转速度和帧率
- **左下角视角按钮**：切换全宇宙、太阳和各个行星视角
- **右下角摄像头画面**：显示实时摄像头画面和手部骨架
- **3D 宇宙场景**：占据整个屏幕，响应手势控制

## 自定义配置

### 调整灵敏度

在 `main.js` 中修改 `CONTROL`：
```javascript
rotationSensitivity: 8.5,
rotationSmoothing: 0.48,
zoomSpeed: 1.25
```

### 调整手势识别阈值

在 `main.js` 中修改：
```javascript
openThreshold: 1.02,
closedThreshold: 0.72,
openPalmMinLongFingers: 3,
openPalmSpreadThreshold: 0.23,
openPalmThumbGapThreshold: 0.44,
closedHandCurledFingers: 4,
closedHandOpennessThreshold: 0.88,
closedFingerClusterThreshold: 0.42,
closedTipPalmThreshold: 0.72,
closedTipBaseThreshold: 0.58,
pinchCloseThreshold: 0.38,
pinchReleaseThreshold: 0.52,
panSensitivity: 1250,
twoHandZoomSensitivity: 5.8,
twoHandRollSensitivity: 1.25,
pointDeadzone: 0.18
```

### 调整宇宙场景

在 `universeScene.js` 中修改：
```javascript
// 星星数量
const starCount = 5000;

// 星云数量
for (let i = 0; i < 4; i++) {

// 银河系粒子数量
const galaxyParticleCount = 10000;
```

## 故障排除

### 摄像头无法打开
- 检查浏览器是否有摄像头权限
- 确认没有其他应用占用摄像头
- 尝试使用 HTTPS 连接（某些浏览器要求）

### 手势识别不准确
- 确保手部光线充足
- 将手放在摄像头画面中央
- 避免背景过于复杂
- 尝试调整识别阈值

### 3D 场景卡顿
- 降低粒子数量
- 关闭浏览器其他标签页
- 使用性能更好的设备

## 开发者

本项目使用纯原生技术开发，无需构建工具，可直接在浏览器中运行。

## 部署

项目是静态站点，可直接部署到 Vercel：

```bash
vercel --prod
```

部署后通过 HTTPS 访问，浏览器才能正常授予摄像头权限。

## 许可证

MIT License
