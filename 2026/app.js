const App = {
    // ==========================================
    // ตั้งค่า URL ของ Web App
    // ==========================================
    config: {
        scriptUrl: 'https://script.google.com/macros/s/AKfycbyb1fm6bZqzRBBKPbVYWPa0HVxtxyO_fa7X60eb7sqvtDG06rF7pGhQiMlh6QPg-u8/exec'
    },

    // ==========================================
    // สถานะส่วนกลาง (State)
    // ==========================================
    state: {
        data: { banners: [], news: [], menus: [], departments: [] },
        currentDept: 'All',
        adminTab: 'menus',
        isLoading: false
    },

    elements: {},

    // ==========================================
    // เริ่มต้นแอปพลิเคชัน
    // ==========================================
    async init() {
        this.cacheElements();
        this.registerServiceWorker();
        this.handleRouting();
        
        // ตรวจจับการกดปุ่มย้อนกลับของเบราว์เซอร์
        window.addEventListener('popstate', () => this.handleRouting());
        
        // ตรวจจับการเปลี่ยนแปลง Hash สำหรับ SPA Navigation
        window.addEventListener('hashchange', () => this.handleRouting());
    },

    // ==========================================
    // Cache DOM Elements เพื่อประสิทธิภาพ
    // ==========================================
    cacheElements() {
        this.elements = {
            app: document.getElementById('app'),
            loading: document.getElementById('loading'),
            loadingText: document.getElementById('loading-text'),
            newsModal: document.getElementById('news-modal'),
            newsModalContent: document.getElementById('news-modal-content'),
            modalTitle: document.getElementById('modal-title'),
            modalDate: document.getElementById('modal-date'),
            modalBody: document.getElementById('modal-body'),
            viewer: document.getElementById('in-app-viewer'),
            viewerFrame: document.getElementById('viewer-frame'),
            viewerTitle: document.getElementById('viewer-title')
        };
    },

    // ==========================================
    // ระบบ Routing สลับหน้าโดยไม่ต้องรีโหลด
    // ==========================================
    handleRouting() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        
        if (page === 'admin') {
            this.checkAdminAuth();
        } else {
            this.loadPublicApp();
        }
    },

    navigate(page) {
        if (page === 'admin') {
            history.pushState(null, '', '?page=admin');
            this.checkAdminAuth();
        } else {
            history.pushState(null, '', window.location.pathname);
            this.loadPublicApp();
        }
    },

    // ==========================================
    // ดึงข้อมูลจาก API
    // ==========================================
    async fetchApiData() {
        try {
            this.state.isLoading = true;
            const response = await fetch(`${this.config.scriptUrl}?action=getData`);
            const result = await response.json();
            
            if(result.status === 'success') {
                this.state.data = result.data;
                return true;
            } else {
                throw new Error(result.message || 'ไม่สามารถดึงข้อมูลได้');
            }
        } catch (error) {
            console.error('API Error:', error);
            this.showError('เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล: ' + error.message);
            return false;
        } finally {
            this.state.isLoading = false;
        }
    },

    // ==========================================
    // แสดงข้อความข้อผิดพลาด
    // ==========================================
    showError(message) {
        if (this.elements.app) {
            this.elements.app.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-red-50">
                    <div class="text-center">
                        <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2 class="text-xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h2>
                        <p class="text-red-600 mb-6">${message}</p>
                        <button onclick="location.reload()" class="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition">
                            <i class="fas fa-redo mr-2"></i>โหลดใหม่
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // ==========================================
    // UI: หน้าผู้ใช้งานทั่วไป
    // ==========================================
    async loadPublicApp() {
        this.showLoading('กำลังโหลดข้อมูลองค์กร...');
        const success = await this.fetchApiData();
        if (success) {
            this.renderPublicApp();
            this.hideLoading();
        }
    },

    // ==========================================
    // UI: หน้าผู้ใช้งานทั่วไป (ปรับปรุงดีไซน์พรีเมียม)
    // ==========================================
    renderPublicApp() {
        if (!this.elements.app) return;

        const { banners, news, menus, departments } = this.state.data;
        const currentDept = this.state.currentDept;
        const filteredMenus = currentDept === 'All' ? menus : menus.filter(m => m.department === currentDept);

        let html = `
            <header class="premium-gradient text-white px-6 pt-8 pb-20 rounded-b-[2.5rem] relative overflow-hidden shrink-0">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div class="absolute top-20 -left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
                
                <div class="relative z-10 flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight">MyMDU<span class="text-accent">.25</span></h1>
                        <p class="text-blue-100 text-xs opacity-80">ระบบปฏิบัติการ นพค.25</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="App.navigate('admin')" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform">
                            <i class="fas fa-user-shield text-sm"></i>
                        </button>
                        <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg border-2 border-white/30">
                            <i class="fas fa-user text-primary text-sm"></i>
                        </div>
                    </div>
                </div>

                <div class="relative z-10">
                    <div class="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl flex items-center px-4 py-3">
                        <i class="fas fa-search text-white/60 mr-3"></i>
                        <input type="text" id="search-input" placeholder="ค้นหาบริการหรือข้อมูล..." class="bg-transparent border-none outline-none text-white placeholder:text-white/60 text-sm w-full">
                    </div>
                </div>
            </header>

            <main class="flex-1 px-6 -mt-12 relative z-20 pb-32 overflow-y-auto no-scrollbar">
                
                <!-- Banners Slider -->
                ${banners.length > 0 ? `
                    <div class="mb-8">
                        <div class="swiper mySwiper card-shadow rounded-[1.5rem] overflow-hidden border border-slate-50">
                            <div class="swiper-wrapper">
                                ${banners.map(b => `
                                    <div class="swiper-slide cursor-pointer active:scale-[0.98] transition-transform" 
                                         onclick="App.openInApp('${this.escapeHtml(b.link_url)}', 'รายละเอียดแบนเนอร์')">
                                        <img src="${this.escapeHtml(b.image_url)}" alt="Banner" class="w-full h-48 md:h-64 object-cover" onerror="this.src='https://images.unsplash.com/photo-1454165833767-027ffea9e778?w=600&h=400&fit=crop'">
                                    </div>
                                `).join('')}
                            </div>
                            <div class="swiper-pagination"></div>
                        </div>
                    </div>
                ` : ''}



                <!-- News Section -->
                ${news.length > 0 ? `
                    <div class="mb-8">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="font-bold text-slate-800 flex items-center">
                                <span class="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center mr-2 shadow-sm"><i class="fas fa-newspaper text-sm"></i></span>
                                ข่าวสารและประกาศ
                            </h2>
                        </div>
                        <div class="flex flex-col gap-3">
                            ${news.slice(0, 5).map(n => `
                                <div onclick="App.openNewsModal('${n.id}')" class="bg-white p-4 rounded-2xl card-shadow border border-slate-100 hover:shadow-soft active:scale-[0.98] transition-all flex items-start gap-4 cursor-pointer">
                                    <div class="w-12 h-12 bg-gradient-to-br from-blue-50 to-slate-100 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm">
                                        <i class="fas fa-bullhorn text-lg"></i>
                                    </div>
                                    <div class="flex-1 pt-0.5">
                                        <div class="flex items-center gap-2 mb-1.5">
                                            <span class="bg-accent/10 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">ประกาศ</span>
                                            <span class="text-[11px] text-slate-400 font-medium"><i class="far fa-clock mr-1"></i>${n.date}</span>
                                        </div>
                                        <h3 class="font-semibold text-slate-700 text-sm leading-snug line-clamp-2">${this.escapeHtml(n.title)}</h3>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Menu Grid -->
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="font-bold text-slate-800 flex items-center">
                            <span class="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center mr-2 shadow-sm"><i class="fas fa-layer-group text-sm"></i></span>
                            แอปพลิเคชัน
                        </h2>
                    </div>
                    
                    ${departments.length > 0 ? `
                        <div class="flex overflow-x-auto gap-2.5 mb-5 no-scrollbar pb-2">
                            <button onclick="App.filterMenus('All')" class="dept-btn shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 active:scale-95 ${currentDept === 'All' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50'}">ทั้งหมด</button>
                            ${departments.map(d => `<button onclick="App.filterMenus('${this.escapeHtml(d)}')" class="dept-btn shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 active:scale-95 ${currentDept === d ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50'}">${this.escapeHtml(d)}</button>`).join('')}
                        </div>
                    ` : ''}

                    <div id="menu-grid" class="grid grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6 pb-12">
                        ${this.generateMenuHTML(filteredMenus)}
                    </div>
                </div>

            </main>
        `;
        
        this.elements.app.innerHTML = html;
        
        // Initialize Swiper
        if (typeof Swiper !== 'undefined' && banners.length > 0) {
            new Swiper(".mySwiper", { 
                pagination: { el: ".swiper-pagination", dynamicBullets: true }, 
                autoplay: { delay: 4000, disableOnInteraction: false }, 
                loop: true, 
                effect: "slide",
                spaceBetween: 10
            });
        }

        // Setup search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    },

    // ==========================================
    // ค้นหาเมนู
    // ==========================================
    handleSearch(query) {
        const { menus } = this.state.data;
        const filtered = menus.filter(m => 
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.department.toLowerCase().includes(query.toLowerCase())
        );
        
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = this.generateMenuHTML(filtered);
        }
    },

    // ==========================================
    // เรนเดอร์ HTML ของเมนูย่อย (Premium Grid Item)
    // ==========================================
    generateMenuHTML(menus) {
        if (menus.length === 0) return `
            <div class="col-span-3 md:col-span-4 flex flex-col items-center justify-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                <div class="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center text-3xl mb-3"><i class="fas fa-folder-open"></i></div>
                <span class="text-slate-400 text-sm font-medium">ไม่มีเมนูในหมวดหมู่นี้</span>
            </div>`;
            
        return menus.map((m, index) => `
            <div onclick="App.openInApp('${this.escapeHtml(m.link_url)}', '${this.escapeHtml(m.name)}')" class="flex flex-col items-center group cursor-pointer active:scale-90 active:opacity-80 transition-all duration-200 animate-fade-in-up" style="animation-delay: ${index * 0.05}s">
                <div class="relative w-16 h-16 md:w-20 md:h-20 mb-2.5 shadow-md group-hover:shadow-soft rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-100 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1">
                    <div class="absolute inset-2 bg-blue-50/50 rounded-xl"></div>
                    <i class="fas ${m.icon || 'fa-link'} text-2xl text-primary relative z-10"></i>
                </div>
                <span class="text-[11px] md:text-xs text-center font-medium text-slate-600 leading-tight line-clamp-2 px-1 transition-colors group-hover:text-primary">
                    ${this.escapeHtml(m.name)}
                </span>
            </div>
        `).join('');
    },

    filterMenus(dept) { 
        this.state.currentDept = dept; 
        this.renderPublicApp(); 
    },

    // ==========================================
    // ระบบ In-App Browser (เปิดเว็บซ้อนในแอป)
    // ==========================================
    openInApp(url, title) {
        if (!this.elements.viewer) return;
        
        // 1. ตั้งค่า Title และเตรียมความพร้อม
        this.elements.viewerTitle.innerText = title || 'กำลังโหลด...';
        this.elements.viewer.classList.remove('hidden');
        this.elements.viewer.classList.add('flex'); // บังคับให้เป็น flex เพื่อการจัดวางที่ถูกต้อง
        
        // 2. ล็อก Scroll ของหน้าหลัก
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';

        // 3. เริ่ม Animation สไลด์เข้า
        requestAnimationFrame(() => {
            this.elements.viewer.classList.remove('translate-x-full');
        });
        
        // 4. โหลด URL ใส่ iframe (หน่วงเวลาเล็กน้อยเพื่อให้ Animation ลื่นไหล)
        setTimeout(() => {
            this.elements.viewerFrame.src = url;
            
            // เมื่อ iframe โหลดเสร็จ ให้เปลี่ยน Title เป็นชื่อจริง (ถ้ามี)
            this.elements.viewerFrame.onload = () => {
                if (title) this.elements.viewerTitle.innerText = title;
            };
        }, 300);
    },

    closeInApp() {
        if (!this.elements.viewer) return;
        
        // 1. เริ่ม Animation สไลด์ออก
        this.elements.viewer.classList.add('translate-x-full');
        
        // 2. คืนค่า Scroll ให้หน้าหลัก
        document.body.style.overflow = '';
        document.body.style.height = '';
        
        // 3. รอให้ Animation จบแล้วค่อยซ่อน
        setTimeout(() => {
            this.elements.viewer.classList.add('hidden');
            this.elements.viewer.classList.remove('flex');
            this.elements.viewerFrame.src = 'about:blank'; 
            this.elements.viewerTitle.innerText = 'กำลังโหลด...';
        }, 300);
    },

    // ==========================================
    // ระบบ Modal ข่าวสาร
    // ==========================================
    openNewsModal(newsId) {
        const newsItem = this.state.data.news.find(n => n.id === newsId);
        if(!newsItem || !this.elements.newsModal) return;

        this.elements.modalTitle.innerText = this.escapeHtml(newsItem.title);
        this.elements.modalDate.innerHTML = `<i class="far fa-clock mr-1"></i> ${this.escapeHtml(newsItem.date)}`;
        this.elements.modalBody.innerText = newsItem.body || 'ไม่มีรายละเอียดเนื้อหาเพิ่มเติม';
        
        this.elements.newsModal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.newsModal.classList.remove('opacity-0');
            this.elements.newsModalContent.classList.remove('scale-95');
        }, 10);
    },

    closeNewsModal() {
        if (!this.elements.newsModal) return;
        this.elements.newsModal.classList.add('opacity-0');
        this.elements.newsModalContent.classList.add('scale-95');
        
        setTimeout(() => { this.elements.newsModal.classList.add('hidden'); }, 300);
    },

    // ==========================================
    // ระบบ Admin
    // ==========================================
    checkAdminAuth() {
        const token = sessionStorage.getItem('adminToken');
        if (token) this.loadAdminDashboard(); 
        else this.renderLogin();
    },

    renderLogin() {
        if (!this.elements.app) return;
        this.elements.app.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-50 animate-fade-in">
                <div class="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4 shadow-lg"><i class="fas fa-user-lock"></i></div>
                        <h2 class="text-2xl font-bold text-slate-800">Admin Login</h2>
                        <p class="text-sm text-slate-500 mt-1">เข้าสู่ระบบจัดการแผงควบคุม</p>
                    </div>
                    <form onsubmit="App.handleLogin(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-1 text-slate-700">ชื่อผู้ใช้</label>
                            <div class="relative"><i class="fas fa-user absolute left-4 top-3.5 text-slate-400"></i><input type="text" id="username" class="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="admin" required></div>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-semibold mb-1 text-slate-700">รหัสผ่าน</label>
                            <div class="relative"><i class="fas fa-lock absolute left-4 top-3.5 text-slate-400"></i><input type="password" id="password" class="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" required></div>
                        </div>
                        <button type="submit" class="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-800 transition-all duration-300">เข้าสู่ระบบ</button>
                    </form>
                    <div class="text-center mt-6">
                        <button onclick="App.navigate('public')" class="text-sm text-slate-500 hover:text-primary transition cursor-pointer bg-transparent border-0"><i class="fas fa-arrow-left"></i> กลับหน้าหลัก</button>
                    </div>
                </div>
            </div>`;
    },

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> กำลังตรวจสอบ...';
        btn.disabled = true;
        
        try {
            const response = await fetch(this.config.scriptUrl, { 
                method: 'POST', 
                body: JSON.stringify({ 
                    action: 'login', 
                    username: e.target.username.value, 
                    password: e.target.password.value 
                }) 
            });
            const result = await response.json();
            
            if (result.status === 'success') { 
                sessionStorage.setItem('adminToken', result.token); 
                this.loadAdminDashboard(); 
            } else { 
                alert(result.message); 
                btn.innerHTML = originalText; 
                btn.disabled = false; 
            }
        } catch (error) { 
            alert('เชื่อมต่อไม่ได้'); 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }
    },

    async loadAdminDashboard() {
        this.showLoading('กำลังโหลดแผงควบคุม...');
        const success = await this.fetchApiData();
        if (success) {
            this.renderAdminDashboard();
            this.hideLoading();
        }
    },

    renderAdminDashboard() {
        if (!this.elements.app) return;
        
        let contentHTML = '';
        if (this.state.adminTab === 'menus') contentHTML = this.getMenusTabHTML();
        else if (this.state.adminTab === 'banners') contentHTML = this.getBannersTabHTML();
        else if (this.state.adminTab === 'news') contentHTML = this.getNewsTabHTML();

        this.elements.app.innerHTML = `
            <div class="min-h-screen bg-slate-50 pb-24 animate-fade-in">
                <!-- Admin Header -->
                <div class="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
                    <div class="max-w-5xl mx-auto flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-slate-800 leading-none">Admin Panel</h2>
                                <p class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">จัดการระบบ MyMDU.25</p>
                            </div>
                        </div>
                        <button onclick="App.logout()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 active:scale-90 transition-all">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="max-w-5xl mx-auto px-4 pt-6">
                    <!-- Tab Navigation -->
                    <div class="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-6 sticky top-[73px] z-20">
                        <button onclick="App.changeAdminTab('menus')" class="flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${this.state.adminTab === 'menus' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}">
                            <i class="fas fa-th-large text-sm"></i>
                            <span>เมนู</span>
                        </button>
                        <button onclick="App.changeAdminTab('banners')" class="flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${this.state.adminTab === 'banners' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}">
                            <i class="fas fa-images text-sm"></i>
                            <span>แบนเนอร์</span>
                        </button>
                        <button onclick="App.changeAdminTab('news')" class="flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${this.state.adminTab === 'news' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}">
                            <i class="fas fa-bullhorn text-sm"></i>
                            <span>ข่าวสาร</span>
                        </button>
                    </div>

                    <!-- Content Area -->
                    <div class="animate-scale-up space-y-6">
                        ${contentHTML}
                    </div>
                    
                    <!-- Footer Action -->
                    <div class="mt-12 pb-8 text-center">
                        <button onclick="App.navigate('public')" class="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 active:scale-95 transition-all shadow-xl shadow-slate-200 border-0">
                            <i class="fas fa-eye mr-2"></i> ดูหน้าแสดงผลจริง
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    changeAdminTab(tab) { 
        this.state.adminTab = tab; 
        this.renderAdminDashboard(); 
    },

    logout() {
        sessionStorage.removeItem('adminToken');
        this.navigate('public');
    },

    // --- HTML Templates สำหรับหน้า Admin ---
    getMenusTabHTML() {
        return `
            <!-- Add Form -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-plus-circle text-primary"></i> เพิ่มเมนูใหม่
                    </h3>
                </div>
                <div class="p-6">
                    <form onsubmit="App.submitAction(event, 'addMenu')" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ชื่อเมนู</label>
                                <input type="text" name="name" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="เช่น ระบบลาพักผ่อน" required>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">แผนก / หมวดหมู่</label>
                                <input type="text" name="department" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="เช่น สำนักงาน" required>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ลิงก์ปลายทาง (URL)</label>
                                <input type="url" name="link_url" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="https://..." required>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ไอคอน (FontAwesome)</label>
                                <div class="relative">
                                    <input type="text" name="icon" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" value="fas fa-link">
                                    <i class="fas fa-icons absolute left-4 top-3.5 text-slate-400"></i>
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-2">
                            <i class="fas fa-save mr-2"></i> บันทึกข้อมูลเมนู
                        </button>
                    </form>
                </div>
            </div>

            <!-- List Table -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-list text-primary"></i> รายการเมนู (${this.state.data.menus.length})
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th class="py-4 px-6 font-bold">ข้อมูลเมนู</th>
                                <th class="py-4 px-6 font-bold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${this.state.data.menus.map(m => `
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="py-4 px-6">
                                        <div class="flex items-center gap-4">
                                            <div class="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0">
                                                <i class="${m.icon || 'fas fa-link'} text-lg"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="font-bold text-slate-700 text-sm truncate">${this.escapeHtml(m.name)}</p>
                                                <p class="text-[11px] text-slate-400 font-medium mt-0.5">${this.escapeHtml(m.department)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-4 px-6 text-right">
                                        <button onclick="App.deleteAction('deleteMenu', '${m.id}', '${this.escapeHtml(m.name)}')" class="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white active:scale-90 transition-all">
                                            <i class="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    getBannersTabHTML() {
        return `
            <!-- Add Form -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-plus-circle text-primary"></i> เพิ่มแบนเนอร์ใหม่
                    </h3>
                </div>
                <div class="p-6">
                    <form onsubmit="App.submitAction(event, 'addBanner')" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ลิงก์รูปภาพ (Image URL)</label>
                                <input type="url" name="image_url" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="https://..." required>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">ลิงก์ปลายทางเมื่อคลิก</label>
                                <input type="url" name="link_url" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="https://..." required>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-2">
                            <i class="fas fa-save mr-2"></i> บันทึกข้อมูลแบนเนอร์
                        </button>
                    </form>
                </div>
            </div>

            <!-- List Table -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-images text-primary"></i> รายการแบนเนอร์ (${this.state.data.banners.length})
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th class="py-4 px-6 font-bold">รูปภาพแบนเนอร์</th>
                                <th class="py-4 px-6 font-bold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${this.state.data.banners.map(b => `
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="py-4 px-6">
                                        <div class="flex items-center gap-4">
                                            <img src="${this.escapeHtml(b.image_url)}" class="w-24 h-14 object-cover rounded-xl border border-slate-100 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1454165833767-027ffea9e778?w=200&h=100&fit=crop'">
                                            <div class="min-w-0">
                                                <p class="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">${this.escapeHtml(b.link_url)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-4 px-6 text-right">
                                        <button onclick="App.deleteAction('deleteBanner', '${b.id}', 'แบนเนอร์นี้')" class="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white active:scale-90 transition-all">
                                            <i class="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    getNewsTabHTML() {
        return `
            <!-- Add Form -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-plus-circle text-primary"></i> เพิ่มประกาศใหม่
                    </h3>
                </div>
                <div class="p-6">
                    <form onsubmit="App.submitAction(event, 'addNews')" class="space-y-4">
                        <div class="space-y-1.5">
                            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">หัวข้อข่าว</label>
                            <input type="text" name="title" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="เช่น แจ้งปิดปรับปรุงระบบชั่วคราว" required>
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">วันที่แสดง</label>
                            <input type="text" name="date" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="เช่น 25 มี.ค. 2026" required>
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">เนื้อหาข่าวสาร</label>
                            <textarea name="body" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all" placeholder="รายละเอียดประกาศ..." required></textarea>
                        </div>
                        <button type="submit" class="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-2">
                            <i class="fas fa-save mr-2"></i> บันทึกข้อมูลประกาศ
                        </button>
                    </form>
                </div>
            </div>

            <!-- List Table -->
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <i class="fas fa-bullhorn text-primary"></i> รายการประกาศ (${this.state.data.news.length})
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th class="py-4 px-6 font-bold">หัวข้อข่าว</th>
                                <th class="py-4 px-6 font-bold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${this.state.data.news.map(n => `
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="py-4 px-6">
                                        <div class="min-w-0">
                                            <p class="font-bold text-slate-700 text-sm truncate">${this.escapeHtml(n.title)}</p>
                                            <p class="text-[11px] text-slate-400 font-medium mt-0.5">${this.escapeHtml(n.date)}</p>
                                        </div>
                                    </td>
                                    <td class="py-4 px-6 text-right">
                                        <button onclick="App.deleteAction('deleteNews', '${n.id}', '${this.escapeHtml(n.title)}')" class="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white active:scale-90 transition-all">
                                            <i class="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    // ==========================================
    // Core Actions (การบันทึก/ลบ ข้อมูล)
    // ==========================================
    async submitAction(e, actionType) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> กำลังบันทึก...';
        btn.disabled = true;

        const formData = new FormData(e.target);
        const payload = { action: actionType };
        formData.forEach((value, key) => payload[key] = value);

        try {
            const response = await fetch(this.config.scriptUrl, { method: 'POST', body: JSON.stringify(payload) });
            const result = await response.json();
            
            if (result.status === 'success') {
                await this.loadAdminDashboard();
            } else { 
                alert('ข้อผิดพลาด: ' + result.message); 
                btn.innerHTML = originalText; 
                btn.disabled = false; 
            }
        } catch (error) { 
            alert('เชื่อมต่อไม่ได้'); 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }
    },

    async deleteAction(actionType, id, nameLabel) {
        if (!confirm(`ยืนยันการลบ: "${nameLabel}" ใช่หรือไม่?`)) return;
        try {
            const response = await fetch(this.config.scriptUrl, { method: 'POST', body: JSON.stringify({ action: actionType, id: id }) });
            const result = await response.json();
            
            if (result.status === 'success') {
                this.loadAdminDashboard();
            } else {
                alert('ข้อผิดพลาด: ' + result.message);
            }
        } catch (error) { 
            alert('เชื่อมต่อไม่ได้'); 
        }
    },

    // ==========================================
    // Utilities
    // ==========================================
    showLoading(text = 'กำลังโหลด...') {
        if (this.elements.loading) {
            // อัปเดตข้อความถ้ามี element รองรับ
            if (this.elements.loadingText) {
                this.elements.loadingText.innerText = text;
            }
            
            // แสดงผลหน้า Loading
            this.elements.loading.style.display = 'flex';
            this.elements.loading.classList.remove('opacity-0', 'pointer-events-none');
            this.elements.loading.classList.add('opacity-100', 'pointer-events-auto');
        }
    },

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.remove('opacity-100', 'pointer-events-auto');
            this.elements.loading.classList.add('opacity-0', 'pointer-events-none');
            
            // รอให้ Animation จบแล้วค่อยซ่อน display เพื่อป้องกันการซ้อนทับ
            setTimeout(() => {
                if (this.elements.loading.classList.contains('opacity-0')) {
                    this.elements.loading.style.display = 'none';
                }
            }, 300);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed: ', err));
        }
    }
};

// เริ่มโหลดแอป
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
