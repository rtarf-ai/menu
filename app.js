const App = {
    // ==========================================
    // ตั้งค่าตัวแปรระบบ
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
        adminTab: 'menus'
    },

    // ==========================================
    // การเข้าถึง DOM
    // ==========================================
    elements: {
        app: document.getElementById('app'),
        modal: document.getElementById('news-modal'),
        modalContent: document.getElementById('news-modal-content'),
        modalTitle: document.getElementById('modal-title'),
        modalDate: document.getElementById('modal-date'),
        modalBody: document.getElementById('modal-body')
    },

    // ==========================================
    // เริ่มต้นแอปพลิเคชัน
    // ==========================================
    async init() {
        this.registerServiceWorker();
        this.handleRouting();

        // ตรวจจับการกดปุ่ม Back/Forward ของเบราว์เซอร์
        window.addEventListener('popstate', () => this.handleRouting());
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
            history.pushState(null, '', window.location.pathname); // ลบ query string
            this.loadPublicApp();
        }
    },

    // ==========================================
    // ดึงข้อมูลจาก API
    // ==========================================
    async fetchApiData() {
        try {
            const response = await fetch(`${this.config.scriptUrl}?action=getData`);
            const result = await response.json();
            if(result.status === 'success') {
                this.state.data = result.data;
            }
        } catch (error) {
            this.elements.app.innerHTML = '<p class="text-center text-red-500 mt-10"><i class="fas fa-exclamation-triangle"></i> เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    },

    // ==========================================
    // UI: หน้าผู้ใช้งานทั่วไป
    // ==========================================
    async loadPublicApp() {
        this.elements.app.innerHTML = this.getLoadingHTML('กำลังโหลดข้อมูลองค์กร...');
        await this.fetchApiData();
        this.renderPublicApp();
    },

    renderPublicApp() {
        const { banners, news, menus, departments } = this.state.data;
        const currentDept = this.state.currentDept;
        const filteredMenus = currentDept === 'All' ? menus : menus.filter(m => m.department === currentDept);

        let html = `
            <header class="bg-primary text-white p-5 rounded-b-3xl shadow-lg mb-6 flex justify-between items-center relative overflow-hidden animate-fade-in">
                <div class="relative z-10">
                    <h1 class="text-2xl font-bold tracking-wide">MyMDU.25</h1>
                    <p class="text-sm text-secondary font-medium">นพค.25 สนภ.2 นทพ.</p>
                </div>
                <button onclick="App.navigate('admin')" class="relative z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                    <i class="fas fa-user-shield text-xl"></i>
                </button>
                <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            </header>

            <main class="px-4 animate-scale-up">
                <div class="swiper mySwiper mb-8 shadow-xl rounded-2xl border border-slate-100">
                    <div class="swiper-wrapper">
                        ${banners.map(b => `<div class="swiper-slide cursor-pointer" onclick="window.open('${b.link_url}', '_blank')"><img src="${b.image_url}" alt="Banner"></div>`).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                </div>

                <div class="mb-8">
                    <div class="flex items-center justify-between mb-4 px-1">
                        <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-newspaper text-primary mr-2"></i>ข่าวประกาศ!</h2>
                    </div>
                    <div class="flex flex-col gap-3">
                        ${news.map(n => `
                            <div onclick="App.openNewsModal('${n.id}')" class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all flex items-start gap-4 cursor-pointer group">
                                <div class="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    <i class="fas fa-bullhorn text-xl"></i>
                                </div>
                                <div class="flex-1 pt-0.5">
                                    <div class="flex items-center gap-2 mb-1.5">
                                        <span class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide group-hover:bg-blue-100 group-hover:text-primary transition-colors">ประกาศ</span>
                                        <span class="text-xs text-slate-400 font-medium"><i class="far fa-clock mr-1"></i>${n.date}</span>
                                    </div>
                                    <h3 class="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">${n.title}</h3>
                                </div>
                                <div class="text-slate-200 group-hover:text-primary pt-3 transition-colors">
                                    <i class="fas fa-chevron-right text-sm"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex items-center justify-between mb-4 px-1">
                    <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-th-large text-primary mr-2"></i>ระบบเมนู</h2>
                </div>
                <div class="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-2">
                    <button onclick="App.filterMenus('All')" class="dept-btn shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${currentDept === 'All' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}">ทั้งหมด</button>
                    ${departments.map(d => `<button onclick="App.filterMenus('${d}')" class="dept-btn shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${currentDept === d ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}">${d}</button>`).join('')}
                </div>

                <div id="menu-grid" class="grid grid-cols-3 md:grid-cols-4 gap-4 pb-8">
                    ${this.generateMenuHTML(filteredMenus)}
                </div>
            </main>
        `;
        
        this.elements.app.innerHTML = html;
        
        // กำหนดค่า Swiper หลังจาก Render HTML เสร็จ
        new Swiper(".mySwiper", { 
            pagination: { el: ".swiper-pagination", dynamicBullets: true }, 
            autoplay: { delay: 3500, disableOnInteraction: false }, 
            loop: true, 
            effect: "fade" 
        });
    },

    generateMenuHTML(menus) {
        if (menus.length === 0) return `<div class="col-span-3 md:col-span-4 text-center py-8 text-slate-400 text-sm"><i class="fas fa-folder-open text-2xl mb-2"></i><br>ไม่มีเมนูในหมวดหมู่นี้</div>`;
        return menus.map(m => `
            <a href="${m.link_url}" target="_blank" class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 group">
                <div class="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center text-2xl mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                    <i class="${m.icon || 'fas fa-link'}"></i>
                </div>
                <span class="text-xs text-center font-medium text-slate-700 line-clamp-2">${m.name}</span>
            </a>
        `).join('');
    },

    filterMenus(dept) { 
        this.state.currentDept = dept; 
        this.renderPublicApp(); 
    },

    // ==========================================
    // ระบบ Modal ข่าวสาร
    // ==========================================
    openNewsModal(newsId) {
        const newsItem = this.state.data.news.find(n => n.id === newsId);
        if(!newsItem) return;

        this.elements.modalTitle.innerText = newsItem.title;
        this.elements.modalDate.innerHTML = `<i class="far fa-clock mr-1"></i> ${newsItem.date}`;
        this.elements.modalBody.innerText = newsItem.body || 'ไม่มีรายละเอียดเนื้อหาเพิ่มเติม';
        
        this.elements.modal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.modal.classList.remove('opacity-0');
            this.elements.modalContent.classList.remove('scale-95');
        }, 10);
    },

    closeNewsModal() {
        this.elements.modal.classList.add('opacity-0');
        this.elements.modalContent.classList.add('scale-95');
        
        setTimeout(() => { this.elements.modal.classList.add('hidden'); }, 300);
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
        this.elements.app.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-50 animate-fade-in">
                <div class="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4 shadow-lg rotate-3"><i class="fas fa-user-lock -rotate-3"></i></div>
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
                body: JSON.stringify({ action: 'login', username: e.target.username.value, password: e.target.password.value }) 
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
        this.elements.app.innerHTML = this.getLoadingHTML('กำลังโหลดแผงควบคุม...');
        await this.fetchApiData();
        this.renderAdminDashboard();
    },

    renderAdminDashboard() {
        let contentHTML = '';
        if (this.state.adminTab === 'menus') contentHTML = this.getMenusTabHTML();
        else if (this.state.adminTab === 'banners') contentHTML = this.getBannersTabHTML();
        else if (this.state.adminTab === 'news') contentHTML = this.getNewsTabHTML();

        this.elements.app.innerHTML = `
            <div class="p-4 md:p-6 pb-20 max-w-5xl mx-auto animate-fade-in">
                <div class="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h2 class="text-xl font-bold text-primary flex items-center"><i class="fas fa-cogs mr-2 bg-blue-50 p-2 rounded-lg"></i> แผงควบคุมระบบ</h2>
                    <button onclick="App.logout()" class="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm font-bold cursor-pointer"><i class="fas fa-sign-out-alt"></i> ออกจากระบบ</button>
                </div>

                <div class="flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1 mb-6 overflow-x-auto no-scrollbar">
                    <button onclick="App.changeAdminTab('menus')" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${this.state.adminTab === 'menus' ? 'bg-blue-50 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}"><i class="fas fa-th-large mr-1"></i> จัดการเมนู</button>
                    <button onclick="App.changeAdminTab('banners')" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${this.state.adminTab === 'banners' ? 'bg-blue-50 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}"><i class="fas fa-images mr-1"></i> จัดการแบนเนอร์</button>
                    <button onclick="App.changeAdminTab('news')" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${this.state.adminTab === 'news' ? 'bg-blue-50 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}"><i class="fas fa-bullhorn mr-1"></i> จัดการข่าวสาร</button>
                </div>

                <div class="animate-scale-up">${contentHTML}</div>
                
                <div class="text-center mt-8">
                    <button onclick="App.navigate('public')" class="inline-flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition shadow-lg cursor-pointer border-0"><i class="fas fa-mobile-alt mr-2"></i> กลับไปดูหน้าแสดงผล</button>
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
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <h3 class="font-bold text-slate-700 mb-4 text-lg border-b pb-2"><i class="fas fa-plus-circle text-accent"></i> เพิ่มเมนูนำทางใหม่</h3>
                <form onsubmit="App.submitAction(event, 'addMenu')" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">ชื่อเมนู</label><input type="text" name="name" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" required></div>
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">แผนก</label><input type="text" name="department" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" required></div>
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">ลิงก์ปลายทาง (URL)</label><input type="text" name="link_url" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" required></div>
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">ไอคอน (FontAwesome Class)</label><input type="text" name="icon" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" value="fas fa-link"></div>
                    <div class="md:col-span-2 pt-2"><button type="submit" class="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md cursor-pointer"><i class="fas fa-save mr-1"></i> บันทึกเมนู</button></div>
                </form>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[500px]">
                        <thead><tr class="bg-slate-50 text-xs text-slate-500 uppercase"><th class="py-3 px-4 rounded-tl-lg">เมนู</th><th class="py-3 px-4">แผนก</th><th class="py-3 px-4 text-right rounded-tr-lg">จัดการ</th></tr></thead>
                        <tbody>${this.state.data.menus.map(m => `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="py-3 px-4"><i class="${m.icon} text-primary w-6 text-lg"></i> <span class="font-medium text-sm">${m.name}</span></td><td class="py-3 px-4"><span class="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs shadow-sm">${m.department}</span></td><td class="py-3 px-4 text-right"><button onclick="App.deleteAction('deleteMenu', '${m.id}', '${m.name}')" class="text-red-500 hover:bg-red-100 w-9 h-9 rounded-xl transition shadow-sm border border-red-50 cursor-pointer"><i class="fas fa-trash-alt"></i></button></td></tr>`).join('')}</tbody>
                    </table>
                </div>
            </div>`;
    },

    getBannersTabHTML() {
        return `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <h3 class="font-bold text-slate-700 mb-4 text-lg border-b pb-2"><i class="fas fa-plus-circle text-accent"></i> เพิ่มแบนเนอร์ใหม่</h3>
                <form onsubmit="App.submitAction(event, 'addBanner')" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">ลิงก์รูปภาพ (Image URL)</label><input type="url" name="image_url" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" placeholder="https://..." required></div>
                    <div><label class="block text-xs font-semibold text-slate-500 mb-1">ลิงก์ปลายทางเมื่อคลิก</label><input type="url" name="link_url" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" placeholder="https://..." required></div>
                    <div class="md:col-span-2 pt-2"><button type="submit" class="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md cursor-pointer"><i class="fas fa-save mr-1"></i> บันทึกแบนเนอร์</button></div>
                </form>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[500px]">
                        <thead><tr class="bg-slate-50 text-xs text-slate-500 uppercase"><th class="py-3 px-4 w-32 rounded-tl-lg">รูปภาพ</th><th class="py-3 px-4">ลิงก์ปลายทาง</th><th class="py-3 px-4 text-right rounded-tr-lg">จัดการ</th></tr></thead>
                        <tbody>${this.state.data.banners.map(b => `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="py-3 px-4"><img src="${b.image_url}" class="w-24 h-12 object-cover rounded-md border shadow-sm"></td><td class="py-3 px-4 text-xs text-blue-500 truncate max-w-[200px]"><a href="${b.link_url}" target="_blank" class="hover:underline">${b.link_url}</a></td><td class="py-3 px-4 text-right"><button onclick="App.deleteAction('deleteBanner', '${b.id}', 'แบนเนอร์นี้')" class="text-red-500 hover:bg-red-100 w-9 h-9 rounded-xl transition shadow-sm border border-red-50 cursor-pointer"><i class="fas fa-trash-alt"></i></button></td></tr>`).join('')}</tbody>
                    </table>
                </div>
            </div>`;
    },

    getNewsTabHTML() {
        return `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <h3 class="font-bold text-slate-700 mb-4 text-lg border-b pb-2"><i class="fas fa-plus-circle text-accent"></i> เพิ่มประกาศข่าวสาร</h3>
                <form onsubmit="App.submitAction(event, 'addNews')" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-500 mb-1">หัวข้อข่าว / ประกาศ</label><input type="text" name="title" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" required></div>
                    <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-500 mb-1">วันที่ (ข้อความ)</label><input type="text" name="date" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" placeholder="เช่น 25 มี.ค. 2026" required></div>
                    <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-500 mb-1">เนื้อหาข่าว (พิมพ์ยาวๆ ได้เลย)</label><textarea name="body" rows="4" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none" placeholder="เนื้อหาข่าวแบบเต็ม..."></textarea></div>
                    <div class="md:col-span-2 pt-2"><button type="submit" class="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md cursor-pointer"><i class="fas fa-save mr-1"></i> บันทึกข่าวสาร</button></div>
                </form>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse min-w-[500px]">
                        <thead><tr class="bg-slate-50 text-xs text-slate-500 uppercase"><th class="py-3 px-4 rounded-tl-lg">หัวข้อข่าว</th><th class="py-3 px-4">วันที่</th><th class="py-3 px-4 text-right rounded-tr-lg">จัดการ</th></tr></thead>
                        <tbody>${this.state.data.news.map(n => `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="py-3 px-4 font-medium text-sm text-slate-700">${n.title}</td><td class="py-3 px-4 text-xs text-slate-500">${n.date}</td><td class="py-3 px-4 text-right"><button onclick="App.deleteAction('deleteNews', '${n.id}', '${n.title}')" class="text-red-500 hover:bg-red-100 w-9 h-9 rounded-xl transition shadow-sm border border-red-50 cursor-pointer"><i class="fas fa-trash-alt"></i></button></td></tr>`).join('')}</tbody>
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
                await this.loadAdminDashboard(); // โหลดข้อมูลใหม่หลังจากบันทึก
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
                this.loadAdminDashboard(); // โหลดข้อมูลใหม่หลังจากลบ
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
    getLoadingHTML(text) {
        return `
            <div class="flex h-screen items-center justify-center">
                <div class="text-center animate-fade-in">
                    <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p class="text-slate-500 font-medium animate-pulse">${text}</p>
                </div>
            </div>`;
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/menu/sw.js')
                .then(reg => console.log('Service Worker registered successfully'))
                .catch(err => console.log('Service Worker registration failed: ', err));
        }
    }
};

// เริ่มต้นการทำงานเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => App.init());
