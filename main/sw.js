// โค้ด Service Worker แบบ Network-First (อัปเดตไฟล์ล่าสุดเสมอ)
self.addEventListener('install', (e) => {
  self.skipWaiting(); // บังคับให้อัปเดตทันทีที่มีเวอร์ชันใหม่
});

self.addEventListener('activate', (e) => {
  // ล้างแคชตัวเก่าทิ้งทั้งหมดเมื่อมีการอัปเดตระบบ
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    // 1. พยายามดึงไฟล์ใหม่ล่าสุดจาก Server (GitHub) ก่อน
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        // 2. ถ้าดึงสำเร็จ ให้เอามาอัปเดตทับในแคชด้วย
        caches.open('app-cache-v2').then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // 3. ถ้าดึงไม่สำเร็จ (เน็ตหลุด/ไม่มีสัญญาณ) ค่อยเอาไฟล์จากแคชมาแสดงผล
        return caches.match(e.request);
      })
  );
});
