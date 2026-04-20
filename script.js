// ============================================
// PREMIUM PORTFOLIO — JavaScript
// ============================================

// ---------- Premium Loader ----------
(function initLoader() {
    const loaderBar = document.getElementById('loader-bar');
    const loader = document.getElementById('loader');
    const loaderBrand = document.getElementById('loader-brand');
    const loaderText = document.getElementById('loader-text');
    const loaderTrack = loader ? loader.querySelector('.loader-bar-track') : null;
    const logoEl = document.getElementById('logo');
    let progress = 0;

    // Logo stays hidden until brand flies in
    if (logoEl) logoEl.style.opacity = '0';

    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        if (loaderBar) loaderBar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);

            // Fade out bar & text immediately
            if (loaderTrack) loaderTrack.style.opacity = '0';
            if (loaderText) loaderText.style.opacity = '0';

            // Fly brand name to navbar
            requestAnimationFrame(() => {
                if (!loaderBrand || !logoEl) {
                    if (loader) {
                        loader.style.opacity = '0';
                        loader.style.visibility = 'hidden';
                        setTimeout(() => { loader.style.display = 'none'; }, 500);
                    }
                    if (logoEl) logoEl.style.opacity = '1';
                    handleScrollReveal(); animateSkillBars(); startCounters(); typeEffect();
                    return;
                }

                // Measure logo placeholder position
                // Temporarily make logo visible but transparent to get correct rect
                logoEl.style.visibility = 'hidden';
                logoEl.style.opacity = '1';
                const logoRect = logoEl.getBoundingClientRect();
                logoEl.style.opacity = '0';
                logoEl.style.visibility = 'visible';

                // Measure brand's current on-screen position
                const brandRect = loaderBrand.getBoundingClientRect();

                // Scale from loader size to navbar size
                const targetFontSize = window.innerWidth <= 768 ? 20 : 24;
                const currentFontSize = parseFloat(getComputedStyle(loaderBrand).fontSize);
                const scale = targetFontSize / currentFontSize;

                // Calculate how far brand must travel (top-left to top-left)
                const dx = logoRect.left - brandRect.left;
                const dy = logoRect.top - brandRect.top + (logoRect.height - brandRect.height * scale) / 2;

                // Fade loader bg
                loader.style.background = 'transparent';
                loader.style.pointerEvents = 'none';

                // Pin brand at its exact current screen position with fixed positioning
                // This prevents the jump when switching from flex-child to fixed
                loaderBrand.style.position = 'fixed';
                loaderBrand.style.left = brandRect.left + 'px';
                loaderBrand.style.top = brandRect.top + 'px';
                loaderBrand.style.margin = '0';
                loaderBrand.style.zIndex = '99999';
                loaderBrand.style.transformOrigin = 'left top';

                // Force reflow so fixed position takes effect before animating
                loaderBrand.offsetHeight;

                // Now animate to navbar
                loaderBrand.style.transition = 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)';
                loaderBrand.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

                // When fly completes — seamless handoff
                loaderBrand.addEventListener('transitionend', function onEnd(e) {
                    if (e.propertyName !== 'transform') return;
                    loaderBrand.removeEventListener('transitionend', onEnd);

                    // Kill all transitions for instant changes
                    loaderBrand.style.transition = 'none';
                    logoEl.style.transition = 'none';

                    // Move brand to body so it survives loader removal
                    document.body.appendChild(loaderBrand);

                    // Show real logo behind the brand (same position)
                    logoEl.style.opacity = '1';

                    // Hide loader (brand is safe outside it)
                    loader.style.display = 'none';

                    // Smooth crossfade: dissolve brand to reveal real logo
                    requestAnimationFrame(() => {
                        loaderBrand.style.transition = 'opacity 0.3s ease';
                        loaderBrand.style.opacity = '0';
                        setTimeout(() => loaderBrand.remove(), 350);
                    });

                    handleScrollReveal();
                    animateSkillBars();
                    startCounters();
                    typeEffect();
                });
            });
        }
    }, 100);
})();

// ---------- Particle Canvas ----------
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let w, h;

    function resize() {
        w = canvas.width = canvas.parentElement.offsetWidth;
        h = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.r = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.4 + 0.1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(155, 168, 171, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    const count = Math.min(80, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(74, 92, 106, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawLines();
        animId = requestAnimationFrame(animate);
    }
    animate();

    // Pause when not visible
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animId) animate();
            } else {
                cancelAnimationFrame(animId);
                animId = null;
            }
        });
    });
    observer.observe(canvas);
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
});

// Auto-close mobile menu
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.classList.remove('active');
    });
});

// ---------- Scroll Reveal Animation ----------
function handleScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    const windowHeight = window.innerHeight;

    reveals.forEach(el => {
        const top = el.getBoundingClientRect().top;
        const revealPoint = 80;

        if (top < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
}

window.addEventListener('scroll', handleScrollReveal);
window.addEventListener('resize', handleScrollReveal);

// ---------- Animated Number Counters ----------
let countersStarted = false;

function startCounters() {
    if (countersStarted) return;
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    countersStarted = true;

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
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
// typeEffect is started after loader finishes

// ---------- Scroll to Top on Logo Click ----------
document.getElementById("logo").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---------- Smooth Scroll for All Anchor Links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ---------- Tilt Effect on Cards ----------
function initTilt() {
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
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
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const projects = await response.json();
        const container = document.getElementById('projects-container');

        projects.forEach(project => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            slide.innerHTML = `
                <div class="project-card" data-category="${project.category}">
                    <img src="${project.image}" class="project-img" 
                        alt="${project.title}" loading="lazy">
                    <div class="project-overlay">
                        <h3 class="font-bold text-lg mb-2">${project.title}</h3>
                        <p class="text-sm px-2">${project.description}</p>
                        <div class="flex gap-3">
                            <a href="${project.liveUrl}" target="_blank" rel="noopener">
                                <i class="ri-external-link-line"></i> Live Demo
                            </a>
                            <a href="${project.githubUrl}" target="_blank" rel="noopener">
                                <i class="ri-github-line"></i> GitHub
                            </a>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(slide);
        });

        initSwiper();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// ---------- Initialize Swiper ----------
function initSwiper() {
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        grabCursor: true,
        centeredSlides: false,

        breakpoints: {
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
        },

        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },

        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
    });

    // Filter functionality
    const filterButtons = document.querySelectorAll(".filter-btn");
    const allSlides = document.querySelectorAll(".swiper-slide");

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active-filter"));
            btn.classList.add("active-filter");

            const filterValue = btn.getAttribute("data-filter");

            allSlides.forEach(slide => {
                const card = slide.querySelector(".project-card");
                if (!card) return;
                const category = card.getAttribute("data-category");

                slide.style.display = (filterValue === "all" || filterValue === category) ? "block" : "none";
            });

            swiper.update();
        });
    });
}

// ---------- Project Card Touch/Click for Mobile ----------
document.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;

    const overlay = card.querySelector('.project-overlay');
    const img = card.querySelector('.project-img');
    if (!overlay || !img) return;

    if (e.target.tagName === 'A' || e.target.closest('a')) return;

    const isVisible = overlay.style.opacity === '1';

    document.querySelectorAll('.project-card').forEach(c => {
        const o = c.querySelector('.project-overlay');
        const i = c.querySelector('.project-img');
        if (o) o.style.opacity = '0';
        if (i) { i.style.filter = 'none'; i.style.transform = 'none'; }
    });

    if (!isVisible) {
        overlay.style.opacity = '1';
        img.style.filter = 'blur(3px) brightness(0.5)';
        img.style.transform = 'scale(1.05)';
    }
});

// ---------- Magnetic Button Effect ----------
document.querySelectorAll('.btn-primary, .btn-outline, .btn-submit-pro').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// ---------- Parallax on Scroll ----------
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const orbs = document.querySelectorAll('.hero-orb');
    orbs.forEach((orb, i) => {
        const speed = (i + 1) * 0.03;
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ---------- Refresh Tilt & Cursor on Dynamic Content ----------
function refreshInteractions() {
    initTilt();
}

// Load projects on page load
loadProjects().then(() => {
    setTimeout(refreshInteractions, 500);
});

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

    function includesAny(text, words) {
        return words.some((w) => text.includes(w));
    }

    function scoreIntent(text, words) {
        return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function loadProjects() {
        try {
            const response = await fetch('projects.json');
            if (!response.ok) return;
            const data = await response.json();
            if (Array.isArray(data)) projects = data;
        } catch (e) {
            projects = [];
        }
    }

    function projectSummary() {
        if (!projects.length) {
            return "Aliyan has multiple live portfolio projects in web development, including business, clinic, gym, and tools apps. Ask 'contact' to get his details.";
        }

        const top = projects.slice(0, 6);
        const lines = top.map((p, i) => `${i + 1}. ${p.title} - [Live Demo](${p.liveUrl})`);
        return `Here are some of Aliyan's projects:\n${lines.join('\n')}\n\nIf you want, I can also share GitHub links for these projects.`;
    }

    function projectGithubSummary() {
        if (!projects.length) {
            return `You can check Aliyan's GitHub here: [Aliyan GitHub](${PROFILE.github}).`;
        }

        const withGithub = projects.filter((p) => p.githubUrl && p.githubUrl !== '#').slice(0, 6);
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
                words: ['service', 'offer', 'provide', 'what do you do', 'kya karte ho'],
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
                words: ['timeline', 'delivery time', 'how long', 'deadline', 'duration', 'kitna time'],
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
        if (isOpen) chatInput.focus();
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatToggle.classList.remove('active');
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