function sayHello() {
    alert("Привіт! Це працює!");
}

// ===== Анімований фон =====
// Оберіть стиль фону: 'silver' (срібло) | 'aurora' (градієнти) | 'particles' (частинки) | 'waves' (хвилі)
const BG_STYLE = 'silver';

(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const BASE = '#070913';

    let w = 0, h = 0, style = BG_STYLE, last = performance.now();
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        syncParticles();
        if (reduceMotion) draw(performance.now(), 16);
    }

    function glow(x, y, r, rgb, a) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rgb},${a})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    // ---------- 1. Aurora: м'які кольорові плями ----------
    const blobs = [
        { rgb: '59,91,255',  r: 0.55, sx: 0.00013, sy: 0.00017, ph: 0.0 },
        { rgb: '124,58,237', r: 0.50, sx: 0.00011, sy: 0.00009, ph: 2.1 },
        { rgb: '6,182,212',  r: 0.40, sx: 0.00016, sy: 0.00012, ph: 4.2 },
        { rgb: '37,99,235',  r: 0.45, sx: 0.00009, sy: 0.00014, ph: 5.3 }
    ];

    function drawAurora(t) {
        ctx.fillStyle = BASE;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        const m = Math.max(w, h);
        blobs.forEach(b => {
            const x = w * (0.5 + 0.38 * Math.sin(t * b.sx + b.ph));
            const y = h * (0.5 + 0.38 * Math.cos(t * b.sy + b.ph * 1.3));
            glow(x, y, m * b.r, b.rgb, 0.32);
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    // ---------- 2. Particles: мережа точок і ліній ----------
    function makeParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            r: Math.random() * 1.4 + 0.8
        };
    }

    function syncParticles() {
        const n = Math.min(110, Math.max(30, Math.floor((w * h) / 14000)));
        while (particles.length < n) particles.push(makeParticle());
        particles.length = n;
        particles.forEach(p => {
            p.x = Math.min(p.x, w);
            p.y = Math.min(p.y, h);
        });
    }

    function drawParticles(dt) {
        ctx.fillStyle = BASE;
        ctx.fillRect(0, 0, w, h);
        glow(w * 0.5, h * 0.3, Math.max(w, h) * 0.7, '59,91,255', 0.16);

        const k = dt / 16;
        const maxD = 130, maxD2 = maxD * maxD;
        particles.forEach(p => {
            p.x += p.vx * k;
            p.y += p.vy * k;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
        });

        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                if (d2 < maxD2) {
                    ctx.strokeStyle = `rgba(120,140,255,${(1 - d2 / maxD2) * 0.35})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            const mx = a.x - mouse.x, my = a.y - mouse.y, md2 = mx * mx + my * my;
            if (md2 < 180 * 180) {
                ctx.strokeStyle = `rgba(150,170,255,${(1 - md2 / (180 * 180)) * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }

        ctx.fillStyle = 'rgba(175,190,255,0.85)';
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // ---------- 3. Waves: плавні світні хвилі ----------
    const waves = [
        { y: 0.62, amp: 60, len: 0.0035, speed: 0.00035, rgb: '59,91,255',  a: 0.55 },
        { y: 0.70, amp: 45, len: 0.0050, speed: 0.00028, rgb: '124,58,237', a: 0.45 },
        { y: 0.55, amp: 35, len: 0.0065, speed: 0.00042, rgb: '6,182,212',  a: 0.35 }
    ];

    function drawWaves(t) {
        ctx.fillStyle = BASE;
        ctx.fillRect(0, 0, w, h);
        glow(w * 0.5, h * 0.65, Math.max(w, h) * 0.6, '59,91,255', 0.14);

        ctx.lineWidth = 1.2;
        waves.forEach((wv, wi) => {
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, `rgba(${wv.rgb},0)`);
            grad.addColorStop(0.5, `rgba(${wv.rgb},${wv.a})`);
            grad.addColorStop(1, `rgba(${wv.rgb},0)`);
            for (let s = 0; s < 7; s++) {
                ctx.globalAlpha = 1 - s * 0.13;
                ctx.strokeStyle = grad;
                ctx.beginPath();
                for (let x = 0; x <= w + 10; x += 10) {
                    const ph = t * wv.speed + wi * 1.7 + s * 0.12;
                    const y = h * wv.y
                        + Math.sin(x * wv.len + ph) * wv.amp
                        + Math.sin(x * wv.len * 2.3 - ph * 1.4) * wv.amp * 0.35
                        + s * 6;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;
    }

    // ---------- 4. Silver: срібні хромові хвилі та комета ----------
    const silverWaves = [
        { y: 0.74, amp: 55, len: 0.0032, speed: 0.00030, rgb: '225,229,236', a: 0.55 },
        { y: 0.82, amp: 42, len: 0.0047, speed: 0.00024, rgb: '160,168,182', a: 0.45 },
        { y: 0.67, amp: 30, len: 0.0061, speed: 0.00038, rgb: '195,201,212', a: 0.30 }
    ];
    const sparks = [];
    const COMET_PERIOD = 9000;

    function silverY(wv, wi, x, t, s) {
        const ph = t * wv.speed + wi * 1.7 + s * 0.12;
        return h * wv.y
            + Math.sin(x * wv.len + ph) * wv.amp
            + Math.sin(x * wv.len * 2.3 - ph * 1.4) * wv.amp * 0.35
            + s * 6;
    }

    function drawSilver(t, dt) {
        // графітова основа
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#16191f');
        bg.addColorStop(1, '#0a0b0e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // металевий відблиск, що повільно проходить по екрану
        const pos = ((t * 0.00004) % 1.6) - 0.3;
        const sheen = ctx.createLinearGradient(0, 0, w, h);
        const clamp = v => Math.min(1, Math.max(0, v));
        sheen.addColorStop(clamp(pos - 0.15), 'rgba(255,255,255,0)');
        sheen.addColorStop(clamp(pos), 'rgba(220,225,235,0.07)');
        sheen.addColorStop(clamp(pos + 0.15), 'rgba(255,255,255,0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, w, h);
        glow(w * 0.5, h * 0.6, Math.max(w, h) * 0.55, '200,210,225', 0.07);

        // хромові хвилі
        ctx.lineWidth = 1.2;
        silverWaves.forEach((wv, wi) => {
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, `rgba(${wv.rgb},0)`);
            grad.addColorStop(0.5, `rgba(${wv.rgb},${wv.a})`);
            grad.addColorStop(1, `rgba(${wv.rgb},0)`);
            ctx.strokeStyle = grad;
            for (let s = 0; s < 9; s++) {
                ctx.globalAlpha = 1 - s * 0.1;
                ctx.beginPath();
                for (let x = 0; x <= w + 10; x += 10) {
                    const y = silverY(wv, wi, x, t, s);
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;

        // комета ковзає над верхньою хвилею
        const p = (t % COMET_PERIOD) / COMET_PERIOD;
        const cometX = x => -150 + x * (w + 300);
        const head = { x: cometX(p), y: silverY(silverWaves[0], 0, cometX(p), t, 0) - 22 };

        ctx.globalCompositeOperation = 'lighter';
        for (let i = 40; i > 0; i--) {
            const q = p - i * 0.004;
            if (q < 0) continue;
            const x = cometX(q);
            const y = silverY(silverWaves[0], 0, x, t, 0) - 22;
            const a = (1 - i / 40) * 0.5;
            ctx.fillStyle = `rgba(225,232,245,${a})`;
            ctx.beginPath();
            ctx.arc(x, y, 2.6 * (1 - i / 40) + 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        const hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 40);
        hg.addColorStop(0, 'rgba(255,255,255,0.95)');
        hg.addColorStop(0.2, 'rgba(220,228,245,0.5)');
        hg.addColorStop(1, 'rgba(220,228,245,0)');
        ctx.fillStyle = hg;
        ctx.fillRect(head.x - 40, head.y - 40, 80, 80);

        // іскри з хвоста
        if (Math.random() < 0.6) {
            sparks.push({
                x: head.x, y: head.y,
                vx: -Math.random() * 1.2, vy: (Math.random() - 0.5) * 1.2,
                life: 1
            });
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.x += s.vx * dt / 16;
            s.y += s.vy * dt / 16;
            s.life -= dt / 900;
            if (s.life <= 0) { sparks.splice(i, 1); continue; }
            ctx.fillStyle = `rgba(235,240,250,${s.life * 0.8})`;
            ctx.fillRect(s.x, s.y, 1.6, 1.6);
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    function draw(t, dt) {
        if (style === 'silver') drawSilver(t, dt);
        else if (style === 'particles') drawParticles(dt);
        else if (style === 'waves') drawWaves(t);
        else drawAurora(t);
    }

    function frame(now) {
        const dt = Math.min(now - last, 50);
        last = now;
        draw(now, dt);
        requestAnimationFrame(frame);
    }

    window.setBackground = function (s) {
        style = s;
        if (reduceMotion) draw(performance.now(), 16);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    resize();
    if (!reduceMotion) requestAnimationFrame(frame);
})();