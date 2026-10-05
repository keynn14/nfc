/* ============================================
   KANE RESTAURO — Profile Website Scripts
   Scroll-Triggered Swinging ID Card + Particles
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    addRippleEffects();
    initSwingingIdCard();
    initParallax();
});

/* ============================================
   SWINGING ID CARD — Physics-based Pendulum
   ============================================ */
function initSwingingIdCard() {
    const assembly = document.getElementById('lanyardAssembly');
    const cardInner = document.querySelector('.id-card-inner');
    const cardShadow = document.getElementById('idCardShadow');
    const lanyardPath = document.getElementById('lanyardPath');
    const scrollHint = document.getElementById('scrollHint');

    if (!assembly) return;

    // Physics state
    let currentAngle = 0;       // Current pendulum angle (degrees)
    let angularVelocity = 0;    // Current angular velocity
    let lastScrollY = 0;        // Previous scroll position
    let lastScrollTime = 0;     // Timestamp of last scroll
    let scrollDelta = 0;        // Accumulated scroll delta
    let isScrolling = false;    // Whether user is actively scrolling
    let scrollTimeout = null;   // Timer to detect scroll stop
    let animFrameId = null;     // requestAnimationFrame ID

    // Physics constants
    const DAMPING = 0.96;           // How quickly the swing settles (0-1, higher = slower settle)
    const SCROLL_SENSITIVITY = 0.12; // How much scroll affects the swing
    const MAX_ANGLE = 18;           // Maximum swing angle in degrees
    const GRAVITY_FACTOR = 0.04;    // Restoring force (gravity pulling back to center)
    const INERTIA = 0.85;          // Momentum carry-over
    const TILT_3D_FACTOR = 0.6;   // How much 3D tilt to apply
    const SHADOW_MOVE_FACTOR = 1.5; // How much the shadow shifts

    // Listen to scroll events
    window.addEventListener('scroll', onScroll, { passive: true });

    // Start the animation loop
    animFrameId = requestAnimationFrame(animationLoop);

    function onScroll() {
        const now = performance.now();
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        const timeDelta = now - lastScrollTime;

        // Calculate scroll velocity (pixels per millisecond)
        const scrollVelocity = timeDelta > 0 ? delta / timeDelta : 0;

        // Accumulate scroll force with velocity weighting
        scrollDelta += scrollVelocity * SCROLL_SENSITIVITY * 50;

        lastScrollY = currentScrollY;
        lastScrollTime = now;
        isScrolling = true;

        // Clear previous scroll-stop timer
        if (scrollTimeout) clearTimeout(scrollTimeout);

        // Set timer to detect when scrolling stops
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);

        // Fade out scroll hint on first scroll
        if (scrollHint && currentScrollY > 50) {
            scrollHint.style.opacity = Math.max(0, 1 - (currentScrollY / 200));
        }
    }

    function animationLoop() {
        // Apply scroll force to angular velocity
        if (Math.abs(scrollDelta) > 0.001) {
            angularVelocity += scrollDelta * (1 - INERTIA);
            scrollDelta *= INERTIA;
        }

        // Apply gravity (restoring force toward center)
        const gravityForce = -currentAngle * GRAVITY_FACTOR;
        angularVelocity += gravityForce;

        // Apply damping (air resistance / friction)
        angularVelocity *= DAMPING;

        // Clamp angular velocity to prevent wild spinning
        angularVelocity = Math.max(-3, Math.min(3, angularVelocity));

        // Update angle
        currentAngle += angularVelocity;

        // Clamp angle
        currentAngle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, currentAngle));

        // Stop very small oscillations (settle threshold)
        if (!isScrolling && Math.abs(angularVelocity) < 0.01 && Math.abs(currentAngle) < 0.05) {
            currentAngle = 0;
            angularVelocity = 0;
        }

        // Apply transforms
        applyTransforms(currentAngle);

        // Continue animation loop
        animFrameId = requestAnimationFrame(animationLoop);
    }

    function applyTransforms(angle) {
        // 1. Main pendulum rotation on the assembly
        //    Rotate around the top-center (where lanyard attaches to ceiling)
        assembly.style.transform = `rotate(${angle}deg)`;

        // 2. 3D tilt on the card itself for depth effect
        if (cardInner) {
            const tiltY = angle * TILT_3D_FACTOR;
            const tiltX = Math.abs(angle) * 0.15; // Slight forward tilt when swinging
            cardInner.style.transform = `
                rotateY(${tiltY}deg)
                rotateX(${tiltX}deg)
                translateZ(0)
            `;
        }

        // 3. Dynamic shadow — shifts opposite to swing direction
        if (cardShadow) {
            const shadowShiftX = -angle * SHADOW_MOVE_FACTOR;
            const shadowScale = 1 - Math.abs(angle) * 0.01;
            const shadowOpacity = 0.35 - Math.abs(angle) * 0.008;
            cardShadow.style.transform = `translateX(${shadowShiftX}px) scaleX(${shadowScale})`;
            cardShadow.style.opacity = Math.max(0.1, shadowOpacity);
        }

        // 4. Bend the lanyard SVG path slightly during swing
        if (lanyardPath) {
            const bend = angle * 0.8;
            lanyardPath.setAttribute('d',
                `M3,0 C${3 + bend * 0.3},70 ${3 + bend * 0.6},180 ${3 + bend * 0.4},280`
            );
        }
    }
}


/* ============================================
   PARALLAX — Background elements
   ============================================ */
function initParallax() {
    const parallaxBg = document.getElementById('parallaxBg');
    const stars = document.querySelectorAll('.parallax-star');

    if (!parallaxBg || stars.length === 0) return;

    // Assign random speed multipliers to each star
    const starSpeeds = [];
    stars.forEach(() => {
        starSpeeds.push(0.1 + Math.random() * 0.4);
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        stars.forEach((star, i) => {
            const speed = starSpeeds[i];
            star.style.transform = `translateY(${scrollY * speed}px)`;
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

    // Inject ripple keyframe if not present
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
