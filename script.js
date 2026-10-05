/* ============================================
   KANE RESTAURO — Profile Website Scripts
   Scroll + Touch + Mouse Swinging ID Card
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    addRippleEffects();
    initSwingingIdCard();
    initParallax();
});

/* ============================================
   SWINGING ID CARD — Full Physics Engine
   Supports: Scroll, Touch Swipe, Mouse Drag
   ============================================ */
function initSwingingIdCard() {
    const assembly = document.getElementById('lanyardAssembly');
    const cardInner = document.querySelector('.id-card-inner');
    const cardShadow = document.getElementById('idCardShadow');
    const lanyardPath = document.getElementById('lanyardPath');
    const scrollHint = document.getElementById('scrollHint');
    const heroSection = document.getElementById('heroSection');

    if (!assembly) return;

    // ─── Physics State ───
    let currentAngle = 0;
    let angularVelocity = 0;
    let lastScrollY = 0;
    let lastScrollTime = 0;
    let scrollDelta = 0;
    let isScrolling = false;
    let scrollTimeout = null;

    // Touch / Mouse state
    let isDragging = false;
    let dragStartX = 0;
    let dragLastX = 0;
    let dragLastTime = 0;
    let dragVelocity = 0;
    let touchHistory = [];       // Track recent touch positions for velocity calc

    // ─── Physics Constants ───
    const DAMPING = 0.985;              // Friction — higher = swings longer
    const DAMPING_FAST = 0.975;         // Extra damping when spinning fast
    const SCROLL_SENSITIVITY = 0.12;
    const SWIPE_SENSITIVITY = 0.35;     // How much swipe force affects the card
    const MOUSE_SENSITIVITY = 0.25;
    const MAX_ANGLE_SOFT = 25;          // Soft limit for scroll-based swing
    const GRAVITY_FACTOR = 0.025;       // Restoring force (lower = more floaty)
    const GRAVITY_STRONG = 0.06;        // Stronger gravity when past 180°
    const INERTIA = 0.85;
    const TILT_3D_FACTOR = 0.5;
    const SHADOW_MOVE_FACTOR = 1.5;
    const FULL_SPIN_THRESHOLD = 8;      // Velocity needed for 360° possibility
    const MAX_VELOCITY = 25;            // Absolute max angular velocity

    // ─── Scroll Listener ───
    window.addEventListener('scroll', onScroll, { passive: true });

    // ─── Touch Listeners (Mobile) ───
    assembly.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // ─── Mouse Listeners (Desktop) ───
    assembly.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Prevent default drag behavior on the card
    assembly.style.cursor = 'grab';
    assembly.addEventListener('dragstart', (e) => e.preventDefault());

    // ─── Start Animation Loop ───
    requestAnimationFrame(animationLoop);

    /* ────────────────────────────
       SCROLL HANDLER
       ──────────────────────────── */
    function onScroll() {
        const now = performance.now();
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        const timeDelta = now - lastScrollTime;

        const scrollVelocity = timeDelta > 0 ? delta / timeDelta : 0;
        scrollDelta += scrollVelocity * SCROLL_SENSITIVITY * 50;

        lastScrollY = currentScrollY;
        lastScrollTime = now;
        isScrolling = true;

        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { isScrolling = false; }, 150);

        // Fade scroll hint
        if (scrollHint && currentScrollY > 50) {
            scrollHint.style.opacity = Math.max(0, 1 - (currentScrollY / 200));
        }
    }

    /* ────────────────────────────
       TOUCH HANDLERS (Mobile)
       ──────────────────────────── */
    function onTouchStart(e) {
        if (e.touches.length !== 1) return;

        isDragging = true;
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragLastX = touch.clientX;
        dragLastTime = performance.now();
        dragVelocity = 0;
        touchHistory = [{ x: touch.clientX, time: dragLastTime }];

        // Stop current momentum for direct control
        angularVelocity *= 0.3;

        // Kill idle sway while dragging
        assembly.style.animation = 'none';
        assembly.style.cursor = 'grabbing';
    }

    function onTouchMove(e) {
        if (!isDragging) return;

        const touch = e.touches[0];
        const now = performance.now();
        const deltaX = touch.clientX - dragLastX;
        const timeDelta = now - dragLastTime;

        // Track touch history (keep last 5 points for velocity averaging)
        touchHistory.push({ x: touch.clientX, time: now });
        if (touchHistory.length > 5) touchHistory.shift();

        // Apply force directly while dragging
        if (timeDelta > 0) {
            const instantVelocity = (deltaX / timeDelta) * SWIPE_SENSITIVITY;
            angularVelocity = angularVelocity * 0.4 + instantVelocity * 0.6;
        }

        dragLastX = touch.clientX;
        dragLastTime = now;

        // Prevent page scroll while swiping the card
        if (Math.abs(touch.clientX - dragStartX) > 10) {
            e.preventDefault();
        }
    }

    function onTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        // Calculate release velocity from touch history
        const releaseVelocity = calculateReleaseVelocity();

        // Apply the flick force
        angularVelocity += releaseVelocity * SWIPE_SENSITIVITY * 2;

        // Clamp max velocity
        angularVelocity = clamp(angularVelocity, -MAX_VELOCITY, MAX_VELOCITY);

        // Restore idle sway after settle
        setTimeout(() => {
            if (!isDragging && Math.abs(angularVelocity) < 0.5) {
                assembly.style.animation = '';
            }
        }, 2000);

        assembly.style.cursor = 'grab';
        touchHistory = [];
    }

    /* ────────────────────────────
       MOUSE HANDLERS (Desktop)
       ──────────────────────────── */
    function onMouseDown(e) {
        e.preventDefault();
        isDragging = true;
        dragStartX = e.clientX;
        dragLastX = e.clientX;
        dragLastTime = performance.now();
        dragVelocity = 0;
        touchHistory = [{ x: e.clientX, time: dragLastTime }];

        angularVelocity *= 0.3;
        assembly.style.animation = 'none';
        assembly.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
        if (!isDragging) return;

        const now = performance.now();
        const deltaX = e.clientX - dragLastX;
        const timeDelta = now - dragLastTime;

        touchHistory.push({ x: e.clientX, time: now });
        if (touchHistory.length > 5) touchHistory.shift();

        if (timeDelta > 0) {
            const instantVelocity = (deltaX / timeDelta) * MOUSE_SENSITIVITY;
            angularVelocity = angularVelocity * 0.4 + instantVelocity * 0.6;
        }

        dragLastX = e.clientX;
        dragLastTime = now;
    }

    function onMouseUp(e) {
        if (!isDragging) return;
        isDragging = false;

        const releaseVelocity = calculateReleaseVelocity();
        angularVelocity += releaseVelocity * MOUSE_SENSITIVITY * 2;
        angularVelocity = clamp(angularVelocity, -MAX_VELOCITY, MAX_VELOCITY);

        setTimeout(() => {
            if (!isDragging && Math.abs(angularVelocity) < 0.5) {
                assembly.style.animation = '';
            }
        }, 2000);

        assembly.style.cursor = 'grab';
        document.body.style.userSelect = '';
        touchHistory = [];
    }

    /* ────────────────────────────
       RELEASE VELOCITY CALCULATOR
       Uses last few tracked positions
       for smooth, averaged velocity
       ──────────────────────────── */
    function calculateReleaseVelocity() {
        if (touchHistory.length < 2) return 0;

        // Use the oldest and newest points in history for average velocity
        const oldest = touchHistory[0];
        const newest = touchHistory[touchHistory.length - 1];
        const timeDelta = newest.time - oldest.time;

        if (timeDelta <= 0) return 0;

        return (newest.x - oldest.x) / timeDelta;
    }

    /* ────────────────────────────
       MAIN ANIMATION LOOP
       Physics simulation at 60fps
       ──────────────────────────── */
    function animationLoop() {
        // 1. Apply scroll force
        if (Math.abs(scrollDelta) > 0.001) {
            angularVelocity += scrollDelta * (1 - INERTIA);
            scrollDelta *= INERTIA;
        }

        // 2. Apply gravity (restoring force toward 0°)
        //    Use normalized angle for gravity calculation (handles 360°+)
        let normalizedAngle = normalizeAngle(currentAngle);
        let gravityStrength = GRAVITY_FACTOR;

        // Stronger gravity when spinning wildly (past ±90°)
        if (Math.abs(normalizedAngle) > 90) {
            gravityStrength = GRAVITY_STRONG;
        }

        const gravityForce = -normalizedAngle * gravityStrength;
        angularVelocity += gravityForce;

        // 3. Apply damping
        //    More damping at high velocities to prevent infinite spin
        const currentDamping = Math.abs(angularVelocity) > FULL_SPIN_THRESHOLD
            ? DAMPING_FAST
            : DAMPING;
        angularVelocity *= currentDamping;

        // 4. Clamp velocity
        angularVelocity = clamp(angularVelocity, -MAX_VELOCITY, MAX_VELOCITY);

        // 5. Update angle (NO hard clamp — allows 360° rotation!)
        currentAngle += angularVelocity;

        // 6. Settle detection — only when not being interacted with
        if (!isDragging && !isScrolling) {
            if (Math.abs(angularVelocity) < 0.008 && Math.abs(normalizedAngle) < 0.1) {
                currentAngle = 0;
                angularVelocity = 0;
            }
        }

        // 7. Apply visual transforms
        applyTransforms(currentAngle);

        requestAnimationFrame(animationLoop);
    }

    /* ────────────────────────────
       APPLY VISUAL TRANSFORMS
       ──────────────────────────── */
    function applyTransforms(angle) {
        // Normalize for visual calculations
        const visAngle = normalizeAngle(angle);

        // 1. Pendulum rotation (full angle, allows 360°)
        assembly.style.transform = `rotate(${angle}deg)`;

        // 2. 3D tilt on the card
        if (cardInner) {
            const tiltY = visAngle * TILT_3D_FACTOR;
            const tiltX = Math.abs(visAngle) * 0.12;
            // Scale slightly when facing away (past 90°)
            const scaleZ = Math.abs(visAngle) > 90
                ? 0.95 + (1 - Math.abs(visAngle) / 180) * 0.05
                : 1;
            cardInner.style.transform = `
                rotateY(${tiltY}deg)
                rotateX(${tiltX}deg)
                scale(${scaleZ})
                translateZ(0)
            `;
        }

        // 3. Dynamic shadow
        if (cardShadow) {
            const shadowShiftX = -visAngle * SHADOW_MOVE_FACTOR;
            const absAngle = Math.abs(visAngle);
            const shadowScale = Math.max(0.3, 1 - absAngle * 0.005);
            const shadowOpacity = Math.max(0.05, 0.35 - absAngle * 0.003);
            // Shadow disappears when card is upside down
            const shadowVis = absAngle > 150 ? 0 : shadowOpacity;
            cardShadow.style.transform = `translateX(${shadowShiftX}px) scaleX(${shadowScale})`;
            cardShadow.style.opacity = shadowVis;
        }

        // 4. Bend the lanyard SVG
        if (lanyardPath) {
            const bend = clamp(visAngle, -60, 60) * 0.8;
            lanyardPath.setAttribute('d',
                `M3,0 C${3 + bend * 0.3},70 ${3 + bend * 0.6},180 ${3 + bend * 0.4},280`
            );
        }
    }

    /* ────────────────────────────
       UTILITY FUNCTIONS
       ──────────────────────────── */
    function normalizeAngle(angle) {
        // Normalize angle to -180 to 180 range
        let a = angle % 360;
        if (a > 180) a -= 360;
        if (a < -180) a += 360;
        return a;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }
}


/* ============================================
   PARALLAX — Background elements
   ============================================ */
function initParallax() {
    const stars = document.querySelectorAll('.parallax-star');
    if (stars.length === 0) return;

    const starSpeeds = [];
    stars.forEach(() => {
        starSpeeds.push(0.1 + Math.random() * 0.4);
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        stars.forEach((star, i) => {
            star.style.transform = `translateY(${scrollY * starSpeeds[i]}px)`;
        });
    }, { passive: true });
}


/* ============================================
   FLOATING GOLD PARTICLES
   ============================================ */
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 10 + 12;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;

        container.appendChild(particle);
    }
}


/* ============================================
   RIPPLE EFFECT ON BUTTONS
   ============================================ */
function addRippleEffects() {
    const buttons = document.querySelectorAll('.link-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: 0;
                height: 0;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: rgba(212, 160, 23, 0.2);
                transform: translate(-50%, -50%);
                pointer-events: none;
                animation: rippleAnim 0.6s ease-out forwards;
            `;

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes rippleAnim {
                to {
                    width: 300px;
                    height: 300px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
