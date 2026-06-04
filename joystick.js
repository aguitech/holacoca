/* ============================================================
   HolaSebas — Dual Joystick Controller (v4: control directo + refresh)
   - Llama DIRECTAMENTE a window.applyNormalAnimation(), performJump(),
     resetPosition() del HTML — no depende de KeyboardEvent
   - Mientras el stick siga activo en una dirección, RE-LLAMA
     applyNormalAnimation() cada 2s (como desktop, donde el keydown
     handler la llama repetidamente)
   - Re-llama también en cada cambio de magnitud/dirección
   - Joystick IZQ → WASD + applyNormalAnimation
   - Joystick DER → rota cameraRig
   - Botón JUMP → performJump()
   - Botón RESET → resetPosition()
   ============================================================ */
(function () {
    'use strict';

    function setup() {
        const scene = document.querySelector('a-scene');
        const player = document.getElementById('player');
        if (!scene || !player) return null;
        return { scene, player };
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const refs = setup();
            if (refs) bindJoysticks(refs.scene, refs.player);
            else console.warn('⚠️ Joystick: A-Frame scene no encontrada');
        }, 600);
    });

    function bindJoysticks(scene, player) {

        // ----- Wait for applyNormalAnimation to be defined by the HTML's <script> -----
        // The HTML's <script> defines `function applyNormalAnimation()`.
        // It's accessible as window.applyNormalAnimation() because top-level
        // function declarations become properties of window.
        function whenReady(cb) {
            if (typeof window.applyNormalAnimation === 'function' &&
                typeof window.performJump === 'function' &&
                typeof window.resetPosition === 'function') {
                cb();
                return;
            }
            let attempts = 0;
            const iv = setInterval(() => {
                attempts++;
                if (typeof window.applyNormalAnimation === 'function') {
                    clearInterval(iv);
                    cb();
                } else if (attempts > 100) { // 10s
                    clearInterval(iv);
                    console.warn('⚠️ Joystick: applyNormalAnimation nunca apareció');
                }
            }, 100);
        }

        whenReady(() => {
            console.log('🎬 applyNormalAnimation() disponible — joystick conectado');
        });

        // ----- Map (dx, dy) del stick → (W,A,S,D, Shift) y llama applyNormalAnimation() -----
        // The HTML's applyNormalAnimation() reads isMoving and isRunning
        // (which are module-scoped in the HTML's <script>).
        // So we need to ALSO update those. The cleanest way: dispatch
        // KeyboardEvent so the HTML's keydown handler runs and sets
        // isMoving/isRunning. Then we ALSO call applyNormalAnimation()
        // directly to refresh the animation clip.

        const DEADZONE = 0.20;
        const RUN_THRESHOLD = 0.7;
        const REFRESH_INTERVAL = 2000; // ms — re-llamar applyNormalAnimation

        let currentKeys = { w: false, s: false, a: false, d: false };
        let currentSprint = false;
        let refreshTimer = null;

        function fireKey(key, isDown) {
            const evt = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
                key: key,
                code: 'Key' + key.toUpperCase(),
                keyCode: key === ' ' ? 32 : key.charCodeAt(0),
                which:   key === ' ' ? 32 : key.charCodeAt(0),
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(evt);
        }

        function setKey(key, down) {
            if (currentKeys[key] !== down) {
                currentKeys[key] = down;
                fireKey(key, down);
            }
        }

        function setSprint(down) {
            if (currentSprint !== down) {
                currentSprint = down;
                const evt = new KeyboardEvent(down ? 'keydown' : 'keyup', {
                    key: 'Shift',
                    code: 'ShiftLeft',
                    shiftKey: down,
                    keyCode: 16,
                    which: 16,
                    bubbles: true,
                    cancelable: true
                });
                window.dispatchEvent(evt);
            }
        }

        // Llamar applyNormalAnimation() directamente. Si no está listo, noop.
        function refreshAnim() {
            if (typeof window.applyNormalAnimation === 'function') {
                try { window.applyNormalAnimation(); } catch (e) { /* ignore */ }
            }
        }

        // Inicia el refresh periódico mientras el stick esté activo
        function startRefresh() {
            stopRefresh();
            // Llama una vez ahora
            refreshAnim();
            // Y refresca cada 2s mientras siga activo
            refreshTimer = setInterval(refreshAnim, REFRESH_INTERVAL);
        }

        function stopRefresh() {
            if (refreshTimer) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
        }

        // ----- Joystick factory -----
        function bindJoystick(baseId, onMove, onRelease) {
            const base = document.getElementById(baseId);
            if (!base) return;
            const stick = base.querySelector('.joy-stick');
            let active = false, cx = 0, cy = 0;
            const MAX = 50;

            function reset() {
                active = false;
                stick.style.transform = 'translate(-50%, -50%)';
                if (onRelease) onRelease();
            }

            base.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                active = true;
                const t = e.touches[0];
                cx = t.clientX;
                cy = t.clientY;
            }, { passive: false });

            base.addEventListener('touchmove', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!active) return;
                const t = e.touches[0];
                let dx = t.clientX - cx;
                let dy = t.clientY - cy;
                const len = Math.min(MAX, Math.hypot(dx, dy));
                const ang = Math.atan2(dy, dx);
                dx = Math.cos(ang) * len;
                dy = Math.sin(ang) * len;
                stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                onMove(dx / MAX, dy / MAX);
            }, { passive: false });

            base.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                reset();
            }, { passive: false });

            base.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                reset();
            }, { passive: false });
        }

        // ----- LEFT joystick: WASD con deadzone + sprint threshold -----
        bindJoystick('joy-move', (x, y) => {
            // Stick up = ny positivo = W (adelante)
            const ny = -y;
            const magnitude = Math.hypot(x, ny);

            const shouldW = ny >  DEADZONE;
            const shouldS = ny < -DEADZONE;
            const shouldA = x  < -DEADZONE;
            const shouldD = x  >  DEADZONE;
            const shouldSprint = magnitude > RUN_THRESHOLD;

            setKey('w', shouldW);
            setKey('s', shouldS);
            setKey('a', shouldA);
            setKey('d', shouldD);
            setSprint(shouldSprint);

            // El HTML cambia isMoving/isRunning al recibir keydown; llamamos
            // applyNormalAnimation() para forzar la actualización del clip
            // incluso si el keydown ya se procesó.
            refreshAnim();

            // Mientras el stick esté activo, garantizar refresh cada 2s
            if (!refreshTimer) startRefresh();
        }, () => {
            // Soltar: limpiar todo
            Object.keys(currentKeys).forEach(k => setKey(k, false));
            setSprint(false);
            stopRefresh();
            // Volver a idle
            refreshAnim();
        });

        // ----- RIGHT joystick: rotar cameraRig (igual que antes) -----
        const cameraRig = document.getElementById('cameraRig');
        const aCamera = scene.querySelector('a-camera') || scene.querySelector('[camera]');
        const LOOK_SENS = 0.04;

        bindJoystick('joy-look', (x, y) => {
            const target = cameraRig || aCamera;
            if (!target) return;
            const rot = target.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
            const newY = rot.y - x * LOOK_SENS * 50;
            const pitchDelta = y * LOOK_SENS * 50;
            const newX = Math.max(-60, Math.min(60, rot.x + pitchDelta));
            target.setAttribute('rotation', `${newX} ${newY} 0`);
        });

        // ----- JUMP button: llamada directa a performJump() -----
        const btnJump = document.getElementById('btn-jump');
        if (btnJump) {
            btnJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Llamada directa (más confiable que KeyboardEvent)
                if (typeof window.performJump === 'function') {
                    window.performJump();
                } else {
                    // Fallback: KeyboardEvent
                    fireKey(' ', true);
                    setTimeout(() => fireKey(' ', false), 50);
                }
            }, { passive: false });
        }

        // ----- RESET button: llamada directa a resetPosition() -----
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.resetPosition === 'function') {
                    window.resetPosition();
                } else {
                    fireKey('r', true);
                }
            }, { passive: false });
        }

        console.log('🕹️  Dual joystick v4: WASD → applyNormalAnimation() cada cambio + refresh cada 2s');
    }
})();
