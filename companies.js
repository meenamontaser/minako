// ═══════════════════════════════════════════════════════
//  قائمة الشركات — كل شركة ليها مشروع Firebase خاص بيها
//  رابط الشركة:  رابط-الموقع/?c=الاسم-المختصر
//  (الاسم المختصر: حروف إنجليزي صغيرة بدون مسافات)
// ═══════════════════════════════════════════════════════
window.COMPANY_DEFAULTS = {
  // ── حدود الإعلان الواحد (كل ما قلّلتها وفّرت مساحة) ──
  maxImages: 4,      // أقصى عدد صور للإعلان
  imageKB: 80,       // أقصى حجم للصورة الواحدة بالكيلوبايت (البرنامج بيضغطها لحد الرقم ده)
  thumbKB: 25,       // حجم الصورة المصغرة اللي بتظهر في القائمة
  maxVideoMB: 2,     // أقصى حجم للفيديو بالميجا (بيتضغط تلقائياً، الحد الأعلى 6)
  videoSide: 640,    // أكبر بُعد للفيديو بالبكسل (640 واضح على الموبايل)
  maxVideoSec: 15,   // أقصى مدة للفيديو بالثواني
  pageSize: 20,      // عدد الإعلانات في كل تحميل
  accounts: false    // قسم الحسابات: false = كتالوج فقط، true = كتالوج + حسابات (للشركات اللي تطلبه)
};

window.COMPANIES = {
  meena: {
    name: "شركة MEENA العقارية و التشطيبات",
    accounts: true,                  // شغّل الحسابات للشركة دي (شيله أو خليه false للكتالوج فقط)
    // logo: "logos/meena.png",     // اختياري: لوجو مربع PNG مقاس 512×512
    firebase: {                      // من Firebase ← Project settings ← Your apps ← Web
      apiKey: "AIzaSyBnJzXKB4GMKpSkxbtoEi1YdsjW7HvLpAU",
      authDomain: "nasr-dc8ba.firebaseapp.com",
      projectId: "nasr-dc8ba"
    }
  },
  // company2: { name: "اسم الشركة", logo: "logos/company2.png", firebase: { apiKey:"", authDomain:"", projectId:"", appId:"" } },
};
