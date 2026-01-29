/* =========================================================
   Admin Dashboard (ROOT)
   - Email/Password login via Supabase Auth
   - Admin gate via public.admins table
   - List/filter applications from public.trainers
   - Update status
   - Download CV via signed URL (bucket: cvs is private)
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
    return d.toLocaleString("ar-SA", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }catch{ return iso || ""; }
}

function esc(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function isAdmin(){
  const { data, error } = await window.sb
    .from("admins")
    .select("user_id")
    .eq("user_id", (await window.sb.auth.getUser()).data.user?.id || "")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

async function loadRows(filters){
  // Base query
  let q = window.sb
    .from("trainers")
    .select("id,created_at,full_name,phone,email,city,specialization,years_experience,cv_path,status")
    .order("created_at", { ascending: false })
    .limit(200);

  // Filters (all optional)
  if (filters.search) {
    const s = filters.search.replaceAll("%","").replaceAll(","," ");
    // OR across multiple fields
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  if (filters.specialization) q = q.ilike("specialization", `%${filters.specialization}%`);
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.status) q = q.eq("status", filters.status);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function updateStatus(id, newStatus){
  const { error } = await window.sb
    .from("trainers")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw error;
}

async function getCvSignedUrl(path){
  const { data, error } = await window.sb.storage.from("cvs").createSignedUrl(path, 60);
  if (error) throw error;
  return data?.signedUrl || null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("login-view");
  const dashView = document.getElementById("dash-view");
  const btnSignout = document.getElementById("btn-signout");

  const emailEl = document.getElementById("login-email");
  const passEl = document.getElementById("login-pass");
  const btnLogin = document.getElementById("btn-login");
  const loginStatus = document.getElementById("login-status");

  const fSearch = document.getElementById("f-search");
  const fSpec = document.getElementById("f-spec");
  const fCity = document.getElementById("f-city");
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

    // Admin gate
    const ok = await isAdmin();
    if (!ok){
      show(loginView, true);
      show(dashView, false);
      showStatus(loginStatus, "تم الدخول لكن لا توجد صلاحية (ليست ضمن admins).", "err");
      return;
    }

    show(loginView, false);
    show(dashView, true);
    await refresh();
  }

  async function refresh(){
    clearStatus(dashStatus);
    setText(countLine, "جارٍ التحميل...");

    const filters = {
      search: (fSearch?.value || "").trim(),
      specialization: (fSpec?.value || "").trim(),
      city: (fCity?.value || "").trim(),
      status: (fStatus?.value || "").trim()
    };

    try{
      const rows = await loadRows(filters);
      setText(countLine, `عدد النتائج: ${rows.length}`);

      if (!rows.length){
        tbody.innerHTML = `<tr><td colspan="5" class="muted">لا توجد نتائج.</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(r => {
        const name = r.full_name || "—";
        const contact = [r.phone, r.email].filter(Boolean).join(" | ") || "—";
        const specCity = [r.specialization, r.city].filter(Boolean).join(" — ") || "—";
        const status = r.status || "new";
        const hasCv = !!r.cv_path;

        // status select
        const statusSelect = `
          <select data-act="status" data-id="${esc(r.id)}" style="padding:8px 10px;border-radius:10px;border:1px solid var(--nahj-border);">
            ${["new","shortlisted","contacted","rejected","archived"].map(s => `
              <option value="${s}" ${s===status ? "selected" : ""}>${s}</option>
            `).join("")}
          </select>
        `;

        const cvBtn = hasCv
          ? `<button class="btn btn-ghost btn-sm" data-act="cv" data-path="${esc(r.cv_path)}" type="button">تحميل CV</button>`
          : `<span class="muted">بدون CV</span>`;

        const details = `
          <span class="linkish" data-act="details" data-id="${esc(r.id)}">عرض</span>
        `;

        return `
          <tr>
            <td>${esc(fmtDate(r.created_at))}</td>
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

    }catch(err){
      console.error(err);
      showStatus(dashStatus, "خطأ في جلب البيانات: " + (err?.message || ""), "err");
      tbody.innerHTML = `<tr><td colspan="5" class="muted">—</td></tr>`;
      setText(countLine, "");
    }
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
    await window.sb.auth.signOut();
    await setView();
  });

  // Apply / refresh
  btnApply?.addEventListener("click", refresh);
  btnRefresh?.addEventListener("click", refresh);

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
        const url = await getCvSignedUrl(path);
        if (!url) throw new Error("لم يتم توليد رابط تحميل.");
        window.open(url, "_blank", "noopener");
      }

      if (act === "save"){
        const id = t.getAttribute("data-id");
        const sel = tbody.querySelector(`select[data-act="status"][data-id="${CSS.escape(id)}"]`);
        const newStatus = sel?.value || "new";
        await updateStatus(id, newStatus);
        showStatus(dashStatus, "تم تحديث الحالة ✅", "ok");
      }

      if (act === "details"){
        const id = t.getAttribute("data-id");
        // Fetch single row for a simple alert details (lightweight)
        const { data, error } = await window.sb
          .from("trainers")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;

        const lines = [
          `الاسم: ${data.full_name || "—"}`,
          `الجوال: ${data.phone || "—"}`,
          `الإيميل: ${data.email || "—"}`,
          `المدينة: ${data.city || "—"}`,
          `التخصص: ${data.specialization || "—"}`,
          `الخبرة: ${data.years_experience ?? "—"}`,
          `LinkedIn: ${data.linkedin_url || "—"}`,
          `الموقع: ${data.website_url || "—"}`,
          `نبذة: ${data.bio || "—"}`,
          `الحالة: ${data.status || "—"}`,
          `التاريخ: ${fmtDate(data.created_at)}`
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
