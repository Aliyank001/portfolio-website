// Holographic Lab — animation and interactions
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => !reducedMotion.matches;
if (motionAllowed()) document.documentElement.classList.add('motion-ready');

// Restore the original letter intro and flight into the navigation logo.
(function initBrandIntro() {
    if (!motionAllowed()) return;
    const logo = document.getElementById('logo');
    if (!logo || typeof logo.animate !== 'function') return;
    const overlay = document.createElement('div');
    overlay.className = 'brand-intro';
    overlay.innerHTML = '<div class="intro-content"><div class="intro-brand" aria-label="Aliyan"><span style="--i:0">A</span><span style="--i:1">l</span><span style="--i:2">i</span><span style="--i:3">y</span><span style="--i:4">a</span><span style="--i:5">n</span><span class="intro-dot" style="--i:6">.</span></div><div class="intro-track"><span></span></div><p class="intro-caption">LOADING EXPERIENCE</p></div><button class="intro-skip" type="button">Skip intro <i class="ri-arrow-right-line" aria-hidden="true"></i></button>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('intro-playing');
    const brand = overlay.querySelector('.intro-brand');
    let finished = false;
    let launchTimer, safetyTimer;
    const animations = [];
    function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(launchTimer); clearTimeout(safetyTimer);
        animations.forEach(animation => animation.cancel());
        overlay.remove(); brand.remove();
        document.documentElement.classList.remove('intro-playing');
        reducedMotion.removeEventListener('change', onPreferenceChange);
    }
    function onPreferenceChange() { if (!motionAllowed()) finish(); }
    overlay.querySelector('.intro-skip').addEventListener('click', finish);
    reducedMotion.addEventListener('change', onPreferenceChange);
    safetyTimer = setTimeout(finish, 2600);
    launchTimer = setTimeout(async () => {
        try {
            const start = brand.getBoundingClientRect();
            const target = logo.querySelector('.logo-text').getBoundingClientRect();
            const scale = parseFloat(getComputedStyle(logo.querySelector('.logo-text')).fontSize) / parseFloat(getComputedStyle(brand).fontSize);
            brand.style.position = 'fixed'; brand.style.margin = '0';
            brand.style.left = start.left + 'px'; brand.style.top = start.top + 'px';
            brand.style.width = start.width + 'px'; brand.style.transformOrigin = 'left top';
            document.body.appendChild(brand);
            const backdrop = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 550, fill: 'forwards' });
            const flight = brand.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (target.left - start.left) + 'px,' + (target.top + (target.height - start.height * scale) / 2 - start.top) + 'px) scale(' + scale + ')' }], { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
            animations.push(backdrop, flight);
            await flight.finished;
            if (finished) return;
            document.documentElement.classList.remove('intro-playing');
            const fade = brand.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
            animations.push(fade); await fade.finished; finish();
        } catch { finish(); }
    }, 1000);
})();

// A lightweight perspective-projected globe. No video or WebGL dependency.
(function initHologram() {
    const canvas = document.getElementById('holo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scene = canvas.parentElement;
    let width = 0, height = 0, frame = null, visible = true, angle = 0, lastTime = 0;
    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    const points = [];
    const count = window.innerWidth < 768 ? 460 : 850;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const phi = goldenAngle * i;
        points.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r });
    }
    function resize() {
        width = scene.clientWidth; height = scene.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!motionAllowed()) draw(0);
    }
    function project(x, y, z, radius, rotation) {
        const c = Math.cos(rotation), sn = Math.sin(rotation);
        const rx = x * c - z * sn;
        const rz = x * sn + z * c;
        const tilt = -.24 + pointerY * .08;
        const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
        const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
        const scale = 2.8 / (2.8 - depth * .35);
        return { x: width * .51 + rx * radius * scale, y: height * .48 + ry * radius * scale, z: depth };
    }
    function draw(time) {
        frame = null;
        const delta = lastTime ? Math.min(time - lastTime, 40) : 16;
        lastTime = time;
        if (motionAllowed()) angle += delta * .000075;
        pointerX += (targetX - pointerX) * .045; pointerY += (targetY - pointerY) * .045;
        ctx.clearRect(0, 0, width, height);
        const radius = Math.min(width * .34, height * .35);
        const rotation = angle + pointerX * .16;
        const cx = width * .51, cy = height * .48;
        const glow = ctx.createRadialGradient(cx, cy, radius * .25, cx, cy, radius * 1.4);
        glow.addColorStop(0, '#3843b82b'); glow.addColorStop(.65, '#176cd620'); glow.addColorStop(1, '#09112600');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
        // Meridians and latitude arcs create the layered holographic shell.
        ctx.lineWidth = .65;
        for (let band = -4; band <= 4; band++) {
            const lat = band * Math.PI / 11;
            ctx.beginPath();
            for (let k = 0; k <= 100; k++) {
                const t = k / 100 * Math.PI * 2;
                const p = project(Math.cos(t) * Math.cos(lat), Math.sin(lat), Math.sin(t) * Math.cos(lat), radius, rotation);
                if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = band % 2 ? '#8d81ff4d' : '#4cbdff4d'; ctx.stroke();
        }
        for (let meridian = 0; meridian < 12; meridian++) {
            const longitude = meridian * Math.PI / 6;
            ctx.beginPath();
            for (let k = 0; k <= 90; k++) {
                const t = k / 90 * Math.PI * 2;
                const p = project(Math.cos(longitude) * Math.cos(t), Math.sin(t), Math.sin(longitude) * Math.cos(t), radius, rotation);
                if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = '#558ddd2e'; ctx.stroke();
        }
        // Luminous arcs sweep across the sphere, like layered glass ribbons.
        ctx.save();
        ctx.shadowBlur = window.innerWidth < 768 ? 9 : 15;
        for (let ribbon = 0; ribbon < 3; ribbon++) {
            ctx.beginPath();
            const twist = rotation * .65 + ribbon * 1.75;
            for (let k = 0; k <= 120; k++) {
                const t = k / 120 * Math.PI * 1.55 + twist;
                const y = Math.sin(t) * .7;
                const r = Math.sqrt(1 - y * y);
                const p = project(Math.cos(t * .85 + ribbon) * r, y, Math.sin(t * .85 + ribbon) * r, radius * 1.04, rotation + ribbon);
                if (!k) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = ribbon === 1 ? '#a891ffb3' : '#67dcffb3';
            ctx.shadowColor = ribbon === 1 ? '#8465ff' : '#369aff';
            ctx.lineWidth = ribbon === 1 ? 2 : 1.4; ctx.stroke();
        }
        ctx.restore();
        for (let i = 0; i < points.length; i++) {
            const v = points[i], p = project(v.x, v.y, v.z, radius, rotation);
            const opacity = .16 + (p.z + 1) * .35;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.z > .25 ? 1.25 : .7, 0, Math.PI * 2);
            ctx.fillStyle = i % 4 === 0 ? 'rgba(164,139,255,' + opacity + ')' : 'rgba(99,214,255,' + opacity + ')'; ctx.fill();
            if (i % 73 === 0 && p.z > 0) {
                const light = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 13);
                light.addColorStop(0, '#a3eaff99'); light.addColorStop(1, '#5a95ff00');
                ctx.fillStyle = light; ctx.fillRect(p.x - 13, p.y - 13, 26, 26);
            }
        }
        ctx.beginPath(); ctx.ellipse(cx, cy, radius * 1.03, radius * 1.03, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#819bff50'; ctx.lineWidth = 1; ctx.stroke();
        if (visible && !document.hidden && motionAllowed()) frame = requestAnimationFrame(draw);
    }
    function syncAnimation() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null; lastTime = 0;
        if (visible && !document.hidden) frame = requestAnimationFrame(draw);
        scene.classList.toggle('scene-paused', !visible || document.hidden);
    }
    if (window.matchMedia('(pointer:fine)').matches) scene.addEventListener('pointermove', e => {
        const rect = scene.getBoundingClientRect();
        targetX = (e.clientX - rect.left) / rect.width - .5;
        targetY = (e.clientY - rect.top) / rect.height - .5;
    });
    scene.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
    new ResizeObserver(resize).observe(scene);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }).observe(scene);
    document.addEventListener('visibilitychange', syncAnimation);
    reducedMotion.addEventListener('change', syncAnimation);
    resize(); syncAnimation();
})();

// ---------- Header Scroll Effect ----------
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ---------- Hamburger Menu Toggle ----------
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    menuBtn.classList.toggle('active', !isOpen);
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
});

// Auto-close mobile menu
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        mobileMenu.classList.add('hidden');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
    }
});
window.matchMedia('(min-width:1024px)').addEventListener('change', e => {
    if (e.matches) { mobileMenu.classList.add('hidden'); menuBtn.classList.remove('active'); menuBtn.setAttribute('aria-expanded', 'false'); }
});

// ---------- Scroll Reveal Animation ----------
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('active'); revealObserver.unobserve(entry.target); }
    });
}, { threshold: .08 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children').forEach(el => revealObserver.observe(el));

// ---------- Animated Number Counters ----------
let countersStarted = false;

function startCounters() {
    if (countersStarted) return;
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    countersStarted = true;

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = motionAllowed() ? 1600 : 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = duration ? Math.min(elapsed / duration, 1) : 1;
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            counter.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        }
        requestAnimationFrame(updateCounter);
    });
}

// Trigger counters on scroll if not already triggered
const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) startCounters();
    });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-card').forEach(card => {
    statsObserver.observe(card);
});

// ---------- Skill Bar Animation ----------
function animateSkillBars() {
    const fills = document.querySelectorAll('.skill-fill');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target;
                const width = fill.getAttribute('data-width');
                setTimeout(() => {
                    fill.style.width = width + '%';
                }, 200);
                observer.unobserve(fill);
            }
        });
    }, { threshold: 0.5 });

    fills.forEach(fill => observer.observe(fill));
}

// ---------- Typing Effect ----------
const texts = ["Web Developer", "MERN Stack Developer", "Freelancer", "Problem Solver"];
let count = 0;
let charIndex = 0;
let isDeleting = false;
let typingStarted = false;

function typeEffect() {
    const typedEl = document.getElementById('typed-text');
    if (!motionAllowed()) { if (typedEl) typedEl.textContent = texts[0]; return; }
    if (!typedEl) return;

    // On first call, show the first word instantly, then start deleting after a pause
    if (!typingStarted) {
        typingStarted = true;
        typedEl.textContent = texts[0];
        charIndex = texts[0].length;
        isDeleting = true;
        setTimeout(typeEffect, 1500);
        return;
    }

    const currentWord = texts[count % texts.length];

    if (isDeleting) {
        charIndex--;
        typedEl.textContent = currentWord.slice(0, charIndex);
    } else {
        typedEl.textContent = currentWord.slice(0, charIndex);
        charIndex++;
    }

    let speed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex > currentWord.length) {
        speed = 2500;
        isDeleting = true;
    } else if (isDeleting && charIndex <= 0) {
        isDeleting = false;
        count++;
        charIndex = 0;
        speed = 400;
    }

    setTimeout(typeEffect, speed);
}
// Typing starts with the other progressive enhancements.

// ---------- Scroll to Top on Logo Click ----------
document.getElementById("logo").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'auto' });
});

// ---------- Smooth Scroll for All Anchor Links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.getElementById(href.slice(1));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto' });
        }
    });
});

// ---------- Active Nav Link Highlight ----------
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('header .nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active-link');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active-link');
        }
    });
});

// ---------- Back to Top Button ----------
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'auto' });
    });
}

// ---------- Tilt Effect on Cards ----------
function initTilt() {
    if (!motionAllowed() || !window.matchMedia('(pointer:fine)').matches) return;
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (!motionAllowed()) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}
initTilt();

// ---------- Load Projects from JSON ----------
let projectDataPromise;

function loadProjectData() {
    if (!projectDataPromise) {
        projectDataPromise = fetch('projects.json').then(response => {
            if (!response.ok) throw new Error('Unable to load projects');
            return response.json();
        });
    }
    return projectDataPromise;
}

function safeProjectUrl(value) {
    if (typeof value !== 'string') return null;
    try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
let projectSwiper;
let portfolioProjects = [];
function renderProjects(filter = 'all') {
    const container = document.getElementById('projects-container');
    if (projectSwiper) { projectSwiper.destroy(true, true); projectSwiper = null; }
    container.replaceChildren();
    const filtered = portfolioProjects.filter(project => filter === 'all' || (filter === 'deployed' ? !!safeProjectUrl(project.liveUrl) : project.category === filter));
    filtered.forEach(project => {
        const slide = document.createElement('div'); slide.className = 'swiper-slide';
        const card = document.createElement('article'); card.className = 'project-card';
        const image = document.createElement('img'); image.className = 'project-img'; image.src = project.image; image.alt = project.title; image.loading = 'lazy'; image.width = 640; image.height = 400;
        const body = document.createElement('div'); body.className = 'project-overlay';
        const tag = document.createElement('span'); tag.className = 'project-category'; tag.textContent = project.category === 'deployed' ? 'CLIENT WEBSITE' : 'WEB DEVELOPMENT';
        const title = document.createElement('h3'); title.textContent = project.title;
        const description = document.createElement('p'); description.textContent = project.description;
        const links = document.createElement('div'); links.className = 'flex flex-wrap';
        const live = safeProjectUrl(project.liveUrl), github = safeProjectUrl(project.githubUrl);
        function link(href, label, icon) {
            const a = document.createElement('a'); a.href = href;
            if (!href.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            a.setAttribute('aria-label', label + ': ' + project.title);
            const i = document.createElement('i'); i.className = icon; a.append(i, document.createTextNode(label)); links.appendChild(a);
        }
        if (live) link(live, 'Live demo', 'ri-arrow-right-up-line');
        if (github && new URL(github).hostname === 'github.com') link(github, 'Source code', 'ri-github-line');
        if (!live && !github) link('#consultation', 'Ask about this project', 'ri-chat-1-line');
        body.append(tag, title, description, links); card.append(image, body); slide.appendChild(card); container.appendChild(slide);
    });
    if (typeof Swiper !== 'undefined') projectSwiper = new Swiper('.mySwiper', {
        slidesPerView: 1, spaceBetween: 24, loop: false, grabCursor: true,
        speed: motionAllowed() ? 600 : 0, watchOverflow: true,
        breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        pagination: { el: '.swiper-pagination', clickable: true }
    });
    else container.classList.add('projects-fallback');
}
async function loadProjects() {
    const container = document.getElementById('projects-container');
    try {
        portfolioProjects = await loadProjectData();
        if (!Array.isArray(portfolioProjects)) throw new Error('Invalid project data');
        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
        const message = document.createElement('p'); message.className = 'project-status';
        message.textContent = 'Projects could not load. ';
        const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try again';
        retry.addEventListener('click', () => { projectDataPromise = null; loadProjects(); });
        message.appendChild(retry); container.replaceChildren(message);
    }
}
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.classList.contains('active-filter')));
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active-filter'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active-filter'); btn.setAttribute('aria-pressed', 'true'); renderProjects(btn.dataset.filter);
    });
});

// Load projects on page load
loadProjects();

// ============================================
//  AI CHATBOT — Local (No API Key Needed)
// ============================================
(function () {
    const PROFILE = {
        name: 'Aliyan',
        role: 'Full Stack Web Developer & MERN Stack Developer',
        experience: '2+ years',
        location: 'Pakistan',
        email: 'aliyanbc7@gmail.com',
        whatsapp: '+92 308 3504631',
        website: 'https://www.aaliyankhan.me',
        github: 'https://github.com/Aliyank001',
        linkedin: 'https://www.linkedin.com/in/aliyan-khan-4595a7252'
    };

    const SKILLS_TEXT = 'HTML5, CSS3, JavaScript, React, Node.js, MongoDB, Express.js, Tailwind CSS, Bootstrap, REST APIs, Firebase, Python, Java, Git, GitHub';
    const SERVICES_TEXT = '1) Web Development, 2) MERN Stack Development, 3) Website Refinement (redesign, performance, bug fixing).';

    const FALLBACK_REPLY =
        "I can help with Aliyan's profile, skills, services, projects, timeline, process, pricing, and contact details. Try asking: 'project timeline', 'how do you work', or 'show GitHub projects'.";

    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSuggestions = document.getElementById('chat-suggestions');
    const chatSendBtn = chatForm ? chatForm.querySelector('.chat-send-btn') : null;

    let isSending = false;
    let projects = [];

    function setSendingState(sending) {
        isSending = sending;
        if (chatInput) chatInput.disabled = sending;
        if (chatSendBtn) chatSendBtn.disabled = sending;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalize(text) {
        return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function scoreIntent(text, words) {
        const tokens = ' ' + text.replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
        return words.reduce((score, word) => {
            const matched = tokens.includes(' ' + word + ' ');
            return score + (matched ? word.split(' ').length * 10 + 1 : 0);
        }, 0);
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function loadProjects() {
        try {
            const data = await loadProjectData();
            if (Array.isArray(data)) projects = data;
        } catch (e) {
            projects = [];
        }
    }

    function projectSummary() {
        if (!projects.length) {
            return "Aliyan has multiple live portfolio projects in web development, including business, clinic, gym, and tools apps. Ask 'contact' to get his details.";
        }

        const top = projects.filter(p => safeProjectUrl(p.liveUrl)).slice(0, 6);
        const lines = top.map((p, i) => `${i + 1}. ${p.title} - [Live Demo](${safeProjectUrl(p.liveUrl)})`);
        return `Here are some of Aliyan's projects:\n${lines.join('\n')}\n\nIf you want, I can also share GitHub links for these projects.`;
    }

    function projectGithubSummary() {
        if (!projects.length) {
            return `You can check Aliyan's GitHub here: [Aliyan GitHub](${PROFILE.github}).`;
        }

        const withGithub = projects.filter(p => { const url = safeProjectUrl(p.githubUrl); return url && new URL(url).hostname === 'github.com'; }).slice(0, 6);
        if (!withGithub.length) {
            return `Most projects are available on [Aliyan GitHub](${PROFILE.github}).`;
        }

        const lines = withGithub.map((p, i) => `${i + 1}. ${p.title} - [GitHub](${p.githubUrl})`);
        return `Here are some project source links:\n${lines.join('\n')}\n\nFor more, visit [Aliyan GitHub](${PROFILE.github}).`;
    }

    function getBotReply(rawText) {
        const text = normalize(rawText);
        const intents = [
            {
                key: 'greeting',
                words: ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa'],
                reply: () => `Hi! I am Aliyan's portfolio assistant. You can ask about skills, services, projects, experience, or contact info.`
            },
            {
                key: 'projects',
                words: ['project', 'portfolio', 'work', 'demo', 'website examples'],
                reply: () => projectSummary()
            },
            {
                key: 'project_github',
                words: ['github project', 'source code', 'repo', 'repository', 'code link', 'show github'],
                reply: () => projectGithubSummary()
            },
            {
                key: 'skills',
                words: ['skill', 'tech stack', 'technology', 'tools', 'languages', 'react', 'node', 'mern'],
                reply: () => `Aliyan's main skills: ${SKILLS_TEXT}.`
            },
            {
                key: 'services',
                words: ['what does aliyan do', 'service', 'offer', 'provide', 'what do you do', 'kya karte ho'],
                reply: () => `Aliyan offers: ${SERVICES_TEXT}`
            },
            {
                key: 'hire',
                words: ['hire', 'contact', 'reach', 'call', 'whatsapp', 'email', 'kaise hire', 'work with'],
                reply: () => `You can hire Aliyan via:\n- Email: ${PROFILE.email}\n- WhatsApp: ${PROFILE.whatsapp}\n- LinkedIn: ${PROFILE.linkedin}`
            },
            {
                key: 'pricing',
                words: ['price', 'pricing', 'cost', 'charges', 'budget', 'rate'],
                reply: () => `Pricing depends on project scope and timeline. Aliyan offers competitive rates. Share your requirements on ${PROFILE.email} or WhatsApp ${PROFILE.whatsapp}.`
            },
            {
                key: 'timeline',
                words: ['project timeline', 'timeline', 'delivery time', 'how long', 'deadline', 'duration', 'kitna time'],
                reply: () => `Typical delivery timelines:\n- Landing page: 2-4 days\n- Business website: 5-10 days\n- MERN web app: 2-5 weeks\n\nExact timeline depends on features, revisions, and content readiness.`
            },
            {
                key: 'process',
                words: ['process', 'workflow', 'how do you work', 'steps', 'work process', 'kaise kaam karte ho'],
                reply: () => `Aliyan's working process:\n1. Requirement discussion\n2. Wireframe / planning\n3. Design + development\n4. Feedback & revisions\n5. Final testing + deployment\n\nYou get progress updates throughout the project.`
            },
            {
                key: 'revisions',
                words: ['revision', 'changes', 'edits', 'modify', 'update design'],
                reply: () => `Yes, revisions are included. Small UI/content changes are typically handled quickly during development. Major scope changes are discussed transparently before implementation.`
            },
            {
                key: 'seo_performance',
                words: ['seo', 'speed', 'performance', 'fast', 'optimization', 'google ranking'],
                reply: () => `Aliyan builds with SEO and performance in mind: semantic HTML, responsive layouts, optimized assets, clean structure, and fast-loading pages for better user experience.`
            },
            {
                key: 'maintenance',
                words: ['maintenance', 'support', 'after delivery', 'post launch', 'bug fix support'],
                reply: () => `Yes, post-delivery support is available for bug fixes, small improvements, and future enhancements depending on your project needs.`
            },
            {
                key: 'availability',
                words: ['available', 'freelance', 'open for work', 'taking projects', 'book now'],
                reply: () => `Aliyan is available for freelance work. Share your project idea on ${PROFILE.email} or WhatsApp ${PROFILE.whatsapp} to get started.`
            },
            {
                key: 'about',
                words: ['about', 'who is aliyan', 'experience', 'location', 'education', 'bio'],
                reply: () => `${PROFILE.name} is a ${PROFILE.role} with ${PROFILE.experience} of experience, based in ${PROFILE.location}. He specializes in modern responsive websites and MERN apps.`
            },
            {
                key: 'testimonials',
                words: ['testimonial', 'reviews', 'feedback', 'client says', 'happy clients'],
                reply: () => `Client feedback highlights: professional communication, clean UI, timely delivery, and performance-focused development. Aliyan has worked with 100+ happy clients.`
            },
            {
                key: 'social',
                words: ['github', 'linkedin', 'social', 'profile links'],
                reply: () => `Here are Aliyan's links:\n- Website: ${PROFILE.website}\n- GitHub: ${PROFILE.github}\n- LinkedIn: ${PROFILE.linkedin}`
            }
        ];

        let bestIntent = null;
        let bestScore = 0;
        for (const intent of intents) {
            const score = scoreIntent(text, intent.words);
            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
            }
        }

        if (!bestIntent || bestScore === 0) return FALLBACK_REPLY;
        return bestIntent.reply();
    }

    if (!chatToggle || !chatWindow || !chatClose || !chatForm || !chatInput || !chatMessages) {
        console.warn('Chatbot UI elements are missing. Skipping chatbot initialization.');
        return;
    }

    loadProjects();

    chatToggle.addEventListener('click', () => {
        const isOpen = chatWindow.classList.toggle('open');
        chatToggle.classList.toggle('active', isOpen);
        chatToggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) chatInput.focus();
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatToggle.classList.remove('active');
        chatToggle.setAttribute('aria-expanded', 'false');
        chatToggle.focus();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && chatWindow.classList.contains('open')) chatClose.click();
    });

    if (chatSuggestions) {
        chatSuggestions.addEventListener('click', (e) => {
            const btn = e.target.closest('.chat-suggestion');
            if (!btn) return;
            sendMessage(btn.dataset.msg || '');
        });
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;
        sendMessage(msg);
    });

    function addMessage(text, type, allowHtml = false) {
        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;
        const icon = type === 'bot' ? 'ri-robot-2-line' : 'ri-user-line';
        const messageContent = allowHtml ? text : escapeHtml(text);
        div.innerHTML = `
            <div class="chat-msg-avatar"><i class="${icon}"></i></div>
            <div class="chat-msg-bubble"><p>${messageContent}</p></div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="chat-msg-avatar"><i class="ri-robot-2-line"></i></div>
            <div class="chat-msg-bubble chat-typing">
                <span class="chat-typing-dot"></span>
                <span class="chat-typing-dot"></span>
                <span class="chat-typing-dot"></span>
            </div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    async function sendMessage(text) {
        const trimmedText = String(text || '').trim();
        if (!trimmedText || isSending) return;

        addMessage(trimmedText, 'user');
        chatInput.value = '';
        setSendingState(true);

        if (chatSuggestions) chatSuggestions.style.display = 'none';
        addTypingIndicator();

        try {
            await sleep(350);
            const reply = getBotReply(trimmedText);
            addMessage(formatReply(reply), 'bot', true);
        } catch (err) {
            addMessage(`Something went wrong. Please contact Aliyan at <strong>${PROFILE.email}</strong> or WhatsApp <strong>${PROFILE.whatsapp}</strong>.`, 'bot', true);
        } finally {
            removeTypingIndicator();
            setSendingState(false);
            if (chatWindow.classList.contains('open')) chatInput.focus();
        }
    }

    function formatReply(text) {
        const safeText = escapeHtml(text);
        return safeText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--text-bright); text-decoration: underline;">$1</a>');
    }
})();

// Initialize progressive enhancements after the document is ready.
animateSkillBars();
startCounters();
typeEffect();

reducedMotion.addEventListener('change', () => {
    document.documentElement.classList.toggle('motion-ready', motionAllowed());
    if (!motionAllowed()) document.querySelectorAll('[data-tilt]').forEach(card => card.style.transform = '');
});

// Consultation requests use WhatsApp's click-to-chat link; no message is sent silently.
function buildConsultationUrl(details) {
    const lines = [
        'Hi Aliyan! I would like to request a consultation.', '',
        'Name: ' + details.name,
        'Email: ' + details.email,
        'Service: ' + details.service,
        'Preferred date: ' + details.date,
        'Preferred time: ' + details.time,
        'Time zone: ' + details.timezone,
        '', 'Project details:', details.message, '',
        'Please confirm your availability for this time.'
    ];
    return 'https://wa.me/923083504631?text=' + encodeURIComponent(lines.join('\n'));
}
(function initConsultation() {
    const form = document.getElementById('consultation-form');
    if (!form) return;
    const dateInput = document.getElementById('booking-date');
    const timezoneInput = document.getElementById('booking-timezone');
    const fallback = document.getElementById('booking-fallback');
    const status = document.getElementById('booking-status');
    function localToday() {
        const now = new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    }
    function updateMinimumDate() { dateInput.min = localToday(); }
    updateMinimumDate();
    form.querySelector('button[type=submit]').disabled = false;
    try { timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* Manual entry stays available. */ }
    form.addEventListener('focusin', updateMinimumDate);
    form.addEventListener('input', () => {
        fallback.hidden = true; status.textContent = '';
        form.querySelectorAll('[data-trim-invalid]').forEach(input => { input.setCustomValidity(''); delete input.dataset.trimInvalid; });
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        updateMinimumDate();
        for (const input of form.querySelectorAll('input[required], textarea[required]')) {
            if (!input.value.trim()) {
                input.setCustomValidity('Please enter a value.'); input.dataset.trimInvalid = 'true';
            }
        }
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const details = {
            name: String(data.get('client_name')).trim(), email: String(data.get('client_email')).trim(),
            service: String(data.get('service')).trim(), date: String(data.get('preferred_date')),
            time: String(data.get('preferred_time')), timezone: String(data.get('timezone')).trim(),
            message: String(data.get('project_details')).trim()
        };
        const url = buildConsultationUrl(details);
        fallback.href = url; fallback.hidden = false;
        status.textContent = 'Your request is ready. Tap Send in WhatsApp to share it. If WhatsApp did not open, use the link below.';
        window.open(url, '_blank', 'noopener,noreferrer');
    });
})();
