document.addEventListener('DOMContentLoaded', () => {

    const mainMenu = document.getElementById('main-menu');
    const appViewer = document.getElementById('app-viewer');
    const appIframe = document.getElementById('app-iframe');
    const appTitle = document.getElementById('app-title');
    const backButton = document.getElementById('back-button');

    // ฟังก์ชันเปิดเว็บแอปใน Iframe
    function openApp(url, title) {
        // ซ่อนหน้าเมนู แสดงหน้า viewer
        mainMenu.classList.add('hidden');
        appViewer.classList.remove('hidden');

        // ตั้งค่า Iframe และหัวข้อ
        appIframe.src = url;
        appTitle.textContent = title;
    }

    // ฟังก์ชันกลับไปหน้าเมนู
    function goBackToMenu() {
        // แสดงหน้าเมนู ซ่อนหน้า viewer
        appViewer.classList.add('hidden');
        mainMenu.classList.remove('hidden');

        // เคลียร์ Iframe เพื่อหยุดการทำงานของเว็บแอป
        appIframe.src = 'about:blank';
        appTitle.textContent = '';
    }

    // เพิ่ม Event Listener ให้กับทุกปุ่มเมนู
    document.querySelectorAll('.menu-item').forEach(button => {
        button.addEventListener('click', () => {
            const url = button.dataset.url;
            const title = button.dataset.title;
            openApp(url, title);
        });
    });

    // เพิ่ม Event Listener ให้กับปุ่ม "กลับ"
    backButton.addEventListener('click', goBackToMenu);

});