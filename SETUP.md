# إعداد شركة جديدة (حوالي 10 دقايق)

## ١) في Firebase (مشروع جديد لكل شركة)
1. console.firebase.google.com ← Add project (باسم الشركة، من غير Analytics).
2. **Build ← Firestore Database ← Create database** ← اختار Production mode ← أقرب منطقة.
3. **Build ← Authentication ← Get started ← Email/Password ← Enable.**
4. **Authentication ← Users ← Add user**: إيميل وكلمة مرور الأدمن بتاعة الشركة.
5. **Authentication ← Settings ← User actions**: اقفل "Enable create (sign-up)" (عشان محدش يسجل حساب).
6. **Firestore ← Rules**: الصق محتوى `firestore.rules` وغيّر الإيميل لإيميل الأدمن ← Publish.
7. **Project settings ← Your apps ← Web (</>)**: سجّل تطبيق، وانسخ apiKey و authDomain و projectId و appId.
8. (اختياري) Authentication ← Settings ← Authorized domains: ضيف دومين GitHub Pages بتاعك.

## ٢) في البرنامج
افتح `companies.js` وضيف سطر الشركة (الاسم المختصر + الاسم + بيانات Firebase من الخطوة 7).
لو عندها لوجو: ملف PNG مربع 512×512 في فولدر `logos` وحط مساره في `logo`.

## ٣) النشر
ارفع الفولدر على GitHub (Pages). رابط الشركة: `https://USER.github.io/REPO/?c=الاسم-المختصر`
