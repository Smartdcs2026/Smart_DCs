// /*************************************************************
//  * app.js — VISITOR DC-SPLIT (GitHub Pages) — FULL PACKAGE
//  * -----------------------------------------------------------
//  * ✅ JSONP เรียก Google Apps Script Web App (ไม่ติด CORS)
//  * ✅ Mobile-first SweetAlert QR
//  * ✅ บันทึกข้อมูลสำเร็จก่อน แล้วค่อยแสดง QR
//  * ✅ ดาวน์โหลดเป็น "ภาพทั้งการ์ด" ตามที่แสดงใน SweetAlert
//  * ✅ หลังปิด QR ให้เด้ง privacy ซ้ำทุกครั้ง
//  * ✅ เอาปุ่มคัดลอกรหัสออก
//  * ✅ เอาปุ่มปิดออกจากด้านล่าง
//  *
//  * Requires in index.html:
//  * - jQuery
//  * - SweetAlert2
//  * - qrcodejs
//  * - html2canvas
//  *************************************************************/

// /***********************
//  * GitHub Frontend Config
//  ***********************/
// const CFG = {
//   GAS_URL: 'https://script.google.com/macros/s/AKfycbxYsepGAWnvvxM8lS68fQJgxMBF_7aDcF_-f6qX_RdA3-j8FhWLHoR-KgyYF2U2iGg7xA/exec',
//   SECRET: 'CHANGE_ME_SUPER_SECRET_906',
//   ORIGIN: window.location.origin,
//   JSONP_TIMEOUT_MS: 15000,

//   PRIVACY_ONCE_PER_SESSION: false,
//   PRIVACY_PRELOAD_TIMEOUT_MS: 1200,

//   DOWNLOAD_PREFIX: 'visitor',
//   PRIVACY_IMG_URL: 'https://lh5.googleusercontent.com/d/1yR7QQHgqPNOhOOVKl7jGK_yrMf7UOYxn',

//   COMPANY_FALLBACK: [
//     "CPAXTRA", "Smart DC", "Makro", "CPF", "ALL Now", "Linfox",
//     "บุคคลภายนอก", "หน่วยงานราชการ", "คนลงสินค้า", "อื่นๆ"
//   ],

//   AUTO_ID_PREFIX: 'DCs01'
// };

// /***********************
//  * Utilities
//  ***********************/
// function escapeHtml(s) {
//   return String(s ?? '')
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function downloadDataUrl(dataUrl, filename) {
//   const a = document.createElement('a');
//   a.href = dataUrl;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
// }

// function createToast() {
//   return Swal.mixin({
//     toast: true,
//     position: 'top',
//     showConfirmButton: false,
//     timer: 1400,
//     timerProgressBar: true
//   });
// }

// function safeFileName(name) {
//   return String(name || 'download')
//     .replace(/[\\/:*?"<>|]+/g, '_')
//     .replace(/\s+/g, '_')
//     .slice(0, 120);
// }

// /***********************
//  * ดาวน์โหลด "ทั้งการ์ด" ตามที่เห็นใน SweetAlert
//  ***********************/
// async function downloadElementAsPng(element, filename) {
//   if (!element) throw new Error('ไม่พบ element สำหรับดาวน์โหลด');
//   if (typeof html2canvas !== 'function') {
//     throw new Error('ไม่พบไลบรารี html2canvas');
//   }

//   const canvas = await html2canvas(element, {
//     backgroundColor: '#ffffff',
//     scale: Math.max(2, window.devicePixelRatio || 1),
//     useCORS: true,
//     logging: false
//   });

//   const dataUrl = canvas.toDataURL('image/png');
//   downloadDataUrl(dataUrl, filename);
// }

// /***********************
//  * JSONP Helper (No CORS)
//  ***********************/
// function jsonpRequest(params) {
//   return new Promise((resolve, reject) => {
//     const cb = `__cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
//     const script = document.createElement('script');

//     const q = new URLSearchParams({
//       ...params,
//       secret: CFG.SECRET,
//       origin: CFG.ORIGIN,
//       callback: cb
//     });

//     let done = false;

//     const timer = setTimeout(() => {
//       if (done) return;
//       done = true;
//       cleanup();
//       reject(new Error('JSONP timeout / GAS ช้าเกินไป'));
//     }, CFG.JSONP_TIMEOUT_MS);

//     function cleanup() {
//       clearTimeout(timer);
//       try {
//         delete window[cb];
//       } catch (_) {
//         window[cb] = undefined;
//       }
//       if (script && script.parentNode) script.parentNode.removeChild(script);
//     }

//     window[cb] = (resp) => {
//       if (done) return;
//       done = true;
//       cleanup();

//       if (!resp || resp.ok !== true) {
//         reject(new Error(resp?.error || 'API error'));
//         return;
//       }
//       resolve(resp.data);
//     };

//     script.onerror = () => {
//       if (done) return;
//       done = true;
//       cleanup();
//       reject(new Error('Network error / GAS unreachable'));
//     };

//     script.src = `${CFG.GAS_URL}?${q.toString()}`;
//     document.head.appendChild(script);
//   });
// }

// function api(action, payload = null) {
//   const params = { action };
//   if (payload != null) params.payload = JSON.stringify(payload);
//   return jsonpRequest(params);
// }

// function preloadImage(url, timeoutMs = 1200) {
//   return new Promise((resolve) => {
//     if (!url) return resolve(false);

//     const img = new Image();
//     let done = false;

//     const t = setTimeout(() => {
//       if (done) return;
//       done = true;
//       resolve(false);
//     }, Math.max(200, timeoutMs || 1200));

//     img.onload = () => {
//       if (done) return;
//       done = true;
//       clearTimeout(t);
//       resolve(true);
//     };

//     img.onerror = () => {
//       if (done) return;
//       done = true;
//       clearTimeout(t);
//       resolve(false);
//     };

//     img.src = url;
//   });
// }

// function shouldShowPrivacy() {
//   if (!CFG.PRIVACY_ONCE_PER_SESSION) return true;
//   return sessionStorage.getItem('privacy_ack_v1') !== '1';
// }

// function markPrivacyAck() {
//   if (!CFG.PRIVACY_ONCE_PER_SESSION) return;
//   sessionStorage.setItem('privacy_ack_v1', '1');
// }

// /***********************
//  * เรียกตอนเปิดหน้า
//  ***********************/
// async function showPrivacyFast() {
//   if (!shouldShowPrivacy()) {
//     const form = document.getElementById('registration-form');
//     if (form) form.style.display = 'block';
//     return;
//   }

//   const form = document.getElementById('registration-form');
//   if (form) form.style.display = 'none';

//   await preloadImage(CFG.PRIVACY_IMG_URL, CFG.PRIVACY_PRELOAD_TIMEOUT_MS);
//   showPrivacyMessage();
// }

// /***********************
//  * Privacy Popup
//  ***********************/
// function showPrivacyMessage() {
//   const imgUrl = CFG.PRIVACY_IMG_URL;

//   const html = `
//     <div style="padding:6px;">
//       <div style="border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);margin-bottom:10px;">
//         <a href="${imgUrl}" target="_blank" rel="noopener">
//           <img src="${imgUrl}" alt="กฎระเบียบความปลอดภัย" style="width:100%;display:block;">
//         </a>
//       </div>

//       <ol style="margin:0 12px 12px;padding-left:18px;color:#1f2937;font-size:14px;line-height:1.55">
//         <li>ให้ท่านศึกษากฎระเบียบความปลอดภัยการเข้าพื้นที่คลังสินค้าอย่างละเอียด</li>
//         <li>ข้าฯ ยินยอมเปิดเผยข้อมูลส่วนบุคคล</li>
//         <li>ข้าฯ จะยึดถือปฏิบัติกฎระเบียบความปลอดภัยอย่างเคร่งครัด</li>
//       </ol>

//       <label style="display:flex;justify-content:center;align-items:center;gap:10px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;">
//         <input type="radio" id="ackRadio" name="ack" />
//         <span>รับทราบกฎระเบียบความปลอดภัย</span>
//       </label>
//     </div>
//   `;

//   const form = document.getElementById('registration-form');
//   if (form) form.style.display = 'none';

//   let acknowledged = false;

//   Swal.fire({
//     title: 'Visitor เข้า-ออกพื้นที่ QR Code',
//     html,
//     showConfirmButton: false,
//     showCancelButton: false,
//     showCloseButton: false,
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     allowEnterKey: false,
//     didOpen: () => {
//       const r = document.getElementById('ackRadio');
//       if (!r) return;

//       r.onchange = null;
//       r.addEventListener('change', function () {
//         if (this.checked) {
//           acknowledged = true;
//           markPrivacyAck();
//           Swal.close();
//         }
//       }, { once: true });
//     },
//     willClose: () => {
//       if (acknowledged) {
//         if (form) {
//           form.style.display = 'block';
//           form.reset();
//         }
//         $('#companyOtherWrap').hide();
//         document.getElementById('fullName')?.focus();
//       }
//     }
//   });
// }

// /***********************
//  * Generate Unique ID
//  ***********************/
// const usedIds = new Set();

// function generateUniqueId() {
//   const chars = "0123456789";
//   let id = "";

//   do {
//     id = CFG.AUTO_ID_PREFIX;
//     for (let i = 0; i < 9; i++) {
//       id += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//   } while (usedIds.has(id));

//   usedIds.add(id);
//   return id;
// }

// /***********************
//  * QR DataURL Generator
//  ***********************/
// function waitFrame() {
//   return new Promise(resolve => requestAnimationFrame(() => resolve()));
// }

// async function makeQrDataUrl(text) {
//   if (typeof QRCode !== 'function') {
//     throw new Error('ไม่พบไลบรารี qrcodejs (QRCode)');
//   }

//   const host = document.createElement('div');
//   host.style.position = 'fixed';
//   host.style.left = '-99999px';
//   host.style.top = '-99999px';
//   host.style.width = '512px';
//   host.style.height = '512px';
//   document.body.appendChild(host);

//   try {
//     new QRCode(host, {
//       text: String(text),
//       width: 512,
//       height: 512,
//       correctLevel: QRCode.CorrectLevel.M
//     });

//     await waitFrame();
//     await waitFrame();

//     const canvas = host.querySelector('canvas');
//     if (canvas) return canvas.toDataURL('image/png');

//     const img = host.querySelector('img');
//     if (img && img.src) return img.src;

//     throw new Error('สร้าง QR ไม่สำเร็จ (ไม่พบ canvas/img)');
//   } finally {
//     try {
//       host.remove();
//     } catch (_) {}
//   }
// }

// /***********************
//  * Load DC Options
//  ***********************/
// async function loadDCOptions() {
//   const list = await api('getDCOptions');
//   const sel = document.getElementById('dcSelect');
//   if (!sel) throw new Error('ไม่พบ element #dcSelect');

//   sel.innerHTML = `<option value="">-- เลือก DC --</option>`;

//   (list || []).forEach(item => {
//     const opt = document.createElement('option');
//     opt.value = item.dc;
//     opt.textContent = `${item.dc} - ${item.name}`;
//     opt.dataset.name = item.name;
//     sel.appendChild(opt);
//   });

//   $('#dcSelect').off('change').on('change', function () {
//     $(this).removeClass('invalid');
//   });
// }

// /***********************
//  * Load Company Options
//  ***********************/
// async function loadCompanyOptions() {
//   let options = [];
//   try {
//     options = await api('getRadioOptions');
//   } catch (_) {
//     options = [];
//   }

//   const container = document.getElementById('companyGroup');
//   if (!container) throw new Error('ไม่พบ element #companyGroup');

//   container.innerHTML = "";

//   const list = (options && options.length) ? options : CFG.COMPANY_FALLBACK;

//   list.forEach(opt => {
//     const safeOpt = String(opt);
//     const id = "company_" + safeOpt.replace(/\s+/g, "_");
//     const label = document.createElement("label");
//     label.className = "radio-chip";
//     label.innerHTML = `
//       <input type="radio" name="company" value="${escapeHtml(safeOpt)}" id="${escapeHtml(id)}" required />
//       <span class="radio-dot"></span> ${escapeHtml(safeOpt)}
//     `;
//     container.appendChild(label);
//   });

//   $('input[name="company"]').off('change').on('change', function () {
//     $('#companyGroup').removeClass('invalid');

//     if (this.value === 'อื่นๆ') {
//       $('#companyOtherWrap').slideDown(120);
//       $('#companyOther').attr('required', true).focus();
//     } else {
//       $('#companyOtherWrap').slideUp(120);
//       $('#companyOther').val('').removeAttr('required').removeClass('invalid');
//     }
//   });
// }

// /***********************
//  * Validation + Filters
//  ***********************/
// function markInvalid(sel) {
//   $(sel).addClass('invalid');
// }

// function clearInvalid() {
//   $('.invalid').removeClass('invalid');
// }

// function validateForm() {
//   const errors = [];
//   let first = null;

//   const dc = $('#dcSelect').val();
//   if (!dc) {
//     errors.push('กรุณาเลือก "DC"');
//     markInvalid('#dcSelect');
//     first = first || '#dcSelect';
//   }

//   const fullName = $('#fullName').val().trim();
//   if (!fullName) {
//     errors.push('กรุณากรอก "ชื่อ-นามสกุล"');
//     markInvalid('#fullName');
//     first = first || '#fullName';
//   }

//   const gender = $('input[name="gender"]:checked').val();
//   if (!gender) {
//     errors.push('กรุณาเลือก "เพศ"');
//     markInvalid('#genderGroup');
//     first = first || '#genderGroup';
//   }

//   const phone = $('#phone').val().trim();
//   if (!/^0\d{9}$/.test(phone)) {
//     errors.push('หมายเลขโทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก');
//     markInvalid('#phone');
//     first = first || '#phone';
//   }

//   const company = $('input[name="company"]:checked').val();
//   if (!company) {
//     errors.push('กรุณาเลือก "บริษัท"');
//     markInvalid('#companyGroup');
//     first = first || '#companyGroup';
//   }

//   const companyOther = $('#companyOther').val().trim();
//   if (company === 'อื่นๆ' && !companyOther) {
//     errors.push('คุณเลือก "อื่นๆ" กรุณากรอก "ชื่อบริษัท"');
//     markInvalid('#companyOther');
//     first = first || '#companyOther';
//   }

//   return { ok: errors.length === 0, errors, firstInvalid: first };
// }

// function bindInputFilters() {
//   $('#fullName').off('input').on('input', function () {
//     const clean = this.value.replace(/[^A-Za-zก-๙เแโใไ์่้๊๋ึั็ํๅฯ\s]/g, '');
//     if (clean !== this.value) this.value = clean;
//     $(this).removeClass('invalid');
//   });

//   $('#phone').off('input').on('input', function () {
//     const digits = this.value.replace(/\D/g, '').slice(0, 10);
//     this.value = digits;
//     this.setCustomValidity(/^0\d{9}$/.test(digits) ? '' : 'ต้องขึ้นต้นด้วย 0 และเป็นตัวเลข 10 หลัก');
//     $(this).removeClass('invalid');
//   });

//   $('input[name="gender"]').off('change').on('change', function () {
//     $('#genderGroup').removeClass('invalid');
//   });

//   $('#companyOther').off('input').on('input', function () {
//     $(this).removeClass('invalid');
//   });
// }

// /***********************
//  * SweetAlert QR — Mobile First
//  * ให้ข้อมูลพอดีกับหน้าจอมือถือ
//  ***********************/
// function buildQrPopupHtmlV4({
//   qrDataUrl, autoId, dc, dcName, fullName, timestampClient
// }) {
//   return `
// <style>
//   #mqr, #mqr *{ box-sizing:border-box; }

//   #mqr{
//     font-family:'Sarabun',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
//     color:#0f172a;
//     width:100%;
//     max-width:100%;
//     margin:0 auto;
//   }

//   .mqr-card{
//     width:100%;
//     max-width:390px;
//     margin:0 auto;
//     background:#ffffff;
//     border-radius:22px;
//     overflow:hidden;
//     border:1px solid rgba(15,23,42,.08);
//     box-shadow:0 12px 36px rgba(15,23,42,.14);
//   }

//   .mqr-head{
//     padding:14px 14px 8px;
//     text-align:center;
//     background:linear-gradient(180deg,#ffffff 0%, #f8fafc 100%);
//   }

//   .mqr-badge{
//     display:inline-block;
//     margin-bottom:8px;
//     padding:5px 10px;
//     border-radius:999px;
//     font-size:10px;
//     font-weight:800;
//     color:#5b21b6;
//     background:#f3e8ff;
//   }

//   .mqr-title{
//     margin:0;
//     font-size:20px;
//     line-height:1.2;
//     font-weight:900;
//     color:#111827;
//   }

//   .mqr-sub{
//     margin:6px 0 0;
//     font-size:12px;
//     line-height:1.45;
//     color:#64748b;
//   }

//   .mqr-body{
//     padding:10px 14px 14px;
//   }

//   .mqr-qr-wrap{
//     background:#f8fafc;
//     border:1px solid #e2e8f0;
//     border-radius:18px;
//     padding:12px;
//     text-align:center;
//   }

//   .mqr-qr-box{
//     width:min(70vw, 250px);
//     margin:0 auto;
//     background:#fff;
//     border-radius:16px;
//     padding:10px;
//     border:1px solid #e5e7eb;
//     box-shadow:0 6px 18px rgba(15,23,42,.06);
//   }

//   .mqr-qr-box img{
//     display:block;
//     width:100%;
//     aspect-ratio:1/1;
//     object-fit:contain;
//     image-rendering:pixelated;
//   }

//   .mqr-id{
//     margin-top:10px;
//     padding:10px 12px;
//     border-radius:14px;
//     background:#ffffff;
//     border:1px dashed #cbd5e1;
//   }

//   .mqr-id-label{
//     font-size:11px;
//     color:#64748b;
//     margin-bottom:3px;
//     font-weight:700;
//   }

//   .mqr-id-code{
//     font-size:16px;
//     line-height:1.2;
//     font-weight:900;
//     color:#111827;
//     word-break:break-word;
//     letter-spacing:.2px;
//   }

//   .mqr-note{
//     margin-top:10px;
//     text-align:center;
//     font-size:12px;
//     line-height:1.45;
//     color:#475569;
//   }

//   .mqr-mini{
//     margin-top:10px;
//     display:grid;
//     gap:6px;
//   }

//   .mqr-row{
//     display:flex;
//     gap:8px;
//     align-items:flex-start;
//     padding:9px 10px;
//     border-radius:12px;
//     background:#f8fafc;
//     border:1px solid #e2e8f0;
//   }

//   .mqr-k{
//     min-width:52px;
//     font-size:11px;
//     font-weight:800;
//     color:#475569;
//   }

//   .mqr-v{
//     flex:1;
//     font-size:12px;
//     line-height:1.4;
//     color:#0f172a;
//     word-break:break-word;
//   }

//   .mqr-actions{
//     margin-top:12px;
//     display:grid;
//     gap:8px;
//   }

//   .mqr-btn{
//     width:100%;
//     min-height:46px;
//     border:none;
//     border-radius:14px;
//     font-size:14px;
//     font-weight:900;
//     cursor:pointer;
//   }

//   .mqr-btn-primary{
//     background:linear-gradient(135deg,#7c3aed,#5b21b6);
//     color:#fff;
//     box-shadow:0 10px 22px rgba(91,33,182,.22);
//   }

//   .swal2-popup{
//     padding:0 !important;
//     border-radius:24px !important;
//     overflow:hidden !important;
//   }

//   .swal2-html-container{
//     margin:0 !important;
//     padding:0 !important;
//   }

//   .swal2-close{
//     color:#64748b !important;
//     font-size:26px !important;
//   }

//   @media (max-width:480px){
//     .mqr-card{
//       max-width:100%;
//       border-radius:20px;
//     }

//     .mqr-title{
//       font-size:18px;
//     }

//     .mqr-sub{
//       font-size:11.5px;
//     }

//     .mqr-qr-box{
//       width:min(68vw, 220px);
//       padding:9px;
//       border-radius:14px;
//     }

//     .mqr-id-code{
//       font-size:15px;
//     }

//     .mqr-k{
//       min-width:48px;
//     }

//     .mqr-v{
//       font-size:11.5px;
//     }

//     .mqr-btn{
//       min-height:44px;
//       font-size:13.5px;
//     }
//   }
// </style>

// <div id="mqr">
//   <div class="mqr-card" id="qrCardCapture">
//     <div class="mqr-head">
//       <div class="mqr-badge">VISITOR PASS</div>
//       <h2 class="mqr-title">QR สำหรับสแกนออก</h2>
//       <p class="mqr-sub">กรุณาแสดง QR นี้ต่อเจ้าหน้าที่เมื่อออกจากพื้นที่</p>
//     </div>

//     <div class="mqr-body">
//       <div class="mqr-qr-wrap">
//         <div class="mqr-qr-box">
//           <img src="${escapeHtml(qrDataUrl)}" alt="QR Code">
//         </div>

//         <div class="mqr-id">
//           <div class="mqr-id-label">รหัสลงทะเบียน</div>
//           <div class="mqr-id-code">${escapeHtml(autoId)}</div>
//         </div>

//         <div class="mqr-note">
//           แนะนำให้ดาวน์โหลดหรือบันทึกภาพนี้ไว้<br>
//           เพื่อความสะดวกในการสแกนตอนออก
//         </div>
//       </div>

//       <div class="mqr-mini">
//         <div class="mqr-row">
//           <div class="mqr-k">DC</div>
//           <div class="mqr-v">${escapeHtml(dc)} - ${escapeHtml(dcName)}</div>
//         </div>
//         <div class="mqr-row">
//           <div class="mqr-k">ชื่อ</div>
//           <div class="mqr-v">${escapeHtml(fullName)}</div>
//         </div>
//         <div class="mqr-row">
//           <div class="mqr-k">เวลา</div>
//           <div class="mqr-v">${escapeHtml(timestampClient)}</div>
//         </div>
//       </div>

//       <div class="mqr-actions">
//         <button type="button" class="mqr-btn mqr-btn-primary" id="download-card-btn">ดาวน์โหลดบัตร QR</button>
//       </div>
//     </div>
//   </div>
// </div>
// `;
// }

// /***********************
//  * Submit
//  ***********************/
// let isSubmitting = false;

// function bindSubmit() {
//   $('#registration-form').off('submit').on('submit', async function (e) {
//     e.preventDefault();
//     if (isSubmitting) return;

//     clearInvalid();

//     const v = validateForm();
//     if (!v.ok) {
//       const list = '<ul style="text-align:left;margin:0 auto;max-width:420px;">' +
//         v.errors.map(x => `<li>${escapeHtml(x)}</li>`).join('') + '</ul>';

//       Swal.fire({
//         icon: 'warning',
//         title: 'ข้อมูลไม่ครบถ้วน',
//         html: list
//       });

//       if (v.firstInvalid) {
//         document.querySelector(v.firstInvalid)?.scrollIntoView({
//           behavior: 'smooth',
//           block: 'center'
//         });
//         setTimeout(() => {
//           document.querySelector(v.firstInvalid)?.focus();
//         }, 250);
//       }
//       return;
//     }

//     isSubmitting = true;
//     const btn = document.getElementById('submitBtn');
//     if (btn) btn.disabled = true;

//     try {
//       const dc = $('#dcSelect').val();
//       const dcName = $('#dcSelect option:selected').data('name') || '';
//       const fullName = $('#fullName').val().trim();
//       const gender = $('input[name="gender"]:checked').val();
//       const phone = $('#phone').val().trim();
//       const company = $('input[name="company"]:checked').val();
//       const companyOther = $('#companyOther').val().trim();

//       const autoId = generateUniqueId();
//       const timestampClient = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
//       const companyResolved = (company === 'อื่นๆ') ? companyOther : company;

//       const payload = {
//         autoId,
//         dc,
//         dcName,
//         fullName,
//         gender,
//         phone,
//         company,
//         companyOther,
//         companyResolved,
//         timestampClient
//       };

//       Swal.fire({
//         title: 'กำลังบันทึกข้อมูล',
//         text: 'กรุณารอสักครู่...',
//         allowOutsideClick: false,
//         allowEscapeKey: false,
//         showConfirmButton: false,
//         didOpen: () => {
//           Swal.showLoading();
//         }
//       });

//       await api('saveData', payload);

//       const qrDataUrl = await makeQrDataUrl(autoId);
//       const html = buildQrPopupHtmlV4({
//         qrDataUrl,
//         autoId,
//         dc,
//         dcName,
//         fullName,
//         timestampClient
//       });

//       const Toast = createToast();

//       Swal.fire({
//         title: '',
//         html,
//         showConfirmButton: false,
//         showCloseButton: true,
//         allowOutsideClick: true,
//         width: 'min(92vw, 410px)',
//         padding: '0',
//         backdrop: true,
//         didOpen: () => {
//           document.getElementById('download-card-btn')?.addEventListener('click', async () => {
//             try {
//               const card = document.getElementById('qrCardCapture');
//               const filename = safeFileName(`${CFG.DOWNLOAD_PREFIX}_${autoId}_CARD.png`);
//               await downloadElementAsPng(card, filename);

//               Toast.fire({
//                 icon: 'success',
//                 title: 'ดาวน์โหลดแล้ว'
//               });
//             } catch (err) {
//               Toast.fire({
//                 icon: 'error',
//                 title: 'ดาวน์โหลดไม่สำเร็จ'
//               });
//             }
//           });
//         }
//       }).then(() => {
//         $('#registration-form')[0].reset();
//         $('#companyOtherWrap').hide();

//         const form = document.getElementById('registration-form');
//         if (form) form.style.display = 'none';

//         showPrivacyMessage();
//       });

//     } catch (err) {
//       Swal.fire({
//         icon: 'error',
//         title: 'ทำรายการไม่สำเร็จ',
//         text: String(err && err.message ? err.message : err)
//       });
//     } finally {
//       isSubmitting = false;
//       if (btn) btn.disabled = false;
//     }
//   });
// }

// /***********************
//  * Init
//  ***********************/
// document.addEventListener('DOMContentLoaded', () => {
//   bindInputFilters();
//   bindSubmit();
//   showPrivacyFast();

//   (async () => {
//     try {
//       await Promise.allSettled([
//         loadDCOptions(),
//         loadCompanyOptions()
//       ]);
//     } catch (_) {
//       // ปล่อยผ่าน เพื่อไม่ให้ UI พัง
//     }
//   })();
// });


/*************************************************************
 * app.js — VISITOR DC-SPLIT (GitHub Pages) — FULL PACKAGE
 * -----------------------------------------------------------
 * ✅ JSONP เรียก Google Apps Script Web App (ไม่ติด CORS)
 * ✅ Mobile-first SweetAlert QR
 * ✅ บันทึกข้อมูลสำเร็จก่อน แล้วค่อยแสดง QR
 * ✅ ดาวน์โหลดเป็น "ภาพทั้งการ์ด" ตามที่แสดงใน SweetAlert
 * ✅ หลังปิด QR ให้เด้ง privacy ซ้ำทุกครั้ง
 * ✅ เอาปุ่มคัดลอกรหัสออก
 * ✅ เอาปุ่มปิดออกจากด้านล่าง
 * ✅ เพิ่มโลโก้บริษัทบนหน้าบัตร QR โดยไม่กระทบสัดส่วนมากเกินไป
 *
 * Requires in index.html:
 * - jQuery
 * - SweetAlert2
 * - qrcodejs
 * - html2canvas
 *************************************************************/

/***********************
 * GitHub Frontend Config
 ***********************/
const CFG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzZXPQ4wEbC7wscYHZwougAbvo4ppKuSvwlR2teWHlncJ7fa2pG4YrhKXwpEp9ItRQh/exec',
  SECRET: 'CHANGE_ME_SUPER_SECRET_906',
  ORIGIN: window.location.origin,
  JSONP_TIMEOUT_MS: 15000,

  PRIVACY_ONCE_PER_SESSION: false,
  PRIVACY_PRELOAD_TIMEOUT_MS: 1200,

  DOWNLOAD_PREFIX: 'visitor',
  PRIVACY_IMG_URL: 'https://lh5.googleusercontent.com/d/1yR7QQHgqPNOhOOVKl7jGK_yrMf7UOYxn',
  LOGO_URL: './assets/logo.png',

  COMPANY_FALLBACK: [
    "CPAXTRA", "Smart DC", "Makro", "CPF", "ALL Now", "Linfox",
    "บุคคลภายนอก", "หน่วยงานราชการ", "คนลงสินค้า", "อื่นๆ"
  ],

  AUTO_ID_PREFIX: 'DCs01'
};

/***********************
 * Utilities
 ***********************/
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function createToast() {
  return Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 1400,
    timerProgressBar: true
  });
}

function safeFileName(name) {
  return String(name || 'download')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

/***********************
 * ดาวน์โหลด "ทั้งการ์ด" ตามที่เห็นใน SweetAlert
 ***********************/
async function downloadElementAsPng(element, filename) {
  if (!element) throw new Error('ไม่พบ element สำหรับดาวน์โหลด');
  if (typeof html2canvas !== 'function') {
    throw new Error('ไม่พบไลบรารี html2canvas');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false
  });

  const dataUrl = canvas.toDataURL('image/png');
  downloadDataUrl(dataUrl, filename);
}

/***********************
 * JSONP Helper (No CORS)
 ***********************/
function jsonpRequest(params) {
  return new Promise((resolve, reject) => {
    const cb = `__cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');

    const q = new URLSearchParams({
      ...params,
      secret: CFG.SECRET,
      origin: CFG.ORIGIN,
      callback: cb
    });

    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('JSONP timeout / GAS ช้าเกินไป'));
    }, CFG.JSONP_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      try {
        delete window[cb];
      } catch (_) {
        window[cb] = undefined;
      }
      if (script && script.parentNode) script.parentNode.removeChild(script);
    }

    window[cb] = (resp) => {
      if (done) return;
      done = true;
      cleanup();

      if (!resp || resp.ok !== true) {
        reject(new Error(resp?.error || 'API error'));
        return;
      }
      resolve(resp.data);
    };

    script.onerror = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('Network error / GAS unreachable'));
    };

    script.src = `${CFG.GAS_URL}?${q.toString()}`;
    document.head.appendChild(script);
  });
}

function api(action, payload = null) {
  const params = { action };
  if (payload != null) params.payload = JSON.stringify(payload);
  return jsonpRequest(params);
}

function preloadImage(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);

    const img = new Image();
    let done = false;

    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(false);
    }, Math.max(200, timeoutMs || 1200));

    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve(true);
    };

    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve(false);
    };

    img.src = url;
  });
}

function shouldShowPrivacy() {
  if (!CFG.PRIVACY_ONCE_PER_SESSION) return true;
  return sessionStorage.getItem('privacy_ack_v1') !== '1';
}

function markPrivacyAck() {
  if (!CFG.PRIVACY_ONCE_PER_SESSION) return;
  sessionStorage.setItem('privacy_ack_v1', '1');
}

/***********************
 * เรียกตอนเปิดหน้า
 ***********************/
async function showPrivacyFast() {
  if (!shouldShowPrivacy()) {
    const form = document.getElementById('registration-form');
    if (form) form.style.display = 'block';
    return;
  }

  const form = document.getElementById('registration-form');
  if (form) form.style.display = 'none';

  await preloadImage(CFG.PRIVACY_IMG_URL, CFG.PRIVACY_PRELOAD_TIMEOUT_MS);
  showPrivacyMessage();
}

/***********************
 * Privacy Popup
 ***********************/
function showPrivacyMessage() {
  const imgUrl = CFG.PRIVACY_IMG_URL;

  const html = `
    <div style="padding:6px;">
      <div style="border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);margin-bottom:10px;">
        <a href="${imgUrl}" target="_blank" rel="noopener">
          <img src="${imgUrl}" alt="กฎระเบียบความปลอดภัย" style="width:100%;display:block;">
        </a>
      </div>

      <ol style="margin:0 12px 12px;padding-left:18px;color:#1f2937;font-size:14px;line-height:1.55">
        <li>ให้ท่านศึกษากฎระเบียบความปลอดภัยการเข้าพื้นที่คลังสินค้าอย่างละเอียด</li>
        <li>ข้าฯ ยินยอมเปิดเผยข้อมูลส่วนบุคคล</li>
        <li>ข้าฯ จะยึดถือปฏิบัติกฎระเบียบความปลอดภัยอย่างเคร่งครัด</li>
      </ol>

      <label style="display:flex;justify-content:center;align-items:center;gap:10px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;">
        <input type="radio" id="ackRadio" name="ack" />
        <span>รับทราบกฎระเบียบความปลอดภัย</span>
      </label>
    </div>
  `;

  const form = document.getElementById('registration-form');
  if (form) form.style.display = 'none';

  let acknowledged = false;

  Swal.fire({
    title: 'Visitor เข้า-ออกพื้นที่ QR Code',
    html,
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    didOpen: () => {
      const r = document.getElementById('ackRadio');
      if (!r) return;

      r.onchange = null;
      r.addEventListener('change', function () {
        if (this.checked) {
          acknowledged = true;
          markPrivacyAck();
          Swal.close();
        }
      }, { once: true });
    },
    willClose: () => {
      if (acknowledged) {
        if (form) {
          form.style.display = 'block';
          form.reset();
        }
        $('#companyOtherWrap').hide();
        document.getElementById('fullName')?.focus();
      }
    }
  });
}

/***********************
 * Generate Unique ID
 ***********************/
const usedIds = new Set();

function generateUniqueId() {
  const chars = "0123456789";
  let id = "";

  do {
    id = CFG.AUTO_ID_PREFIX;
    for (let i = 0; i < 9; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (usedIds.has(id));

  usedIds.add(id);
  return id;
}

/***********************
 * QR DataURL Generator
 ***********************/
function waitFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

async function makeQrDataUrl(text) {
  if (typeof QRCode !== 'function') {
    throw new Error('ไม่พบไลบรารี qrcodejs (QRCode)');
  }

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '-99999px';
  host.style.width = '512px';
  host.style.height = '512px';
  document.body.appendChild(host);

  try {
    new QRCode(host, {
      text: String(text),
      width: 512,
      height: 512,
      correctLevel: QRCode.CorrectLevel.M
    });

    await waitFrame();
    await waitFrame();

    const canvas = host.querySelector('canvas');
    if (canvas) return canvas.toDataURL('image/png');

    const img = host.querySelector('img');
    if (img && img.src) return img.src;

    throw new Error('สร้าง QR ไม่สำเร็จ (ไม่พบ canvas/img)');
  } finally {
    try {
      host.remove();
    } catch (_) {}
  }
}

/***********************
 * Load DC Options
 ***********************/
async function loadDCOptions() {
  const list = await api('getDCOptions');
  const sel = document.getElementById('dcSelect');
  if (!sel) throw new Error('ไม่พบ element #dcSelect');

  sel.innerHTML = `<option value="">-- เลือก DC --</option>`;

  (list || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.dc;
    opt.textContent = `${item.dc} - ${item.name}`;
    opt.dataset.name = item.name;
    sel.appendChild(opt);
  });

  $('#dcSelect').off('change').on('change', function () {
    $(this).removeClass('invalid');
  });
}

/***********************
 * Load Company Options
 ***********************/
async function loadCompanyOptions() {
  let options = [];
  try {
    options = await api('getRadioOptions');
  } catch (_) {
    options = [];
  }

  const container = document.getElementById('companyGroup');
  if (!container) throw new Error('ไม่พบ element #companyGroup');

  container.innerHTML = "";

  const list = (options && options.length) ? options : CFG.COMPANY_FALLBACK;

  list.forEach(opt => {
    const safeOpt = String(opt);
    const id = "company_" + safeOpt.replace(/\s+/g, "_");
    const label = document.createElement("label");
    label.className = "radio-chip";
    label.innerHTML = `
      <input type="radio" name="company" value="${escapeHtml(safeOpt)}" id="${escapeHtml(id)}" required />
      <span class="radio-dot"></span> ${escapeHtml(safeOpt)}
    `;
    container.appendChild(label);
  });

  $('input[name="company"]').off('change').on('change', function () {
    $('#companyGroup').removeClass('invalid');

    if (this.value === 'อื่นๆ') {
      $('#companyOtherWrap').slideDown(120);
      $('#companyOther').attr('required', true).focus();
    } else {
      $('#companyOtherWrap').slideUp(120);
      $('#companyOther').val('').removeAttr('required').removeClass('invalid');
    }
  });
}

/***********************
 * Validation + Filters
 ***********************/
function markInvalid(sel) {
  $(sel).addClass('invalid');
}

function clearInvalid() {
  $('.invalid').removeClass('invalid');
}

function validateForm() {
  const errors = [];
  let first = null;

  const dc = $('#dcSelect').val();
  if (!dc) {
    errors.push('กรุณาเลือก "DC"');
    markInvalid('#dcSelect');
    first = first || '#dcSelect';
  }

  const fullName = $('#fullName').val().trim();
  if (!fullName) {
    errors.push('กรุณากรอก "ชื่อ-นามสกุล"');
    markInvalid('#fullName');
    first = first || '#fullName';
  }

  const gender = $('input[name="gender"]:checked').val();
  if (!gender) {
    errors.push('กรุณาเลือก "เพศ"');
    markInvalid('#genderGroup');
    first = first || '#genderGroup';
  }

  const phone = $('#phone').val().trim();
  if (!/^0\d{9}$/.test(phone)) {
    errors.push('หมายเลขโทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก');
    markInvalid('#phone');
    first = first || '#phone';
  }

  const company = $('input[name="company"]:checked').val();
  if (!company) {
    errors.push('กรุณาเลือก "บริษัท"');
    markInvalid('#companyGroup');
    first = first || '#companyGroup';
  }

  const companyOther = $('#companyOther').val().trim();
  if (company === 'อื่นๆ' && !companyOther) {
    errors.push('คุณเลือก "อื่นๆ" กรุณากรอก "ชื่อบริษัท"');
    markInvalid('#companyOther');
    first = first || '#companyOther';
  }

  return { ok: errors.length === 0, errors, firstInvalid: first };
}

function bindInputFilters() {
  $('#fullName').off('input').on('input', function () {
    const clean = this.value.replace(/[^A-Za-zก-๙เแโใไ์่้๊๋ึั็ํๅฯ\s]/g, '');
    if (clean !== this.value) this.value = clean;
    $(this).removeClass('invalid');
  });

  $('#phone').off('input').on('input', function () {
    const digits = this.value.replace(/\D/g, '').slice(0, 10);
    this.value = digits;
    this.setCustomValidity(/^0\d{9}$/.test(digits) ? '' : 'ต้องขึ้นต้นด้วย 0 และเป็นตัวเลข 10 หลัก');
    $(this).removeClass('invalid');
  });

  $('input[name="gender"]').off('change').on('change', function () {
    $('#genderGroup').removeClass('invalid');
  });

  $('#companyOther').off('input').on('input', function () {
    $(this).removeClass('invalid');
  });
}

/***********************
 * SweetAlert QR — Mobile First
 * ให้ข้อมูลพอดีกับหน้าจอมือถือ
 * เพิ่มโลโก้โดยไม่ทำให้พื้นที่เดิมเสียสัดส่วนมากเกินไป
 ***********************/
function buildQrPopupHtmlV4({
  logoUrl, qrDataUrl, autoId, dc, dcName, fullName, timestampClient
}) {
  return `
<style>
  #mqr, #mqr *{ box-sizing:border-box; }

  #mqr{
    font-family:'Sarabun',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    color:#0f172a;
    width:100%;
    max-width:100%;
    margin:0 auto;
  }

  .mqr-card{
    width:100%;
    max-width:390px;
    margin:0 auto;
    background:#ffffff;
    border-radius:22px;
    overflow:hidden;
    border:1px solid rgba(15,23,42,.08);
    box-shadow:0 12px 36px rgba(15,23,42,.14);
  }

  .mqr-head{
    padding:12px 14px 8px;
    text-align:center;
    background:linear-gradient(180deg,#ffffff 0%, #f8fafc 100%);
    border-bottom:1px solid #eef2f7;
  }

  .mqr-logo-wrap{
    display:flex;
    justify-content:center;
    align-items:center;
    margin-bottom:8px;
    min-height:34px;
  }

  .mqr-logo{
    display:block;
    max-width:110px;
    max-height:34px;
    width:auto;
    height:auto;
    object-fit:contain;
  }

  .mqr-badge{
    display:inline-block;
    margin-bottom:8px;
    padding:5px 10px;
    border-radius:999px;
    font-size:10px;
    font-weight:800;
    color:#5b21b6;
    background:#f3e8ff;
  }

  .mqr-title{
    margin:0;
    font-size:20px;
    line-height:1.2;
    font-weight:900;
    color:#111827;
  }

  .mqr-sub{
    margin:6px 0 0;
    font-size:12px;
    line-height:1.45;
    color:#64748b;
  }

  .mqr-body{
    padding:10px 14px 14px;
  }

  .mqr-qr-wrap{
    background:#f8fafc;
    border:1px solid #e2e8f0;
    border-radius:18px;
    padding:12px;
    text-align:center;
  }

  .mqr-qr-box{
    width:min(70vw, 250px);
    margin:0 auto;
    background:#fff;
    border-radius:16px;
    padding:10px;
    border:1px solid #e5e7eb;
    box-shadow:0 6px 18px rgba(15,23,42,.06);
  }

  .mqr-qr-box img{
    display:block;
    width:100%;
    aspect-ratio:1/1;
    object-fit:contain;
    image-rendering:pixelated;
  }

  .mqr-id{
    margin-top:10px;
    padding:10px 12px;
    border-radius:14px;
    background:#ffffff;
    border:1px dashed #cbd5e1;
  }

  .mqr-id-label{
    font-size:11px;
    color:#64748b;
    margin-bottom:3px;
    font-weight:700;
  }

  .mqr-id-code{
    font-size:16px;
    line-height:1.2;
    font-weight:900;
    color:#111827;
    word-break:break-word;
    letter-spacing:.2px;
  }

  .mqr-note{
    margin-top:10px;
    text-align:center;
    font-size:12px;
    line-height:1.45;
    color:#475569;
  }

  .mqr-mini{
    margin-top:10px;
    display:grid;
    gap:6px;
  }

  .mqr-row{
    display:flex;
    gap:8px;
    align-items:flex-start;
    padding:9px 10px;
    border-radius:12px;
    background:#f8fafc;
    border:1px solid #e2e8f0;
  }

  .mqr-k{
    min-width:52px;
    font-size:11px;
    font-weight:800;
    color:#475569;
  }

  .mqr-v{
    flex:1;
    font-size:12px;
    line-height:1.4;
    color:#0f172a;
    word-break:break-word;
  }

  .mqr-actions{
    margin-top:12px;
    display:grid;
    gap:8px;
  }

  .mqr-btn{
    width:100%;
    min-height:46px;
    border:none;
    border-radius:14px;
    font-size:14px;
    font-weight:900;
    cursor:pointer;
  }

  .mqr-btn-primary{
    background:linear-gradient(135deg,#7c3aed,#5b21b6);
    color:#fff;
    box-shadow:0 10px 22px rgba(91,33,182,.22);
  }

  .swal2-popup{
    padding:0 !important;
    border-radius:24px !important;
    overflow:hidden !important;
  }

  .swal2-html-container{
    margin:0 !important;
    padding:0 !important;
  }

  .swal2-close{
    color:#64748b !important;
    font-size:26px !important;
  }

  @media (max-width:480px){
    .mqr-card{
      max-width:100%;
      border-radius:20px;
    }

    .mqr-head{
      padding:10px 12px 8px;
    }

    .mqr-logo-wrap{
      margin-bottom:6px;
      min-height:30px;
    }

    .mqr-logo{
      max-width:96px;
      max-height:30px;
    }

    .mqr-title{
      font-size:18px;
    }

    .mqr-sub{
      font-size:11.5px;
    }

    .mqr-qr-box{
      width:min(68vw, 220px);
      padding:9px;
      border-radius:14px;
    }

    .mqr-id-code{
      font-size:15px;
    }

    .mqr-k{
      min-width:48px;
    }

    .mqr-v{
      font-size:11.5px;
    }

    .mqr-btn{
      min-height:44px;
      font-size:13.5px;
    }
  }
</style>

<div id="mqr">
  <div class="mqr-card" id="qrCardCapture">
    <div class="mqr-head">
      <div class="mqr-logo-wrap">
        <img
          class="mqr-logo"
          src="${escapeHtml(logoUrl || '')}"
          alt="Company Logo"
          loading="eager"
          crossorigin="anonymous"
        >
      </div>
      <div class="mqr-badge">VISITOR PASS</div>
      <h2 class="mqr-title">QR สำหรับสแกนออก</h2>
      <p class="mqr-sub">กรุณาแสดง QR นี้ต่อเจ้าหน้าที่เมื่อออกจากพื้นที่</p>
    </div>

    <div class="mqr-body">
      <div class="mqr-qr-wrap">
        <div class="mqr-qr-box">
          <img src="${escapeHtml(qrDataUrl)}" alt="QR Code">
        </div>

        <div class="mqr-id">
          <div class="mqr-id-label">รหัสลงทะเบียน</div>
          <div class="mqr-id-code">${escapeHtml(autoId)}</div>
        </div>

        <div class="mqr-note">
          แนะนำให้ดาวน์โหลดหรือบันทึกภาพนี้ไว้<br>
          เพื่อความสะดวกในการสแกนตอนออก
        </div>
      </div>

      <div class="mqr-mini">
        <div class="mqr-row">
          <div class="mqr-k">DC</div>
          <div class="mqr-v">${escapeHtml(dc)} - ${escapeHtml(dcName)}</div>
        </div>
        <div class="mqr-row">
          <div class="mqr-k">ชื่อ</div>
          <div class="mqr-v">${escapeHtml(fullName)}</div>
        </div>
        <div class="mqr-row">
          <div class="mqr-k">เวลา</div>
          <div class="mqr-v">${escapeHtml(timestampClient)}</div>
        </div>
      </div>

      <div class="mqr-actions">
        <button type="button" class="mqr-btn mqr-btn-primary" id="download-card-btn">ดาวน์โหลดบัตร QR</button>
      </div>
    </div>
  </div>
</div>
`;
}

/***********************
 * Submit
 ***********************/
let isSubmitting = false;

function bindSubmit() {
  $('#registration-form').off('submit').on('submit', async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearInvalid();

    const v = validateForm();
    if (!v.ok) {
      const list = '<ul style="text-align:left;margin:0 auto;max-width:420px;">' +
        v.errors.map(x => `<li>${escapeHtml(x)}</li>`).join('') + '</ul>';

      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        html: list
      });

      if (v.firstInvalid) {
        document.querySelector(v.firstInvalid)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setTimeout(() => {
          document.querySelector(v.firstInvalid)?.focus();
        }, 250);
      }
      return;
    }

    isSubmitting = true;
    const btn = document.getElementById('submitBtn');
    if (btn) btn.disabled = true;

    try {
      const dc = $('#dcSelect').val();
      const dcName = $('#dcSelect option:selected').data('name') || '';
      const fullName = $('#fullName').val().trim();
      const gender = $('input[name="gender"]:checked').val();
      const phone = $('#phone').val().trim();
      const company = $('input[name="company"]:checked').val();
      const companyOther = $('#companyOther').val().trim();

      const autoId = generateUniqueId();
      const timestampClient = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const companyResolved = (company === 'อื่นๆ') ? companyOther : company;

      const payload = {
        autoId,
        dc,
        dcName,
        fullName,
        gender,
        phone,
        company,
        companyOther,
        companyResolved,
        timestampClient
      };

      Swal.fire({
        title: 'กำลังบันทึกข้อมูล',
        text: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await api('saveData', payload);

      const qrDataUrl = await makeQrDataUrl(autoId);
      const html = buildQrPopupHtmlV4({
        logoUrl: CFG.LOGO_URL,
        qrDataUrl,
        autoId,
        dc,
        dcName,
        fullName,
        timestampClient
      });

      const Toast = createToast();

      Swal.fire({
        title: '',
        html,
        showConfirmButton: false,
        showCloseButton: true,
        allowOutsideClick: true,
        width: 'min(92vw, 410px)',
        padding: '0',
        backdrop: true,
        didOpen: () => {
          document.getElementById('download-card-btn')?.addEventListener('click', async () => {
            try {
              const card = document.getElementById('qrCardCapture');
              const filename = safeFileName(`${CFG.DOWNLOAD_PREFIX}_${autoId}_CARD.png`);
              await downloadElementAsPng(card, filename);

              Toast.fire({
                icon: 'success',
                title: 'ดาวน์โหลดแล้ว'
              });
            } catch (err) {
              Toast.fire({
                icon: 'error',
                title: 'ดาวน์โหลดไม่สำเร็จ'
              });
            }
          });
        }
      }).then(() => {
        $('#registration-form')[0].reset();
        $('#companyOtherWrap').hide();

        const form = document.getElementById('registration-form');
        if (form) form.style.display = 'none';

        showPrivacyMessage();
      });

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ทำรายการไม่สำเร็จ',
        text: String(err && err.message ? err.message : err)
      });
    } finally {
      isSubmitting = false;
      if (btn) btn.disabled = false;
    }
  });
}

/***********************
 * Init
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
  bindInputFilters();
  bindSubmit();
  showPrivacyFast();

  (async () => {
    try {
      await Promise.allSettled([
        loadDCOptions(),
        loadCompanyOptions()
      ]);
    } catch (_) {
        // ปล่อยผ่าน เพื่อไม่ให้ UI พัง
    }
  })();
});


