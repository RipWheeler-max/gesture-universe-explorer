/**
 * 手势控制宇宙探索器 - 主程序
 * 优化为游戏级响应速度
 */

// ==================== DOM 元素 ====================
const universeContainer = document.getElementById('universe-container');
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');

const cameraStatus = document.getElementById('camera-status');
const handStatus = document.getElementById('hand-status');
const grabStatus = document.getElementById('grab-status');
const zoomLevelDisplay = document.getElementById('zoom-level');
const rotationSpeedDisplay = document.getElementById('rotation-speed');
const fpsCounter = document.getElementById('fps-counter');

// ==================== 全局状态 ====================
let universeScene = null;
let isHandDetected = false;

// 手部数据
let currentLandmarks = null;
let prevLandmarks = null;

// 控制参数 - 连续输入，低延迟但保留一点抗抖
let rotationVelocity = { x: 0, y: 0 };
let smoothedRotation = { x: 0, y: 0 };
let currentZoom = 1.0;
let targetZoom = 1.0;
let lastGestureTime = performance.now();
let isPinchDragging = false;
let lastPinchPoint = null;
let isTwoHandPinching = false;
let lastTwoHandGesture = null;

const CONTROL = {
    minZoom: 0.35,
    maxZoom: 3.2,
    zoomSpeed: 1.25,
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
    pointDeadzone: 0.18,
    rotationSensitivity: 8.5,
    rotationSmoothing: 0.48
};

const FINGER_DEFS = [
    { name: '拇指', tip: 4, base: 2, joint: 3 },
    { name: '食指', tip: 8, base: 5, joint: 6 },
    { name: '中指', tip: 12, base: 9, joint: 10 },
    { name: '无名指', tip: 16, base: 13, joint: 14 },
    { name: '小指', tip: 20, base: 17, joint: 18 }
];

// FPS
let frameCount = 0;
let lastFpsTime = performance.now();

// ==================== 初始化 ====================
async function init() {
    try {
        updateLoading('正在创建 3D 宇宙场景...');
        universeScene = new UniverseScene(universeContainer);
        universeScene.start();
        updateFps();
        await delay(300);

        if (new URLSearchParams(window.location.search).get('demo') === '1') {
            cameraStatus.textContent = '演示模式';
            cameraStatus.classList.add('warning');
            handStatus.textContent = '未启用摄像头';
            grabStatus.textContent = '3D 场景预览';
            loadingScreen.classList.add('hidden');
            return;
        }

        updateLoading('正在加载手部识别模型...');
        await initMediaPipe();
    } catch (error) {
        console.error('初始化失败:', error);
        updateLoading('失败: ' + error.message);
        setTimeout(() => loadingScreen.classList.add('hidden'), 2000);
    }
}

// ==================== MediaPipe 初始化 ====================
async function initMediaPipe() {
    canvasElement.width = 640;
    canvasElement.height = 480;

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,  // 高精度模式
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);

    updateLoading('正在请求摄像头权限...');

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        facingMode: 'user'
    });

    await camera.start();

    cameraStatus.textContent = '已连接';
    cameraStatus.classList.add('active');

    loadingScreen.classList.add('hidden');
}

// ==================== 手部检测结果 ====================
function onHandResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.fillStyle = 'rgba(2, 3, 10, 0.56)';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hands = results.multiHandLandmarks.slice(0, 2);
        hands.forEach((landmarks, index) => drawHandSkeleton(landmarks, index));

        if (!isHandDetected) {
            isHandDetected = true;
            handStatus.classList.add('active');
            handStatus.classList.remove('warning');
        }
        handStatus.textContent = `已识别到 ${hands.length} 只手`;

        // 处理手势
        processGestures(hands);

        prevLandmarks = hands;
        currentLandmarks = hands;
    } else {
        if (isHandDetected) {
            isHandDetected = false;
            handStatus.textContent = '未识别到手';
            handStatus.classList.remove('active');
            handStatus.classList.add('warning');
        }
        rotationVelocity = { x: 0, y: 0 };
        smoothedRotation.x *= 0.7;
        smoothedRotation.y *= 0.7;
        if (universeScene) {
            universeScene.setRotation(smoothedRotation.x, smoothedRotation.y);
        }
        isPinchDragging = false;
        lastPinchPoint = null;
        isTwoHandPinching = false;
        lastTwoHandGesture = null;
        grabStatus.textContent = '待命';
        grabStatus.classList.remove('active');
        currentLandmarks = null;
    }

    canvasCtx.restore();
}

function drawHandSkeleton(landmarks, handIndex) {
    const connectorColor = handIndex === 0 ? 'rgba(134, 248, 255, 0.82)' : 'rgba(255, 210, 138, 0.82)';
    const pointColor = handIndex === 0 ? '#86f8ff' : '#ffd28a';

    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: connectorColor,
        lineWidth: 2.5
    });
    drawLandmarks(canvasCtx, landmarks, {
        color: pointColor,
        lineWidth: 1,
        radius: 3
    });

    [4, 8].forEach(idx => {
        const p = landmarks[idx];
        canvasCtx.beginPath();
        canvasCtx.arc(p.x * canvasElement.width, p.y * canvasElement.height, 7, 0, Math.PI * 2);
        canvasCtx.fillStyle = pointColor;
        canvasCtx.shadowColor = pointColor;
        canvasCtx.shadowBlur = 12;
        canvasCtx.fill();
        canvasCtx.shadowBlur = 0;
    });
}

// ==================== 核心手势处理 - 游戏级响应 ====================
function processGestures(handLandmarksList) {
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.008, (now - lastGestureTime) / 1000));
    lastGestureTime = now;
    const handStates = handLandmarksList.map(getHandState);
    const pinchThreshold = (isPinchDragging || isTwoHandPinching)
        ? CONTROL.pinchReleaseThreshold
        : CONTROL.pinchCloseThreshold;
    const pinchedHands = handStates.filter(hand => hand.isPinchGesture && hand.pinchDistance <= pinchThreshold);

    if (pinchedHands.length >= 2) {
        handleTwoHandPinch(pinchedHands[0], pinchedHands[1]);
        updateSceneAndHud();
        return;
    }

    isTwoHandPinching = false;
    lastTwoHandGesture = null;

    if (pinchedHands.length === 1) {
        handlePinchDrag(pinchedHands[0].pinchPoint);
        updateSceneAndHud();
        return;
    }

    const closedHand = handStates.find(hand => hand.isClosedHand);
    if (closedHand) {
        handleClosedHandShrink(dt);
        updateSceneAndHud();
        return;
    }

    isPinchDragging = false;
    lastPinchPoint = null;

    const primaryHand = handStates.find(hand => hand.isOpenPalm) || handStates[0];
    processOpenCloseAndPointing(primaryHand, dt);
    updateSceneAndHud();
}

function getHandState(landmarks) {
    // 手掌中心（使用多个点平均，更稳定）
    const wrist = landmarks[0];
    const palmCenter = {
        x: (wrist.x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5,
        y: (wrist.y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5,
        z: (wrist.z + landmarks[5].z + landmarks[9].z + landmarks[13].z + landmarks[17].z) / 5
    };

    const palmSize = Math.max(
        getDistance3D(landmarks[5], landmarks[17]),
        getDistance3D(wrist, landmarks[9]),
        0.001
    );

    const handOpenness = getHandOpenness(landmarks, palmCenter, palmSize);
    const openFingers = getOpenFingerCount(landmarks, palmSize);
    const pinchDistance = getDistance3D(landmarks[4], landmarks[8]) / palmSize;
    const pinchPoint = getMidpoint(landmarks[4], landmarks[8]);
    const isOpenPalm = getOpenPalmState(landmarks, palmCenter, palmSize, handOpenness, openFingers, pinchDistance);
    const isClosedHand = getClosedHandState(landmarks, palmCenter, palmSize, handOpenness, openFingers, pinchDistance);
    const isPinchGesture = pinchDistance <= CONTROL.pinchReleaseThreshold && !isClosedHand;

    return {
        landmarks,
        palmCenter,
        palmSize,
        handOpenness,
        openFingers,
        pinchDistance,
        pinchPoint,
        isOpenPalm,
        isClosedHand,
        isPinchGesture
    };
}

function processOpenCloseAndPointing(hand, dt) {
    if (!hand) return;

    const pointing = getPointingVector(hand.landmarks, hand.palmSize, hand.openFingers, hand.isOpenPalm || hand.isClosedHand);
    rotationVelocity.x = pointing.x * CONTROL.rotationSensitivity;
    rotationVelocity.y = pointing.y * CONTROL.rotationSensitivity;
    smoothedRotation.x += (rotationVelocity.x - smoothedRotation.x) * CONTROL.rotationSmoothing;
    smoothedRotation.y += (rotationVelocity.y - smoothedRotation.y) * CONTROL.rotationSmoothing;

    let zoomDirection = 0;

    if (hand.isOpenPalm) {
        zoomDirection = 1;
        grabStatus.textContent = '放大中 · 张开手';
        grabStatus.classList.add('active');
    } else if (hand.isClosedHand || (hand.handOpenness <= CONTROL.closedThreshold && pointing.label === '指向待命')) {
        zoomDirection = -1;
        grabStatus.textContent = '缩小中 · 握拳';
        grabStatus.classList.add('active');
    } else {
        grabStatus.textContent = pointing.label;
        grabStatus.classList.remove('active');
    }

    if (zoomDirection !== 0) {
        targetZoom = clamp(
            targetZoom + zoomDirection * CONTROL.zoomSpeed * dt,
            CONTROL.minZoom,
            CONTROL.maxZoom
        );
    }
}

function updateSceneAndHud() {
    currentZoom += (targetZoom - currentZoom) * 0.42;

    if (universeScene) {
        universeScene.setRotation(smoothedRotation.x, smoothedRotation.y);
        universeScene.setZoom(currentZoom);
    }

    zoomLevelDisplay.textContent = currentZoom.toFixed(1) + 'x';
    rotationSpeedDisplay.textContent = Math.sqrt(smoothedRotation.x ** 2 + smoothedRotation.y ** 2).toFixed(1);
}

// ==================== 工具函数 ====================
function getDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getDistance3D(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function getMidpoint(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: ((a.z || 0) + (b.z || 0)) / 2
    };
}

function handlePinchDrag(pinchPoint) {
    isTwoHandPinching = false;
    lastTwoHandGesture = null;
    rotationVelocity = { x: 0, y: 0 };
    smoothedRotation.x *= 0.36;
    smoothedRotation.y *= 0.36;

    if (!isPinchDragging || !lastPinchPoint) {
        isPinchDragging = true;
        lastPinchPoint = pinchPoint;
        grabStatus.textContent = '拖动中 · 捏合移动';
        grabStatus.classList.add('active');
        return;
    }

    const dx = pinchPoint.x - lastPinchPoint.x;
    const dy = pinchPoint.y - lastPinchPoint.y;
    const zoomScale = 1 / Math.sqrt(currentZoom);

    if (universeScene) {
        // 摄像头预览是镜像显示；横向取反后，场景会跟随用户看到的手指方向移动。
        universeScene.addPan(
            -dx * CONTROL.panSensitivity * zoomScale,
            -dy * CONTROL.panSensitivity * zoomScale
        );
    }

    lastPinchPoint = pinchPoint;
    grabStatus.textContent = '拖动中 · 捏合移动';
    grabStatus.classList.add('active');
}

function handleClosedHandShrink(dt) {
    isPinchDragging = false;
    lastPinchPoint = null;
    isTwoHandPinching = false;
    lastTwoHandGesture = null;
    rotationVelocity = { x: 0, y: 0 };
    smoothedRotation.x *= 0.28;
    smoothedRotation.y *= 0.28;
    targetZoom = clamp(
        targetZoom - CONTROL.zoomSpeed * dt,
        CONTROL.minZoom,
        CONTROL.maxZoom
    );
    grabStatus.textContent = '缩小中 · 握拳';
    grabStatus.classList.add('active');
}

function handleTwoHandPinch(handA, handB) {
    isPinchDragging = false;
    lastPinchPoint = null;
    rotationVelocity = { x: 0, y: 0 };
    smoothedRotation.x *= 0.24;
    smoothedRotation.y *= 0.24;

    const gesture = getTwoHandGesture(handA.pinchPoint, handB.pinchPoint);

    if (!isTwoHandPinching || !lastTwoHandGesture) {
        isTwoHandPinching = true;
        lastTwoHandGesture = gesture;
        grabStatus.textContent = '3D 控制中 · 双手捏合';
        grabStatus.classList.add('active');
        return;
    }

    const dx = gesture.center.x - lastTwoHandGesture.center.x;
    const dy = gesture.center.y - lastTwoHandGesture.center.y;
    const distanceDelta = gesture.distance - lastTwoHandGesture.distance;
    const angleDelta = normalizeAngle(gesture.angle - lastTwoHandGesture.angle);
    const zoomScale = 1 / Math.sqrt(currentZoom);

    if (universeScene) {
        universeScene.addPan(
            -dx * CONTROL.panSensitivity * zoomScale,
            -dy * CONTROL.panSensitivity * zoomScale
        );
        universeScene.addManualRotation(0, 0, -angleDelta * CONTROL.twoHandRollSensitivity);
    }

    if (Math.abs(distanceDelta) > 0.002) {
        targetZoom = clamp(
            targetZoom + distanceDelta * CONTROL.twoHandZoomSensitivity,
            CONTROL.minZoom,
            CONTROL.maxZoom
        );
    }

    lastTwoHandGesture = gesture;
    grabStatus.textContent = '3D 控制中 · 双手捏合';
    grabStatus.classList.add('active');
}

function getTwoHandGesture(pointA, pointB) {
    const center = getMidpoint(pointA, pointB);
    return {
        center,
        distance: getDistance(pointA, pointB),
        angle: Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x)
    };
}

function normalizeAngle(angle) {
    let value = angle;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
}

function getHandOpenness(landmarks, palmCenter, palmSize) {
    const spread = FINGER_DEFS.reduce((sum, finger) => {
        return sum + getDistance3D(landmarks[finger.tip], palmCenter);
    }, 0);
    return spread / FINGER_DEFS.length / palmSize;
}

function getOpenFingerCount(landmarks, palmSize) {
    return FINGER_DEFS.filter(finger => {
        const tip = landmarks[finger.tip];
        const base = landmarks[finger.base];
        const joint = landmarks[finger.joint];
        const extension = getDistance3D(tip, base) / palmSize;
        const curl = getDistance3D(tip, base) / Math.max(getDistance3D(joint, base), 0.001);
        return extension > 0.72 && curl > 1.25;
    }).length;
}

function getOpenPalmState(landmarks, palmCenter, palmSize, handOpenness, openFingers, pinchDistance) {
    const longFingers = [
        { tip: 8, base: 5 },
        { tip: 12, base: 9 },
        { tip: 16, base: 13 },
        { tip: 20, base: 17 }
    ];

    const longExtended = longFingers.filter(finger => {
        const tip = landmarks[finger.tip];
        const base = landmarks[finger.base];
        const tipFromBase = getDistance3D(tip, base) / palmSize;
        const tipFromPalm = getDistance3D(tip, palmCenter) / palmSize;
        return tipFromBase > 0.66 && tipFromPalm > 0.7;
    }).length;

    const fingerSpread = (
        getDistance3D(landmarks[8], landmarks[12]) +
        getDistance3D(landmarks[12], landmarks[16]) +
        getDistance3D(landmarks[16], landmarks[20])
    ) / (3 * palmSize);

    const longFingersOpen = longExtended >= CONTROL.openPalmMinLongFingers &&
        fingerSpread >= CONTROL.openPalmSpreadThreshold &&
        pinchDistance >= CONTROL.openPalmThumbGapThreshold;

    return longFingersOpen || (openFingers >= 4 && handOpenness >= 0.86);
}

function getClosedHandState(landmarks, palmCenter, palmSize, handOpenness, openFingers, pinchDistance) {
    const longFingers = [
        { tip: 8, base: 5 },
        { tip: 12, base: 9 },
        { tip: 16, base: 13 },
        { tip: 20, base: 17 }
    ];

    const longCurled = longFingers.filter(finger => {
        const tip = landmarks[finger.tip];
        const base = landmarks[finger.base];
        const tipFromPalm = getDistance3D(tip, palmCenter) / palmSize;
        const tipFromBase = getDistance3D(tip, base) / palmSize;
        return tipFromPalm <= CONTROL.closedTipPalmThreshold &&
            tipFromBase <= CONTROL.closedTipBaseThreshold;
    }).length;

    const tips = [4, 8, 12, 16, 20].map(index => landmarks[index]);
    const centroid = {
        x: tips.reduce((sum, tip) => sum + tip.x, 0) / tips.length,
        y: tips.reduce((sum, tip) => sum + tip.y, 0) / tips.length,
        z: tips.reduce((sum, tip) => sum + (tip.z || 0), 0) / tips.length
    };
    const clusterSpread = tips.reduce((sum, tip) => sum + getDistance3D(tip, centroid), 0) / tips.length / palmSize;
    const fingersTogether = clusterSpread <= CONTROL.closedFingerClusterThreshold && pinchDistance <= 0.62;
    const compactHand = handOpenness <= CONTROL.closedHandOpennessThreshold;
    const noClearPointing = openFingers <= 1;

    return longCurled >= CONTROL.closedHandCurledFingers &&
        compactHand &&
        fingersTogether &&
        noClearPointing;
}

function getPointingVector(landmarks, palmSize, openFingers, suppressPointing = false) {
    if (suppressPointing || openFingers >= 4) {
        return { x: 0, y: 0, label: '张开手' };
    }

    let x = 0;
    let y = 0;
    let totalWeight = 0;
    const activeNames = [];

    FINGER_DEFS.forEach(finger => {
        const tip = landmarks[finger.tip];
        const base = landmarks[finger.base];
        const joint = landmarks[finger.joint];
        const baseToTip = {
            x: tip.x - base.x,
            y: tip.y - base.y
        };
        const jointToTip = {
            x: tip.x - joint.x,
            y: tip.y - joint.y
        };
        const length = Math.hypot(baseToTip.x, baseToTip.y);
        const extension = getDistance3D(tip, base) / palmSize;

        if (length < CONTROL.pointDeadzone * palmSize || extension < 0.62) return;

        const straightness = dot(normalize2D(baseToTip), normalize2D(jointToTip));
        if (straightness < 0.35) return;

        const weight = clamp((extension - 0.62) / 0.58, 0, 1) * clamp((straightness - 0.35) / 0.65, 0, 1);
        if (weight <= 0.05) return;

        const dir = normalize2D(baseToTip);
        x += dir.x * weight;
        y += dir.y * weight;
        totalWeight += weight;
        activeNames.push(finger.name);
    });

    if (totalWeight === 0) {
        return { x: 0, y: 0, label: '指向待命' };
    }

    const averaged = normalize2D({ x: x / totalWeight, y: y / totalWeight });
    const strength = clamp(totalWeight / 1.4, 0.35, 1);

    // 摄像头预览是镜像显示，横向取反后手感会和用户看到的方向一致。
    const screenX = -averaged.x;
    const screenY = averaged.y;

    return {
        x: screenX * strength,
        y: screenY * strength,
        label: `${activeNames.slice(0, 2).join('+')}指向`
    };
}

function normalize2D(v) {
    const length = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / length, y: v.y / length };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function updateLoading(msg) {
    if (loadingMessage) loadingMessage.textContent = msg;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateFps() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
        fpsCounter.textContent = Math.round(frameCount * 1000 / (now - lastFpsTime)) + ' FPS';
        frameCount = 0;
        lastFpsTime = now;
    }
    requestAnimationFrame(updateFps);
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
    if (universeScene) universeScene.onWindowResize();
});
