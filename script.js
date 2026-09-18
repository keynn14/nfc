/* ============================================
   KANE RESTAURO — Profile Website Scripts
   Particles & Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    addRippleEffects();
});

/* --- Floating Gold Particles --- */
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

/* --- Ripple Effect on Buttons --- */
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
