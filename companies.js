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

// الشركة اللي تفتح لو الرابط من غير ?c= (رابطك الحالي يفضل شغال)
window.DEFAULT_COMPANY = "meena";

window.COMPANIES = {
  meena: {
    name: "شركة العقارية و التشطيبات",
    accounts: true,                  // شغّل الحسابات للشركة دي (شيله أو خليه false للكتالوج فقط)
    // logo: "logos/meena.png",     // اختياري: لوجو مربع PNG مقاس 512×512
    firebase: {                      // من Firebase ← Project settings ← Your apps ← Web
      apiKey: "AIzaSyBnJzXKB4GMKpSkxbtoEi1YdsjW7HvLpAU",
      authDomain: "nasr-dc8ba.firebaseapp.com",
      projectId: "nasr-dc8ba"
    }
  },
  // ── شركة جاهزة للتجهيز: لما حد يطلبها، غيّر الاسم وحط بيانات Firebase بتاعتها ──
  company2: {
    name: "اسم الشركة",
    accounts: false,        // true لو هتاخد قسم الحسابات
    // logo: "logos/company2.png",
    firebase: { apiKey: "", authDomain: "", projectId: "" }   // فاضية لحد ما تنشئ مشروع Firebase للشركة
  },
};
