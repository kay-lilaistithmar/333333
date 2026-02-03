/* =========================================
   Admin Panel - Glass Style Logic (Updated Store & Support & Withdrawals)
   ========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFzCkQI0jedUl8W9xO1Bwzdg2Rhnxsh-s",
    authDomain: "kj1i-c1d4d.firebaseapp.com",
    projectId: "kj1i-c1d4d",
    storageBucket: "kj1i-c1d4d.firebasestorage.app",
    messagingSenderId: "674856242986",
    appId: "1:674856242986:web:77642057ca6ec2036c5853",
    measurementId: "G-J9QPH9Z1K1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_AUTH = {
    email: "saraameer1022@gmail.com",
    pass: "1998b" // كلمة المرور الافتراضية
};

let currentUser = null; 
let notes = JSON.parse(localStorage.getItem('adminNotes')) || []; 

/* === دوال النظام الأساسية === */
window.adminLogin = function() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;

    // تعديل: التحقق من كلمة المرور المخزنة في الذاكرة أو استخدام الافتراضية
    const storedPass = localStorage.getItem('admin_password') || ADMIN_AUTH.pass;

    if (email === ADMIN_AUTH.email && pass === storedPass) {
        
        // 1. تشغيل الموسيقى (من الثانية 45 + تلاشي تدريجي)
        const audio = document.getElementById('loginMusic');
        if(audio) {
            audio.currentTime = 45; // البدء من الثانية 45
            audio.volume = 0; // البدء بصوت 0
            audio.play().then(() => {
                // كود التلاشي التدريجي (Fade In) خلال 3 ثواني
                let vol = 0;
                const targetVol = 0.8; // الهدف 80%
                const fadeDuration = 3000; 
                const intervalTime = 100;
                const step = targetVol / (fadeDuration / intervalTime);

                const fadeTimer = setInterval(() => {
                    vol += step;
                    if(vol >= targetVol) {
                        vol = targetVol;
                        clearInterval(fadeTimer);
                    }
                    audio.volume = vol;
                }, intervalTime);

            }).catch(e => console.log("Audio Error:", e));
        }

        // 2. إخفاء مودال التسجيل
        document.getElementById('adminLoginModal').style.display = 'none';

        // 3. إظهار شاشة البداية
        const intro = document.getElementById('introOverlay');
        const textDiv = document.getElementById('introText');
        const countDiv = document.getElementById('introCount');
        
        intro.style.display = 'flex';

        // عرض كلمة أحبك لمدة 3 ثواني
        setTimeout(() => {
            textDiv.style.display = 'none'; 
            countDiv.style.display = 'block'; 
            
            let count = 3;
            countDiv.innerText = count;

            const timer = setInterval(() => {
                count--;
                if(count > 0) {
                    countDiv.innerText = count;
                } else {
                    clearInterval(timer);
                    // انتهاء العد
                    intro.style.display = 'none'; 
                    
                    // الدخول للنظام
                    document.getElementById('adminPanel').style.display = 'block';
                    document.getElementById('bottomNav').style.display = 'flex'; 
                    renderPlans(); 
                    renderNotes();
                    listenToWithdrawals(); 
                    listenToSupport(); 
                    loadSettings(); 
                }
            }, 1000); 

        }, 3000); 

    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

window.adminLogout = function() {
    location.reload();
}

window.showTab = function(tabId, el) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(el) el.classList.add('active');
}

/* === منطق المتجر الجديد === */
window.openStoreCheck = function(el) {
    document.getElementById('storeCheckModal').style.display = 'flex';
    // تفعيل التبويب شكلياً
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(el) el.classList.add('active');
}

window.exitStoreCheck = function() {
    document.getElementById('storeCheckModal').style.display = 'none';
    window.showTab('counters', document.querySelector('.nav-item:first-child'));
}

window.enterStoreSystem = function() {
    document.getElementById('storeCheckModal').style.display = 'none';
    const welcome = document.getElementById('storeWelcomeModal');
    welcome.style.display = 'flex';
    
    setTimeout(() => {
        welcome.style.display = 'none';
        document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById('store_admin').classList.add('active');
        // تحميل بيانات المتجر
        loadCategories();
        loadStoreOrders();
    }, 2000);
}

window.showStoreTab = function(subTabId) {
    document.querySelectorAll('.store-subtab').forEach(el => el.style.display = 'none');
    document.getElementById(subTabId).style.display = 'block';
    if(subTabId === 'storeProds') loadProducts();
}

// 1. التصنيفات
window.addCategory = async function() {
    const name = document.getElementById('catName').value;
    if(!name) return alert('أدخل اسم التصنيف');
    
    try {
        await addDoc(collection(db, "store_categories"), {
            name: name,
            createdAt: Date.now()
        });
        document.getElementById('catName').value = '';
        alert('تم حفظ التصنيف');
        loadCategories();
    } catch(e) { console.error(e); alert('خطأ'); }
}

window.loadCategories = async function() {
    const list = document.getElementById('categoriesList');
    const select = document.getElementById('prodCatSelect');
    list.innerHTML = 'جاري التحميل...';
    select.innerHTML = '<option value="">اختر التصنيف</option>';

    const q = query(collection(db, "store_categories"), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    
    list.innerHTML = '';
    
    snap.forEach(doc => {
        const d = doc.data();
        // 3D Cube HTML
        list.innerHTML += `
        <div class="cube-container">
            <div class="cube">
                <div class="face front">${d.name}</div>
                <div class="face back">Keey</div>
                <div class="face right"></div>
                <div class="face left"></div>
                <div class="face top"></div>
                <div class="face bottom"></div>
            </div>
            <button onclick="deleteCategory('${doc.id}')" style="margin-top:10px; background:red; color:white; border:none; border-radius:5px; cursor:pointer;">حذف</button>
        </div>`;
        
        // Populate Select
        select.innerHTML += `<option value="${doc.id}">${d.name}</option>`;
    });
}

window.deleteCategory = async function(id) {
    if(confirm('حذف التصنيف؟')) {
        await deleteDoc(doc(db, "store_categories", id));
        loadCategories();
    }
}

// 2. المنتجات
window.addProduct = async function() {
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const catId = document.getElementById('prodCatSelect').value;
    const label = document.getElementById('prodInputLabel').value;

    if(!name || !price || !catId || !label) return alert('جميع الحقول مطلوبة');

    try {
        await addDoc(collection(db, "store_products"), {
            name, price: Number(price), catId, inputLabel: label, createdAt: Date.now()
        });
        alert('تم حفظ المنتج');
        document.getElementById('prodName').value = '';
        document.getElementById('prodPrice').value = '';
        document.getElementById('prodInputLabel').value = '';
        loadProducts();
    } catch(e) { alert('خطأ'); }
}

window.loadProducts = async function() {
    const list = document.getElementById('productsList');
    list.innerHTML = 'تحميل...';
    const q = query(collection(db, "store_products"), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    list.innerHTML = '';
    
    snap.forEach(doc => {
        const p = doc.data();
        list.innerHTML += `
            <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${p.name}</strong> <br>
                    <small>السعر: ${p.price} IQD | الحقل: ${p.inputLabel}</small>
                </div>
                <button onclick="deleteProduct('${doc.id}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px;">حذف</button>
            </div>
        `;
    });
}

window.deleteProduct = async function(id) {
    if(confirm('حذف المنتج؟')) {
        await deleteDoc(doc(db, "store_products", id));
        loadProducts();
    }
}

// 3. طلبات المتجر
function loadStoreOrders() {
    const list = document.getElementById('ordersList');
    const q = query(collection(db, "store_orders"), orderBy("date", "desc"));
    
    onSnapshot(q, (snap) => {
        list.innerHTML = '';
        if(snap.empty) { list.innerHTML = '<p style="text-align:center; color:white;">لا توجد طلبات</p>'; return; }
        
        snap.forEach(doc => {
            const o = doc.data();
            let statusBadge = o.status === 'pending' ? '<span style="background:orange; padding:2px 8px; border-radius:5px;">قيد الانتظار</span>' : 
                              o.status === 'approved' ? '<span style="background:green; color:white; padding:2px 8px; border-radius:5px;">مقبول</span>' : 
                              '<span style="background:red; color:white; padding:2px 8px; border-radius:5px;">مرفوض</span>';
            
            let buttons = '';
            if(o.status === 'pending') {
                buttons = `
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="updateOrderStatus('${doc.id}', 'approved')" class="btn-glass" style="background:green; flex:1;">موافقة</button>
                    <button onclick="updateOrderStatus('${doc.id}', 'rejected')" class="btn-glass" style="background:red; flex:1;">رفض</button>
                </div>`;
            }

            list.innerHTML += `
            <div class="req-card">
                <div class="req-header">
                    <span>🛒 ${o.productName}</span>
                    <small>${new Date(o.date).toLocaleTimeString()}</small>
                </div>
                <div class="req-body">
                    <p><strong>المستخدم:</strong> ${o.userName} (${o.userId})</p>
                    <p><strong>الرصيد الحالي:</strong> ${o.userBalance}</p>
                    <p><strong>السعر:</strong> ${o.price} IQD</p>
                    <div style="background:#eee; padding:10px; border-radius:5px; margin:5px 0;">
                        <strong>${o.inputLabel}:</strong> <br> ${o.userInput}
                    </div>
                    ${statusBadge}
                    ${buttons}
                </div>
            </div>`;
        });
    });
}

window.updateOrderStatus = async function(id, status) {
    if(!confirm('تأكيد الإجراء؟')) return;
    try {
        await updateDoc(doc(db, "store_orders", id), { status: status });
        alert('تم التحديث');
    } catch(e) { alert('خطأ'); }
}


/* === وظيفة تغيير كلمة المرور (جديد) === */
window.changeAdminPassword = function() {
    const currentInput = document.getElementById('currentAdminPass').value;
    const newInput = document.getElementById('newAdminPass').value;
    
    // جلب كلمة السر الحالية للتأكد
    const savedPass = localStorage.getItem('admin_password') || ADMIN_AUTH.pass;

    if (currentInput !== savedPass) {
        alert("❌ كلمة المرور الحالية غير صحيحة!");
        return;
    }

    if (newInput.length < 4) {
        alert("⚠️ كلمة المرور الجديدة قصيرة جداً (يجب أن تكون 4 أحرف على الأقل).");
        return;
    }

    // حفظ كلمة السر الجديدة
    localStorage.setItem('admin_password', newInput);
    alert("✅ تم تغيير كلمة المرور بنجاح! سيتم اعتمادها في المرة القادمة.");
    
    // تفريغ الخانات
    document.getElementById('currentAdminPass').value = "";
    document.getElementById('newAdminPass').value = "";
}

/* === 1. إدارة العدادات === */
window.toggleAddForm = function() {
    const form = document.getElementById('addPlanForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

window.addNewPlan = async function() {
    const name = document.getElementById('pName').value;
    const price = document.getElementById('pPrice').value;
    const profit = document.getElementById('pProfit').value;
    const stock = document.getElementById('pStock').value;
    const days = document.getElementById('pDays').value;

    if (!name || !price || !stock || !days) return alert('يرجى ملء كافة الحقول بما فيها مدة العداد');

    const newPlan = {
        name: name,
        price: Number(price),
        profit: Number(profit),
        stock: Number(stock),
        days: Number(days),
        sold: 0,
        createdAt: Date.now() 
    };

    try {
        const planId = "PLAN_" + Date.now();
        await setDoc(doc(db, "plans", planId), newPlan);
        alert('تم نشر العداد ✅');
        renderPlans();
        toggleAddForm();
        
        document.getElementById('pName').value = '';
        document.getElementById('pPrice').value = '';
        document.getElementById('pDays').value = '';
    } catch (e) {
        console.error("Error adding plan: ", e);
        alert("حدث خطأ");
    }
}

window.renderPlans = async function() {
    const list = document.getElementById('adminPlansList');
    list.innerHTML = '<p style="text-align:center">جاري جلب البيانات...</p>';
    
    try {
        const q = query(collection(db, "plans")); 
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = '';
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:white;">لا توجد عدادات.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const plan = docSnap.data();
            const planId = docSnap.id;
            
            list.innerHTML += `
                <div class="plan-item">
                    <div>
                        <strong style="color:var(--primary-pink);">${plan.name}</strong> <br>
                        <small>سعر: ${plan.price} | ربح: ${plan.profit} | مدة: ${plan.days || 30} يوم | <span style="color:#2980b9">${plan.sold}/${plan.stock}</span></small>
                    </div>
                    <button onclick="deletePlan('${planId}')" class="btn-glass" style="background:#ff758c; color:white;">حذف</button>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p>فشل التحميل.</p>';
    }
}

window.deletePlan = async function(planId) {
    if(confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, "plans", planId));
            renderPlans(); 
        } catch (e) {
            alert("حدث خطأ");
        }
    }
}

/* === 2. إدارة المستثمرين والفريق === */
window.searchUser = async function() {
    const id = document.getElementById('searchId').value.trim();
    if(!id) return alert("أدخل ID");

    try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentUser = docSnap.data();
            currentUser.dbId = docSnap.id;

            document.getElementById('userResult').style.display = 'block';
            document.getElementById('uName').innerText = currentUser.name;
            document.getElementById('uID').innerText = currentUser.id;
            document.getElementById('uBalance').value = currentUser.balance;
            
            // عرض معلومات القائد
            const refText = currentUser.referredBy ? `(تابع للقائد: ${currentUser.referredBy})` : 'ليس لديه قائد';
            document.getElementById('uReferralInfo').innerText = refText;
            document.getElementById('uLeaderID').value = currentUser.referredBy || '';

        } else {
            alert('المستخدم غير موجود');
            document.getElementById('userResult').style.display = 'none';
        }
    } catch (e) {
        console.error(e);
        alert("خطأ");
    }
}

window.updateBalance = function(direction) {
    let val = parseInt(document.getElementById('uBalance').value) || 0;
    if(direction === 1) val += 1000;
    else val -= 1000;
    document.getElementById('uBalance').value = val;
}

window.saveUserChanges = async function() {
    if(currentUser && currentUser.dbId) {
        const newBalance = parseInt(document.getElementById('uBalance').value);
        try {
            const userRef = doc(db, "users", currentUser.dbId);
            await updateDoc(userRef, {
                balance: newBalance
            });
            alert(`تم الحفظ ✅`);
        } catch (e) {
            alert("فشل الحفظ");
        }
    }
}

// دالة ربط المستخدم بفريق يدوياً
window.linkUserToLeader = async function() {
    if(!currentUser || !currentUser.dbId) return;
    const leaderId = document.getElementById('uLeaderID').value.trim();
    
    if(!leaderId) return alert('يرجى إدخال ID القائد');
    if(leaderId === currentUser.id) return alert('لا يمكن ربط المستخدم بنفسه');

    try {
        // التحقق من وجود القائد
        const leaderRef = doc(db, "users", leaderId);
        const leaderSnap = await getDoc(leaderRef);
        
        if(!leaderSnap.exists()) return alert('القائد غير موجود');

        const userRef = doc(db, "users", currentUser.dbId);
        await updateDoc(userRef, {
            referredBy: leaderId
        });
        alert('تم ربط المستخدم بالقائد بنجاح ✅');
    } catch(e) {
        console.error(e);
        alert("حدث خطأ أثناء الربط");
    }
}

window.banUser = async function() {
    if(currentUser && currentUser.dbId) {
        if(confirm("حظر هذا المستخدم؟")) {
            try {
                const userRef = doc(db, "users", currentUser.dbId);
                await updateDoc(userRef, { status: 'banned' });
                alert('تم الحظر');
            } catch(e) {
                alert("فشل");
            }
        }
    }
}

// === منطق فك الحظر الجديد ===
window.openUnbanModal = function() {
    if(currentUser && currentUser.dbId) {
        document.getElementById('unbanModal').style.display = 'flex';
        // إعادة تعيين محتوى المودال في حال تم تغييره سابقاً
        document.getElementById('unbanContent').innerHTML = `
            <div class="icon-lock" style="font-size: 4rem; margin-bottom: 10px;">🙈</div>
            <h2 style="color:white; margin-bottom:20px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">كولي باسم عزيزي</h2>
            <button onclick="confirmUnbanAction()" class="btn-glass-primary" style="background: linear-gradient(45deg, #ff69b4, #ff1493); width: 100%; font-size: 1.2rem;">فك الحظر</button>
            <button onclick="closeUnbanModal()" style="background:transparent; border:none; color:white; margin-top:15px; cursor:pointer; text-decoration: underline;">إلغاء</button>
        `;
    } else {
        alert("اختر مستخدم أولاً");
    }
}

window.closeUnbanModal = function() {
    document.getElementById('unbanModal').style.display = 'none';
}

window.confirmUnbanAction = async function() {
    if(!currentUser || !currentUser.dbId) return;

    try {
        const userRef = doc(db, "users", currentUser.dbId);
        await updateDoc(userRef, { status: 'active' });
        
        // تغيير محتوى النافذة لإظهار رسالة الشكر مع أنميشن
        const modalContent = document.getElementById('unbanContent');
        modalContent.innerHTML = `
            <div class="icon-lock" style="font-size: 4rem; margin-bottom: 10px; animation: popUp 0.5s infinite alternate;">😌</div>
            <h2 style="color:white; margin-bottom:20px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">شكرا عزيزتي</h2>
            <p style="color:white;">تم فك الحظر بنجاح</p>
        `;
        
        // إغلاق النافذة تلقائياً بعد ثانيتين
        setTimeout(() => {
            closeUnbanModal();
        }, 2000);

    } catch(e) {
        alert("فشل العملية");
        closeUnbanModal();
    }
}

/* === 3. إعدادات السحب === */
window.loadSettings = async function() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if(docSnap.exists()) {
            const data = docSnap.data().methods || {};
            document.getElementById('chkZain').checked = data.zaincash !== false;
            document.getElementById('chkMaster').checked = data.mastercard !== false;
            document.getElementById('chkFIB').checked = data.fib !== false;
            document.getElementById('chkUSDT').checked = data.usdt !== false;
        }
    } catch(e) { console.log("No settings yet"); }
}

window.saveWithdrawSettings = async function() {
    const settings = {
        methods: {
            zaincash: document.getElementById('chkZain').checked,
            mastercard: document.getElementById('chkMaster').checked,
            fib: document.getElementById('chkFIB').checked,
            usdt: document.getElementById('chkUSDT').checked
        }
    };
    try {
        await setDoc(doc(db, "settings", "general"), settings);
        alert('تم حفظ إعدادات السحب ✅');
    } catch(e) {
        alert("فشل الحفظ");
    }
}

/* === 4. الملاحظات والطلبات === */
window.addNote = function() {
    const name = document.getElementById('noteName').value;
    const date = document.getElementById('noteDate').value;
    if(!name) return;

    notes.push({name, date});
    localStorage.setItem('adminNotes', JSON.stringify(notes));
    renderNotes();
}

window.renderNotes = function() {
    const tbody = document.getElementById('notesList');
    tbody.innerHTML = '';
    notes.forEach((n, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${n.name}</td>
                <td>${n.date}</td>
                <td><button onclick="deleteNote(${i})" style="color:red; background:none; border:none; cursor:pointer;">X</button></td>
            </tr>
        `;
    });
}

window.deleteNote = function(i) {
    notes.splice(i, 1);
    localStorage.setItem('adminNotes', JSON.stringify(notes));
    renderNotes();
}

/* === استماع للطلبات مع خيارات الموافقة/الرفض === */
function listenToWithdrawals() {
    const list = document.getElementById('withdrawalsList');
    // الترتيب حسب التاريخ الأحدث
    const q = query(collection(db, "withdrawals"), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        if(snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; width:100%; color:white;">لا توجد طلبات جديدة.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const req = doc.data();
            const dateObj = new Date(req.date);
            const dateStr = dateObj.toLocaleTimeString('ar-EG');
            
            // تحديد الأيقونة
            let icon = '💳';
            if(req.method === 'zaincash') icon = '📱';
            else if(req.method === 'usdt') icon = '💲';
            else if(req.method === 'fib') icon = '🏦';

            // تحديد لون الحالة
            let statusBadge = '';
            let buttons = '';
            
            if(req.status === 'pending') {
                statusBadge = '<span style="background:orange; padding:2px 8px; border-radius:10px; font-size:0.7rem;">جديد</span>';
                buttons = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-done" style="background:green; border-radius:10px;" onclick="updateWithdrawStatus('${doc.id}', 'approved')">موافقة</button>
                        <button class="btn-done" style="background:red; border-radius:10px;" onclick="updateWithdrawStatus('${doc.id}', 'rejected')">رفض</button>
                    </div>
                `;
            } else if(req.status === 'approved') {
                statusBadge = '<span style="background:green; color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem;">تمت الموافقة</span>';
            } else if(req.status === 'rejected') {
                statusBadge = '<span style="background:red; color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem;">مرفوض</span>';
            }

            list.innerHTML += `
            <div class="req-card">
                <div class="req-header">
                    <span>${icon} ${req.userName}</span>
                    <div>${statusBadge} <span style="font-size:0.8rem; opacity:0.9">${dateStr}</span></div>
                </div>
                <div class="req-body">
                    <div class="req-row">
                        <span style="color:#888;">الاسم الحقيقي</span>
                        <span style="font-weight:bold;">${req.realName || 'غير متوفر'}</span>
                    </div>
                    <div class="req-row">
                        <span style="color:#888;">المبلغ</span>
                        <span class="req-val amount">${Number(req.amount).toLocaleString()} IQD</span>
                    </div>
                    <div class="req-row">
                        <span style="color:#888;">الطريقة</span>
                        <span>${req.method}</span>
                    </div>
                    <div class="req-account-box" onclick="copyText('${req.accountNumber}')">
                        ${req.accountNumber} <i class="fas fa-copy"></i>
                    </div>
                    <small>ID: ${req.userId}</small>
                    ${buttons}
                </div>
            </div>
            `;
        });
    });
}

// دالة تحديث الحالة + استرجاع الرصيد عند الرفض
window.updateWithdrawStatus = async function(docId, newStatus) {
    if(confirm(newStatus === 'approved' ? 'تأكيد الموافقة على السحب؟' : 'تأكيد رفض السحب؟')) {
        try {
            // جلب تفاصيل الطلب أولاً لمعرفة المبلغ والمستخدم
            const reqRef = doc(db, "withdrawals", docId);
            const reqSnap = await getDoc(reqRef);

            if (!reqSnap.exists()) return alert("الطلب غير موجود");
            const reqData = reqSnap.data();

            // إذا كانت الحالة "رفض"، نقوم بإرجاع المبلغ للمستخدم
            if (newStatus === 'rejected') {
                 const userRef = doc(db, "users", reqData.userId);
                 await updateDoc(userRef, {
                     balance: increment(reqData.amount) // إعادة الرصيد
                 });
            }

            // تحديث حالة الطلب
            await updateDoc(reqRef, {
                status: newStatus
            });
            
            alert("تم تحديث الحالة" + (newStatus === 'rejected' ? " وتم استرجاع الرصيد للمستخدم." : "."));

        } catch(e) {
            console.error(e);
            alert("حدث خطأ أثناء التحديث.");
        }
    }
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text);
    alert('تم النسخ: ' + text);
}

/* === استماع لرسائل الدعم === */
function listenToSupport() {
    const list = document.getElementById('supportList');
    const q = query(collection(db, "support_tickets"), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        if(snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:white;">لا توجد رسائل.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const msg = doc.data();
            const dateObj = new Date(msg.date);
            const dateStr = dateObj.toLocaleDateString();

            list.innerHTML += `
            <div class="glass-card" style="text-align:right;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${msg.userName}</strong>
                    <span style="font-size:0.8rem; color:#777;">${dateStr}</span>
                </div>
                <div style="background:rgba(255,255,255,0.8); padding:10px; border-radius:10px; margin-bottom:10px;">
                    <p style="margin:0;">${msg.lastMessage}</p>
                </div>
                <div style="font-size:0.85rem; color:#555; margin-bottom:10px;">
                    الرصيد الحالي: <b>${msg.userBalance ? msg.userBalance.toLocaleString() : '---'} IQD</b> <br>
                    ID: ${msg.userId}
                </div>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="reply_${doc.id}" placeholder="اكتب الرد هنا..." style="flex:1; padding:8px; border-radius:5px; border:none;">
                    <button onclick="replyToSupport('${doc.id}')" class="btn-glass-primary">رد</button>
                </div>
                ${msg.adminReply ? `<p style="color:green; font-size:0.8rem; margin-top:5px;">تم الرد: ${msg.adminReply}</p>` : ''}
            </div>
            `;
        });
    });
}

window.replyToSupport = async function(userId) {
    const replyText = document.getElementById('reply_' + userId).value;
    if(!replyText) return;

    try {
        await setDoc(doc(db, "support_tickets", userId), {
            adminReply: replyText,
            hasUnreadReply: true // تفعيل الإشعار للمستخدم
        }, {merge: true});
        alert("تم إرسال الرد");
    } catch(e) {
        alert("فشل الإرسال");
    }
}
