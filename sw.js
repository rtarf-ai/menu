const CACHE_NAME = 'mymdu25-cache-v1.0'; // ถ้ามีการแก้โค้ดครั้งหน้า ให้มาเปลี่ยนเลข v1.0 เป็น v1.1 แคชจะล้างตัวเองทันที

// ไฟล์ที่เราต้องการจำไว้ในเครื่อง
const urlsToCache = [
  '/menu/',
  '/menu/index.html',
  '/menu/style.css',
  '/menu/app.js?v=2',
  '/menu/manifest.json'
];

// ติดตั้ง Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // บังคับให้ SW ตัวใหม่ทำงานทันที
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// เปิดใช้งานและล้างแคชเก่าทิ้ง (สำคัญมาก ป้องกันเว็บค้าง)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('ล้างแคชเก่า:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ระบบจัดการดึงข้อมูล (Network First ปลอดภัยที่สุด)
self.addEventListener('fetch', event => {
  // ไม่แคช API ของ Google Apps Script เด็ดขาด เพราะข้อมูลต้องอัปเดตแบบ Real-time
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // พยายามดึงข้อมูลจากอินเทอร์เน็ตก่อน ถ้าเน็ตหลุดถึงจะไปเอาจาก Cache มาแสดง
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // อัปเดตไฟล์ลง Cache เงียบๆ
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // ถ้าไม่มีอินเทอร์เน็ต ให้ดึงจาก Cache
        return caches.match(event.request);
      })
  );
});
