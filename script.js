// Project card interactions
document.querySelectorAll(".project-card").forEach(card => {
    const img = card.querySelector(".project-img");
    const desc = card.querySelector(".project-desc");

    let isLocked = false;

    // Click to lock/unlock
    img.addEventListener("click", () => {
        isLocked = !isLocked;
        if (isLocked) {
            desc.style.opacity = "1";
            img.style.filter = "blur(4px)";
        } else {
            desc.style.opacity = "0";
            img.style.filter = "none";
        }
    });
});


// Page Loader
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }, 500);
});

// Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Auto-close mobile menu when clicking a link
const mobileMenuLinks = document.querySelectorAll('#mobile-menu a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});


// Typing effect script
const texts = ["Web Developer"];
let count = 0;
let index = 0;
let currentText = '';
let letter = '';

(function type() {
    if (count === texts.length) count = 0;
    currentText = texts[count];
    letter = currentText.slice(0, ++index);
    document.getElementById('typed-text').textContent = letter;
    if (letter.length === currentText.length) {
        count++;
        index = 0;
        setTimeout(type, 1000); // pause before next word
    } else {
        setTimeout(type, 150);
    }
})();


// Scroll to top on logo click
const logo = document.getElementById("logo");
logo.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// Load projects from JSON file
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const projects = await response.json();
        const container = document.getElementById('projects-container');
        
        projects.forEach(project => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            slide.innerHTML = `
                <div class="project-card bg-[#1c1c1c] rounded-xl shadow hover:shadow-lg p-4 transition cursor-pointer hover:scale-105"
                    data-category="${project.category}">
                    
                    <img src="${project.image}" class="project-img rounded-lg mb-4" 
                        alt="${project.title}" loading="lazy">
                    
                    <h3 class="font-semibold text-lg mb-2">${project.title}</h3>
                    
                    <div class="project-overlay rounded-xl">
                        <p class="text-gray-200 mb-4 px-2">
                            ${project.description}
                        </p>
                        <div class="flex gap-4">
                            <a href="${project.liveUrl}" target="_blank" rel="noopener">Live Demo</a>
                            <a href="${project.githubUrl}" target="_blank" rel="noopener">GitHub</a>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(slide);
        });
        
        // Initialize Swiper after projects are loaded
        initSwiper();
        
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Initialize Swiper
function initSwiper() {
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        grabCursor: true,
        centeredSlides: false,

        breakpoints: {
            640: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },

        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },

        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            renderBullet: function (index, className) {
                const totalSlides = this.slides.length;
                const maxDots = 4;

                if (totalSlides <= maxDots) {
                    return '<span class="' + className + '"></span>';
                }

                if (index < maxDots) {
                    return '<span class="' + className + '"></span>';
                } else if (index === maxDots) {
                    const remaining = totalSlides - maxDots;
                    return '<span class="' + className + ' swiper-pagination-plus">+' + remaining + '</span>';
                }

                return '';
            },
        },
    });

    // Filter functionality
    const filterButtons = document.querySelectorAll(".filter-btn");
    const allSlides = document.querySelectorAll(".swiper-slide");

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // active button color change
            filterButtons.forEach(b => {
                b.classList.remove("bg-yellow-500", "text-black");
                b.classList.add("bg-gray-700", "text-white");
            });

            btn.classList.remove("bg-gray-700", "text-white");
            btn.classList.add("bg-yellow-500", "text-black");

            const filterValue = btn.getAttribute("data-filter");

            allSlides.forEach(slide => {
                const category = slide.querySelector(".project-card").getAttribute("data-category");

                if (filterValue === "all" || filterValue === category) {
                    slide.style.display = "block";
                } else {
                    slide.style.display = "none";
                }
            });

            swiper.update();
        });
    });
}

// Load projects when page loads
loadProjects();