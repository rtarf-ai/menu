// Configuration
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0WDSBVO5NIheRTcsgR56PdhInmy_F7UcjVmlaFlI0oPIVLPl48aWA9wah95U_qHo/exec';
let currentData = {};
let currentSlide = 0;
let slideInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

// Load data from Apps Script
async function loadData() {
    try {
        showLoading();
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
        currentData = await response.json();
        
        renderBanners(currentData.banners);
        renderNews(currentData.news);
        renderDepartments(currentData.menus);
        renderMenus(currentData.menus);
        updateSiteTitle(currentData.config.siteTitle);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// Render Functions
function renderBanners(banners) {
    const container = document.getElementById('bannerContainer');
    const dots = document.getElementById('bannerDots');
    
    if (!banners || banners.length === 0) {
        container.innerHTML = '<div class="banner-slide"><div class="banner-content"><h3>ยินดีต้อนรับ</h3></div></div>';
        return;
    }
    
    container.innerHTML = banners.map((banner, index) => `
        <div class="banner-slide" data-index="${index}">
            <img src="${banner.image}" alt="${banner.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
            <div class="banner-content">
                <h3>${banner.title}</h3>
                <p>${banner.subtitle}</p>
            </div>
            <a href="${banner.link}" class="banner-link" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;"></a>
        </div>
    `).join('');
    
    dots.innerHTML = banners.map((_, index) => `
        <div class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');
    
    // Auto slide
    startSlideShow();
    
    // Dot click
    dots.querySelectorAll('.banner-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToSlide(parseInt(dot.dataset.index));
        });
    });
}

function renderNews(news) {
    const ticker = document.getElementById('newsTicker');
    
    if (!news || news.length === 0) {
        ticker.innerHTML = '<div class="news-item">ไม่มีประกาศข่าวสารในขณะนี้</div>';
        return;
    }
    
    ticker.innerHTML = news.map((item, index) => `
        <div class="news-item" style="animation-delay: ${index * 2}s">
            <strong>${item.title}</strong> - ${item.content.substring(0, 50)}...
        </div>
    `).join('');
}

function renderDepartments(menus) {
    const filter = document.getElementById('deptFilter');
    const departments = [...new Set(menus.map(m => m.department))];
    
    departments.forEach(dept => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.dept = dept;
        btn.textContent = dept;
        filter.appendChild(btn);
    });
}

function renderMenus(menus, filterDept = 'all') {
    const grid = document.getElementById('menuGrid');
    
    let filtered = menus;
    if (filterDept !== 'all') {
        filtered = menus.filter(m => m.department === filterDept || m.department === 'ทั่วไป');
    }
    
    grid.innerHTML = filtered.map(menu => `
        <a href="${menu.url}" class="menu-item" target="_blank" rel="noopener">
            <div class="menu-icon">
                <i class="fas fa-${menu.icon}"></i>
            </div>
            <div class="menu-title">${menu.title}</div>
            <div class="menu-dept">${menu.department}</div>
        </a>
    `).join('');
}

function updateSiteTitle(title) {
    if (title) {
        document.getElementById('siteTitle').textContent = title;
        document.title = title;
    }
}

// Slider Functions
function startSlideShow() {
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % (currentData.banners?.length || 1);
        goToSlide(currentSlide);
    }, 5000);
}

function goToSlide(index) {
    currentSlide = index;
    const container = document.getElementById('bannerContainer');
    container.style.transform = `translateX(-${index * 100}%)`;
    
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Event Listeners
function setupEventListeners() {
    // Department filter
    document.getElementById('deptFilter').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderMenus(currentData.menus, e.target.dataset.dept);
        }
    });
    
    // Pause slider on hover
    document.getElementById('bannerSlider').addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    document.getElementById('bannerSlider').addEventListener('mouseleave', () => {
        startSlideShow();
    });
    
    // Touch swipe for mobile
    let touchStartX = 0;
    const slider = document.getElementById('bannerSlider');
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    slider.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe left - next
                currentSlide = (currentSlide + 1) % (currentData.banners?.length || 1);
            } else {
                // Swipe right - prev
                currentSlide = (currentSlide - 1 + (currentData.banners?.length || 1)) % (currentData.banners?.length || 1);
            }
            goToSlide(currentSlide);
        }
    });
}

// Utility Functions
function showLoading() {
    document.getElementById('menuGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function hideLoading() {
    // Loading is replaced by render
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
