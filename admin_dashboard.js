/* =========================================================
   Admin Dashboard (FAST + Traits Search)
   - Fetch latest 200 once, then filter locally (fast UX)
   - Debounced live filtering + manual apply
   - Precompute searchable fields + formatted date
   - Cache signed URLs for CV downloads (private bucket)
   - "Traits" filters WITHOUT changing HTML:
       Use the general search box (#f-search) with tokens:
         cv:yes | cv:no
         li:yes | li:no        (LinkedIn)
         web:yes | web:no      (Website/Portfolio)
         exp:3-8  OR exp>=5 OR exp<=10
       Example:  cv:yes li:yes exp:3-8 محمد
========================================================= */

function show(el, isShow){ if(!el) return; el.classList.toggle("hidden", !isShow); }
function setText(el, t){ if(el) el.textContent = t || ""; }

function showStatus(el, msg, kind){
  if (!el) return;
  el.style.display = "block";
  el.classList.remove("ok","err");
  if (kind) el.classList.add(kind);
  el.textContent = msg;
}
function clearStatus(el){
  if(!el) return;
  el.style.display="none";
  el.textContent="";
  el.classList.remove("ok","err");
}

function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString("ar-SA", {
      year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"
    });
  }catch{
    return iso || "";
  }
}

function esc(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function norm(s){
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function debounce(fn, wait=250){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ---- Traits parser from the SAME search box (no HTML changes)
function parseAdvancedSearch(raw){
  const out = {
    freeText: "",
    hasCv: "",        // "yes" | "no" | ""
    hasLinkedin: "",  // "yes" | "no" | ""
    hasWebsite: "",   // "yes" | "no" | ""
    expMin: null,
    expMax: null
  };

  const tokens = (raw || "").trim().split(/\s+/).filter(Boolean);
  const keep = [];

  for (const tok of tokens){
    const t = tok.toLowerCase();

    if (t === "cv:yes" || t === "cv:no"){ out.hasCv = t.split(":")[1]; continue; }
    if (t === "li:yes" || t === "li:no"){ out.hasLinkedin = t.split(":")[1]; continue; }
    if (t === "web:yes" || t === "web:no"){ out.hasWebsite = t.split(":")[1]; continue; }

    // exp:5-10 أو exp:5
    if (t.startsWith("exp:")){
      const v = t.slice(4);
      const m = v.match(/^(\d+)\-(\d+)$/);
      if (m){ out.expMin = Number(m[1]); out.expMax = Number(m[2]); continue; }
      const n = v.match(/^(\d+)$/);
      if (n){ out.expMin = Number(n[1]); continue; }
    }

    // exp>=5 / exp<=10
    const ge = t.match(/^exp\>\=(\d+)$/);
    if (ge){ out.expMin = Number(ge[1]); continue; }
    const le = t.match(/^exp\<\=(\d+)$/);
    if (le){ out.expMax = Number(le[1]); continue; }

    keep.push(tok);
  }

  out.freeText = keep.join(" ");
  return out;
}

// --- Signed URL cache (path -> {url, expAt}) ---
const signedCache = new Map();
async function getCvSignedUrlCached(path){
  const now = Date.now();
  const hit = signedCache.get(path);
  if (hit && hit.expAt > now) return hit.url;

  const { data, error } = await window.sb.storage.from("cvs").createSignedUrl(path, 60);
  if (error) throw error;

  const url = data?.signedUrl || null;
  if (url) signedCache.set(path, { url, expAt: now + 55_000 }); // 55s safe cache
  return url;
}

async function isAdminFast(userId){
  if (!userId) return false;
  const { data, error } = await window.sb
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

async function fetchLatest200(){
  // Pull only what the dashboard needs (list + details)
  const { data, error } = await window.sb
    .from("trainers")
    .select("id,created_at,full_name,phone,email,city,specialization,years_experience,cv_path,status,linkedin_url,website_url,bio")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data || []).map(r => {
    const full = r.full_name || "";
    const phone = r.phone || "";
    const email = r.email || "";
    const city  = r.city || "";
    const spec  = r.specialization || "";
    const li    = r.linkedin_url || "";
    const web   = r.website_url || "";
    const exp   = (r.years_experience ?? "").toString();

    return {
      ...r,
      _date: fmtDate(r.created_at),
      _hay: norm([full, phone, email, city, spec, li, web, exp].join(" | ")),
      _spec: norm(spec),
      _city: norm(city),
      _status: (r.status || "new")
    };
  });
}

function applyLocalFilters(allRows, filters){
  const s = norm(filters.search);
  const spec = norm(filters.specialization);
  const city = norm(filters.city);
  const status = (filters.status || "").trim();

  const hasCv = filters.hasCv || "";
  const hasLinkedin = filters.hasLinkedin || "";
  const hasWebsite = filters.hasWebsite || "";
  const expMin = (filters.expMin == null ? null : Number(filters.expMin));
  const expMax = (filters.expMax == null ? null : Number(filters.expMax));

  return allRows.filter(r => {
    // Base filters
    if (status && (r._status !== status)) return false;
    if (spec && !r._spec.includes(spec)) return false;
    if (city && !r._city.includes(city)) return false;
    if (s && !r._hay.includes(s)) return false;

    // Traits
    if (hasCv === "yes" && !r.cv_path) return false;
    if (hasCv === "no"  && !!r.cv_path) return false;

    if (hasLinkedin === "yes" && !r.linkedin_url) return false;
    if (hasLinkedin === "no"  && !!r.linkedin_url) return false;

    if (hasWebsite === "yes" && !r.website_url) return false;
    if (hasWebsite === "no"  && !!r.website_url) return false;

    const y = (r.years_experience == null ? null : Number(r.years_experience));
    if (expMin != null && (y == null || y < expMin)) return false;
    if (expMax !=null && (y == null || y > expMax)) return false;

    return true;
  });
}

const STATUS_LIST = ["new","shortlisted","contacted","rejected","archived"];

function renderRows(tbody, rows){
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="5" class="muted">لا توجد نتائج.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const name = r.full_name || "—";
    const contact = [r.phone, r.email].filter(Boolean).join(" | ") || "—";
    const specCity = [r.specialization, r.city].filter(Boolean).join(" — ") || "—";
    const status = r._status || "new";
    const hasCv = !!r.cv_path;

    const statusSelect = `
      <select data-act="status" data-id="${esc(r.id)}" style="padding:8px 10px;border-radius:10px;border:1px solid var(--nahj-border);">
        ${STATUS_LIST.map(s => `<option value="${s}" ${s===status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    `;

    const cvBtn = hasCv
      ? `<button class="btn btn-ghost btn-sm" data-act="cv" data-path="${esc(r.cv_path)}" type="button">تحميل CV</button>`
      : `<span class="muted">بدون CV</span>`;

    const details = `<span class="linkish" data-act="details" data-id="${esc(r.id)}">عرض</span>`;

    return `
      <tr>
        <td>${esc(r._date || "")}</td>
        <td>
          <div style="font-weight:900;color:var(--nahj-brown-dark);">${esc(name)}</div>
          <div class="muted">${esc(contact)}</div>
        </td>
        <td>${esc(specCity)}</td>
        <td>${statusSelect}</td>
        <td>
          <div class="actions">
            ${cvBtn}
            <button class="btn btn-primary btn-sm" data-act="save" data-id="${esc(r.id)}" type="button">حفظ الحالة</button>
            ${details}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function updateStatus(id, newStatus){
  const { error } = await window.sb
    .from("trainers")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw error;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("login-view");
  const dashView  = document.getElementById("dash-view");
  const btnSignout = document.getElementById("btn-signout");

  const emailEl = document.getElementById("login-email");
  const passEl  = document.getElementById("login-pass");
  const btnLogin = document.getElementById("btn-login");
  const loginStatus = document.getElementById("login-status");

  const fSearch = document.getElementById("f-search");
  const fSpec   = document.getElementById("f-spec");
  const fCity   = document.getElementById("f-city");
  const fStatus = document.getElementById("f-status");

  const btnApply = document.getElementById("btn-apply");
  const btnRefresh = document.getElementById("btn-refresh");

  const dashStatus = document.getElementById("dash-status");
  const tbody = document.getElementById("tbody");
  const countLine = document.getElementById("count-line");

  if (!window.sb) {
    showStatus(loginStatus, "الإعدادات غير مكتملة: تأكدي من supabase_config.js (URL + ANON KEY).", "err");
    return;
  }

  let ALL_ROWS = [];
  let lastReq = 0;

  function getFilters(){
    const adv = parseAdvancedSearch(fSearch?.value || "");
    return {
      search: adv.freeText,
      specialization: (fSpec?.value || ""),
      city: (fCity?.value || ""),
      status: (fStatus?.value || ""),
      hasCv: adv.hasCv,
      hasLinkedin: adv.hasLinkedin,
      hasWebsite: adv.hasWebsite,
      expMin: adv.expMin,
      expMax: adv.expMax
    };
  }

  function applyAndRender(){
    const filtered = applyLocalFilters(ALL_ROWS, getFilters());
    setText(countLine, `عدد النتائج: ${filtered.length}`);
    renderRows(tbody, filtered);
  }

  const applyAndRenderDebounced = debounce(() => {
    clearStatus(dashStatus);
    applyAndRender();
  }, 250);

  async function refreshFromServer(){
    clearStatus(dashStatus);
    setText(countLine, "جارٍ التحميل...");
    tbody.innerHTML = `<tr><td colspan="5" class="muted">جارٍ التحميل…</td></tr>`;

    const reqId = ++lastReq;

    try{
      const rows = await fetchLatest200();
      if (reqId !== lastReq) return;

      ALL_ROWS = rows;
      applyAndRender();
    }catch(err){
      console.error(err);
      showStatus(dashStatus, "خطأ في جلب البيانات: " + (err?.message || ""), "err");
      tbody.innerHTML = `<tr><td colspan="5" class="muted">—</td></tr>`;
      setText(countLine, "");
    }
  }

  async function setView(){
    clearStatus(loginStatus);
    clearStatus(dashStatus);

    const { data: sess } = await window.sb.auth.getSession();
    const hasSession = !!sess?.session;
    show(btnSignout, hasSession);

    if (!hasSession){
      show(loginView, true);
      show(dashView, false);
      return;
    }

    const userId = sess.session.user?.id;
    const ok = await isAdminFast(userId);

    if (!ok){
      show(loginView, true);
      show(dashView, false);
      showStatus(loginStatus, "تم الدخول لكن لا توجد صلاحية (ليست ضمن admins).", "err");
      return;
    }

    show(loginView, false);
    show(dashView, true);

    if (!ALL_ROWS.length) await refreshFromServer();
    else applyAndRender();
  }

  // Login
  btnLogin?.addEventListener("click", async () => {
    clearStatus(loginStatus);
    const email = (emailEl?.value || "").trim();
    const password = (passEl?.value || "").trim();

    if (!email || !password){
      showStatus(loginStatus, "اكتبي الإيميل وكلمة المرور.", "err");
      return;
    }

    try{
      const { error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await setView();
    }catch(err){
      console.error(err);
      showStatus(loginStatus, "فشل الدخول: " + (err?.message || ""), "err");
    }
  });

  // Sign out
  btnSignout?.addEventListener("click", async () => {
    ALL_ROWS = [];
    signedCache.clear();
    await window.sb.auth.signOut();
    await setView();
  });

  // Apply / refresh
  btnApply?.addEventListener("click", applyAndRender);
  btnRefresh?.addEventListener("click", refreshFromServer);

  // Live filtering (fast)
  ;[fSearch, fSpec, fCity, fStatus].forEach(el => {
    el?.addEventListener("input", applyAndRenderDebounced);
    el?.addEventListener("change", applyAndRenderDebounced);
  });

  // Table actions (delegation)
  tbody?.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;

    const act = t.getAttribute("data-act");
    clearStatus(dashStatus);

    try{
      if (act === "cv"){
        const path = t.getAttribute("data-path");
        if (!path) return;
        const url = await getCvSignedUrlCached(path);
        if (!url) throw new Error("لم يتم توليد رابط تحميل.");
        window.open(url, "_blank", "noopener");
      }

      if (act === "save"){
        const id = t.getAttribute("data-id");
        const sel = tbody.querySelector(`select[data-act="status"][data-id="${CSS.escape(id)}"]`);
        const newStatus = sel?.value || "new";

        await updateStatus(id, newStatus);

        const r = ALL_ROWS.find(x => x.id === id);
        if (r) r._status = newStatus;

        showStatus(dashStatus, "تم تحديث الحالة ✅", "ok");
      }

      if (act === "details"){
        const id = t.getAttribute("data-id");
        const r = ALL_ROWS.find(x => x.id === id);

        if (!r){
          showStatus(dashStatus, "لم يتم العثور على السجل محليًا. اضغطي تحديث.", "err");
          return;
        }

        const lines = [
          `الاسم: ${r.full_name || "—"}`,
          `الجوال: ${r.phone || "—"}`,
          `الإيميل: ${r.email || "—"}`,
          `المدينة: ${r.city || "—"}`,
          `التخصص: ${r.specialization || "—"}`,
          `الخبرة: ${r.years_experience ?? "—"}`,
          `LinkedIn: ${r.linkedin_url || "—"}`,
          `الموقع: ${r.website_url || "—"}`,
          `نبذة: ${r.bio || "—"}`,
          `الحالة: ${r._status || "—"}`,
          `التاريخ: ${r._date || ""}`
        ];
        alert(lines.join("\n"));
      }

    }catch(err){
      console.error(err);
      showStatus(dashStatus, "خطأ: " + (err?.message || ""), "err");
    }
  });

  // Auth state change
  window.sb.auth.onAuthStateChange(async () => {
    await setView();
  });

  // Initial view
  await setView();
});
