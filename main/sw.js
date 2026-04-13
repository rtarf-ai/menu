// โค้ด Service Worker แบบ Network-First (อัปเดตไฟล์ล่าสุดเสมอ)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 1. ตรวจสอบว่าเป็น POST Request ให้ข้ามระบบ Cache ไปเลย
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // 2. ถ้าเป็น GET Request (โหลดไฟล์เว็บ, รูปภาพ) ให้ทำ Network-First ตามปกติ
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // อัปเดต Cache เฉพาะเมื่อ Request สำเร็จและเป็น GET
        const clone = response.clone();
        caches.open('app-cache-v3').then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // ถ้าเน็ตหลุด ค่อยเอาไฟล์จากแคชมาแสดงผล
        return caches.match(e.request);
      })
  );
});
