/**
 * 宇宙场景模块
 * 游戏级响应速度
 */

class UniverseScene {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sceneRoot = null;
        this.raycaster = null;
        this.pointer = null;
        this.clickableTargets = [];
        this.viewTargets = new Map();
        this.activeView = null;
        this.lookTarget = new THREE.Vector3(0, 0, 0);
        this.targetWorldPosition = new THREE.Vector3(0, 0, 0);

        // 控制参数
        this.rotationSpeed = { x: 0, y: 0 };
        this.zoomLevel = 1.0;
        this.panTarget = { x: 0, y: 0 };
        this.panCurrent = { x: 0, y: 0 };

        // 宇宙元素
        this.stars = null;
        this.nebulae = [];
        this.galaxy = null;
        this.particles = null;
        this.dustCloud = null;
        this.core = null;
        this.planets = [];
        this.comets = [];

        this.clock = new THREE.Clock();
        this.isRunning = false;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x02030a);
        this.scene.fog = new THREE.FogExp2(0x02030a, 0.00018);
        this.sceneRoot = new THREE.Group();
        this.scene.add(this.sceneRoot);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 10000
        );
        this.camera.position.set(0, 70, 620);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000005, 1);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        this.renderer.domElement.style.cursor = 'crosshair';
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0x6574ff, 0.42));
        const sunLight = new THREE.PointLight(0xffd28a, 1.8, 2200, 1.7);
        sunLight.position.set(0, 40, 0);
        this.sceneRoot.add(sunLight);

        this.createStars();
        this.createNebulae();
        this.createGalaxy();
        this.createCoreStar();
        this.createOrbitalRings();
        this.createPlanets();
        this.createDeepSpaceParticles();
        this.createGlowingDust();
        this.createCometTrails();
        this.setupViewControls();
    }

    createStars() {
        const count = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 2000 + Math.random() * 3000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const r = Math.random();
            if (r < 0.6) { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; }
            else if (r < 0.8) { colors[i*3]=0.5; colors[i*3+1]=0.7; colors[i*3+2]=1; }
            else if (r < 0.95) { colors[i*3]=1; colors[i*3+1]=0.9; colors[i*3+2]=0.5; }
            else { colors[i*3]=1; colors[i*3+1]=0.4; colors[i*3+2]=0.3; }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 2, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true
        }));
        this.sceneRoot.add(this.stars);
    }

    createNebulae() {
        const colors = [
            { r: 0.2, g: 0.1, b: 0.8 },
            { r: 0.8, g: 0.1, b: 0.2 },
            { r: 0.1, g: 0.5, b: 0.8 },
            { r: 0.1, g: 0.8, b: 0.3 }
        ];

        for (let i = 0; i < 4; i++) {
            const count = 2000;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            const cols = new Float32Array(count * 3);

            const nx = (Math.random() - 0.5) * 3000;
            const ny = (Math.random() - 0.5) * 2000;
            const nz = (Math.random() - 0.5) * 3000 - 1000;
            const color = colors[i];

            for (let j = 0; j < count; j++) {
                const r = Math.random() * 400;
                const t = Math.random() * Math.PI * 2;
                const p = Math.acos(2 * Math.random() - 1);

                positions[j*3] = nx + r * Math.sin(p) * Math.cos(t);
                positions[j*3+1] = ny + r * Math.sin(p) * Math.sin(t) * 0.5;
                positions[j*3+2] = nz + r * Math.cos(p);

                const intensity = 0.5 + Math.random() * 0.5;
                cols[j*3] = color.r * intensity;
                cols[j*3+1] = color.g * intensity;
                cols[j*3+2] = color.b * intensity;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));

            const nebula = new THREE.Points(geometry, new THREE.PointsMaterial({
                size: 8, vertexColors: true, transparent: true, opacity: 0.6,
                sizeAttenuation: true, blending: THREE.AdditiveBlending
            }));
            this.nebulae.push(nebula);
            this.sceneRoot.add(nebula);
        }
    }

    createGalaxy() {
        const count = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const arms = 4;
        const armRadius = 800;
        const bulgeRadius = 200;

        for (let i = 0; i < count; i++) {
            let x, y, z;

            if (i < count * 0.3) {
                const r = Math.random() * bulgeRadius;
                const t = Math.random() * Math.PI * 2;
                const p = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(p) * Math.cos(t);
                y = r * Math.sin(p) * Math.sin(t) * 0.3;
                z = r * Math.cos(p);
            } else {
                const arm = Math.floor(Math.random() * arms);
                const armAngle = (arm / arms) * Math.PI * 2;
                const dist = bulgeRadius + Math.random() * (armRadius - bulgeRadius);
                const spiralAngle = armAngle + (dist / armRadius) * Math.PI * 2;
                const spread = Math.random() * 0.5 * dist;

                x = dist * Math.cos(spiralAngle) + spread * Math.cos(spiralAngle + Math.PI/2);
                z = dist * Math.sin(spiralAngle) + spread * Math.sin(spiralAngle + Math.PI/2);
                y = (Math.random() - 0.5) * 50;
            }

            positions[i*3] = x;
            positions[i*3+1] = y;
            positions[i*3+2] = z;

            const d = Math.sqrt(x*x + z*z) / armRadius;
            if (d < 0.3) {
                colors[i*3]=1; colors[i*3+1]=0.8-d; colors[i*3+2]=0.3;
            } else {
                colors[i*3]=0.7-d*0.5; colors[i*3+1]=0.8-d*0.3; colors[i*3+2]=1;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.galaxy = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 3, vertexColors: true, transparent: true, opacity: 0.8,
            sizeAttenuation: true, blending: THREE.AdditiveBlending
        }));
        this.galaxy.rotation.x = Math.PI * 0.1;
        this.sceneRoot.add(this.galaxy);
    }

    createCoreStar() {
        const coreGeometry = new THREE.SphereGeometry(42, 48, 48);
        const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffd47a });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.registerViewTarget(this.core, {
            key: 'sun',
            label: '太阳',
            distance: 260
        });
        this.sceneRoot.add(this.core);

        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createGlowTexture('rgba(255, 245, 180, 1)', 'rgba(255, 130, 66, 0.45)', 'rgba(255, 255, 255, 0)'),
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        glow.scale.set(430, 430, 1);
        this.core.add(glow);
    }

    createOrbitalRings() {
        [190, 320, 500, 700].forEach((radius, index) => {
            const geometry = new THREE.TorusGeometry(radius, 0.9, 8, 180);
            const material = new THREE.MeshBasicMaterial({
                color: [0x6ef2ff, 0xffce7a, 0xff6b9c, 0x8cffb4][index],
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.z = index * 0.24;
            this.sceneRoot.add(ring);
        });
    }

    createPlanets() {
        const configs = [
            { key: 'mercury', label: '水星', radius: 150, size: 10, color: 0xbfc4c9, speed: 0.24, tilt: 0.1 },
            { key: 'venus', label: '金星', radius: 230, size: 18, color: 0xffc36d, speed: -0.16, tilt: -0.08 },
            { key: 'earth', label: '地球', radius: 330, size: 19, color: 0x70e5ff, speed: 0.12, tilt: 0.18 },
            { key: 'mars', label: '火星', radius: 430, size: 15, color: 0xff725f, speed: -0.095, tilt: -0.16 },
            { key: 'jupiter', label: '木星', radius: 570, size: 34, color: 0xe4b28d, speed: 0.07, tilt: 0.13 },
            { key: 'saturn', label: '土星', radius: 740, size: 30, color: 0xd8c285, speed: -0.052, tilt: -0.2 }
        ];

        configs.forEach(config => {
            const pivot = new THREE.Group();
            pivot.rotation.x = config.tilt;
            pivot.userData.speed = config.speed;

            const planet = new THREE.Mesh(
                new THREE.SphereGeometry(config.size, 32, 32),
                new THREE.MeshStandardMaterial({
                    color: config.color,
                    roughness: 0.55,
                    metalness: 0.08,
                    emissive: config.color,
                    emissiveIntensity: 0.08
                })
            );
            planet.position.x = config.radius;
            planet.userData.viewKey = config.key;
            planet.userData.viewLabel = config.label;
            pivot.add(planet);
            this.registerViewTarget(planet, {
                key: config.key,
                label: config.label,
                distance: Math.max(130, config.size * 8)
            });

            const atmosphere = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.createGlowTexture('rgba(255,255,255,0.55)', 'rgba(90,220,255,0.25)', 'rgba(255,255,255,0)'),
                color: config.color,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }));
            atmosphere.scale.set(config.size * 4.2, config.size * 4.2, 1);
            planet.add(atmosphere);

            if (config.key === 'saturn') {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(config.size * 1.55, 1.6, 8, 90),
                    new THREE.MeshBasicMaterial({
                        color: 0xffdf9b,
                        transparent: true,
                        opacity: 0.45,
                        blending: THREE.AdditiveBlending
                    })
                );
                ring.rotation.x = Math.PI / 2;
                planet.add(ring);
            }

            this.planets.push({ pivot, planet });
            this.sceneRoot.add(pivot);
        });
    }

    createDeepSpaceParticles() {
        const count = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i*3] = (Math.random()-0.5) * 5000;
            positions[i*3+1] = (Math.random()-0.5) * 5000;
            positions[i*3+2] = (Math.random()-0.5) * 5000 - 2000;

            const intensity = 0.3 + Math.random() * 0.7;
            colors[i*3] = 0.5 * intensity;
            colors[i*3+1] = 0.6 * intensity;
            colors[i*3+2] = 1 * intensity;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 1.5, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true
        }));
        this.sceneRoot.add(this.particles);
    }

    createGlowingDust() {
        const count = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i*3] = (Math.random()-0.5) * 2000;
            positions[i*3+1] = (Math.random()-0.5) * 2000;
            positions[i*3+2] = Math.random() * -3000;

            const r = Math.random();
            if (r < 0.3) { colors[i*3]=0; colors[i*3+1]=0.9; colors[i*3+2]=0.9; }
            else if (r < 0.6) { colors[i*3]=0.7; colors[i*3+1]=0; colors[i*3+2]=0.9; }
            else { const v = 0.5+Math.random()*0.5; colors[i*3]=v; colors[i*3+1]=v; colors[i*3+2]=v; }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.dustCloud = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 4, vertexColors: true, transparent: true, opacity: 0.4,
            sizeAttenuation: true, blending: THREE.AdditiveBlending
        }));
        this.sceneRoot.add(this.dustCloud);
    }

    createCometTrails() {
        for (let i = 0; i < 12; i++) {
            const geometry = new THREE.BufferGeometry();
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 1800,
                (Math.random() - 0.5) * 900,
                -600 - Math.random() * 1600
            );
            const end = start.clone().add(new THREE.Vector3(120 + Math.random() * 160, -40 - Math.random() * 110, 40));
            geometry.setFromPoints([start, end]);

            const comet = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                color: i % 3 === 0 ? 0xffd58a : 0x86f8ff,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending
            }));
            comet.userData.drift = 0.45 + Math.random() * 0.85;
            comet.userData.origin = start.clone();
            this.comets.push(comet);
            this.sceneRoot.add(comet);
        }
    }

    createGlowTexture(innerColor, middleColor, outerColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(0.32, middleColor);
        gradient.addColorStop(1, outerColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    registerViewTarget(object, view) {
        object.userData.viewTarget = view;
        this.clickableTargets.push(object);
        this.viewTargets.set(view.key, { ...view, object });
    }

    setupViewControls() {
        this.renderer.domElement.addEventListener('pointerdown', event => this.onScenePointerDown(event));

        document.querySelectorAll('[data-view-target]').forEach(button => {
            button.addEventListener('click', () => {
                const key = button.getAttribute('data-view-target');
                if (key === 'universe') {
                    this.clearView();
                } else {
                    this.setView(key);
                }
            });
        });

        this.updateViewButtons();
    }

    onScenePointerDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.clickableTargets, true);
        const hit = hits.find(item => this.getViewTargetFromObject(item.object));
        if (hit) {
            this.setView(this.getViewTargetFromObject(hit.object).key);
        }
    }

    getViewTargetFromObject(object) {
        let current = object;
        while (current) {
            if (current.userData && current.userData.viewTarget) {
                return current.userData.viewTarget;
            }
            current = current.parent;
        }
        return null;
    }

    setView(key) {
        const target = this.viewTargets.get(key);
        if (!target) return;
        this.activeView = target;
        this.updateViewButtons();
    }

    clearView() {
        this.activeView = null;
        this.updateViewButtons();
    }

    updateViewButtons() {
        document.querySelectorAll('[data-view-target]').forEach(button => {
            const key = button.getAttribute('data-view-target');
            const isActive = this.activeView ? key === this.activeView.key : key === 'universe';
            button.classList.toggle('active', isActive);
        });

        const viewStatus = document.getElementById('view-status');
        if (viewStatus) {
            viewStatus.textContent = this.activeView ? `${this.activeView.label}视角` : '全宇宙';
        }
    }

    setRotation(dx, dy) {
        this.rotationSpeed.x = dx;
        this.rotationSpeed.y = dy;
    }

    setZoom(level) {
        this.zoomLevel = level;
    }

    addPan(dx, dy) {
        this.panTarget.x = THREE.MathUtils.clamp(this.panTarget.x + dx, -900, 900);
        this.panTarget.y = THREE.MathUtils.clamp(this.panTarget.y + dy, -520, 520);
    }

    addManualRotation(yaw, pitch, roll) {
        this.sceneRoot.rotation.y += yaw;
        this.sceneRoot.rotation.x = THREE.MathUtils.clamp(this.sceneRoot.rotation.x + pitch, -1.15, 1.15);
        this.sceneRoot.rotation.z = THREE.MathUtils.clamp(this.sceneRoot.rotation.z + roll, -0.85, 0.85);
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.033);
        const time = this.clock.getElapsedTime();

        // 手指方向会持续推动整个场景旋转；手停住时速度也会马上停住。
        this.sceneRoot.rotation.y += this.rotationSpeed.x * delta * 0.42;
        this.sceneRoot.rotation.x += this.rotationSpeed.y * delta * 0.28;
        this.sceneRoot.rotation.x = THREE.MathUtils.clamp(this.sceneRoot.rotation.x, -1.15, 1.15);
        this.sceneRoot.rotation.z += (0 - this.sceneRoot.rotation.z) * 0.006;
        this.panCurrent.x += (this.panTarget.x - this.panCurrent.x) * 0.38;
        this.panCurrent.y += (this.panTarget.y - this.panCurrent.y) * 0.38;
        this.sceneRoot.position.x = this.panCurrent.x;
        this.sceneRoot.position.y = this.panCurrent.y;

        this.updateCameraForView();

        if (this.core) {
            this.core.rotation.y += delta * 0.32;
            const pulse = 1 + Math.sin(time * 2.2) * 0.035;
            this.core.scale.setScalar(pulse);
        }

        this.planets.forEach(({ pivot, planet }) => {
            pivot.rotation.y += pivot.userData.speed * delta;
            planet.rotation.y += delta * 0.6;
        });

        this.comets.forEach((comet, index) => {
            comet.position.x += comet.userData.drift * delta * 24;
            comet.position.y -= comet.userData.drift * delta * 8;
            if (comet.position.x > 260) {
                comet.position.x = -260 - index * 12;
                comet.position.y = 0;
            }
        });

        if (this.stars) {
            this.stars.rotation.y += delta * 0.004;
        }
        if (this.galaxy) {
            this.galaxy.rotation.y += delta * 0.012;
        }
        if (this.dustCloud) {
            this.dustCloud.rotation.z += delta * 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateCameraForView() {
        if (this.activeView) {
            this.activeView.object.getWorldPosition(this.targetWorldPosition);
            const distance = this.activeView.distance / this.zoomLevel;
            const targetCameraPosition = new THREE.Vector3(
                this.targetWorldPosition.x * 0.35,
                this.targetWorldPosition.y * 0.35 + distance * 0.2,
                this.targetWorldPosition.z + distance
            );
            this.camera.position.lerp(targetCameraPosition, 0.12);
            this.lookTarget.lerp(this.targetWorldPosition, 0.18);
            this.camera.lookAt(this.lookTarget);
            return;
        }

        const targetZ = 680 / this.zoomLevel;
        const targetY = 70 / Math.sqrt(this.zoomLevel);
        this.camera.position.x += (0 - this.camera.position.x) * 0.08;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.14;
        this.lookTarget.lerp(new THREE.Vector3(0, 0, 0), 0.16);
        this.camera.lookAt(this.lookTarget);
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }
}
