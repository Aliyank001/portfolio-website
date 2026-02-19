// ============================================
// PREMIUM PORTFOLIO — JavaScript
// ============================================

// ---------- Premium Loader ----------
(function initLoader() {
    const loaderBar = document.getElementById('loader-bar');
    const loader = document.getElementById('loader');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        if (loaderBar) loaderBar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (loader) {
                    loader.style.opacity = '0';
                    loader.style.visibility = 'hidden';
                    setTimeout(() => {
                        loader.style.display = 'none';
                        handleScrollReveal();
                        animateSkillBars();
                        startCounters();
                        typeEffect();
                    }, 600);
                }
            }, 400);
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