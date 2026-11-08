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

(function initProjectGallery() {
    const grid = document.getElementById('projects-container');
    if (!grid) return;

    const template = document.getElementById('project-template');
    const status = document.getElementById('project-status');
    const retry = document.getElementById('project-retry');
    const filters = document.querySelector('.gallery-filters');
    const buttons = [...filters.querySelectorAll('button')];
    let activeFilter = 'all';
    let projects;

    function addLink(container, url, label, title) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = label;
        link.setAttribute('aria-label', label + ': ' + title);
        if (url.startsWith('https://') || url.startsWith('http://')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        container.append(link);
    }

    function renderProjects() {
        const visible = projects.filter(project => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'live') return Boolean(safeProjectUrl(project.liveUrl));
            return project.category === activeFilter;
        });
        const cards = visible.map((project, index) => {
            const card = template.content.firstElementChild.cloneNode(true);
            card.style.setProperty('--card-order', Math.min(index, 5));
            card.querySelector('img').src = project.image;
            card.querySelector('h3').textContent = project.title;
            card.querySelector('p').textContent = project.description;
            card.querySelector('.project-category').textContent = project.category === 'deployed' ? 'Client website' : 'Web development';

            const links = card.querySelector('.project-links');
            const live = safeProjectUrl(project.liveUrl);
            const source = safeProjectUrl(project.githubUrl);
            if (live) addLink(links, live, 'Live demo', project.title);
            if (source && new URL(source).hostname === 'github.com') {
                addLink(links, source, 'Source code', project.title);
            }
            if (!links.childElementCount) {
                addLink(links, 'index.html#consultation', 'Ask about this project', project.title);
            }
            return card;
        });
        grid.replaceChildren(...cards);
        status.textContent = visible.length
            ? visible.length + (visible.length === 1 ? ' project' : ' projects')
            : 'No projects match this filter.';
    }

    async function loadGallery() {
        const restoreFocus = document.activeElement === retry;
        retry.hidden = true;
        if (restoreFocus) buttons.find(button => button.dataset.filter === activeFilter).focus();
        status.textContent = 'Loading projects…';
        grid.setAttribute('aria-busy', 'true');
        try {
            const data = await loadProjectData();
            if (!Array.isArray(data)) throw new Error('Invalid project data');
            projects = data;
            renderProjects();
        } catch {
            projects = undefined;
            projectDataPromise = null;
            status.textContent = 'Projects could not load. Please try again.';
            retry.hidden = false;
        } finally {
            grid.removeAttribute('aria-busy');
        }
    }

    filters.hidden = false;
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;
            buttons.forEach(option => {
                const selected = option === button;
                option.classList.toggle('active-filter', selected);
                option.setAttribute('aria-pressed', String(selected));
            });
            if (projects) renderProjects();
        });
    });
    retry.addEventListener('click', loadGallery);
    loadGallery();
})();
