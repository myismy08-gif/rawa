/* =========================================================
   Join Trainer Submit (ROOT)
   - NO required fields
   - Optional CV upload to bucket: cvs (private)
   - Inserts row into public.trainers
========================================================= */

function nahjShowStatus(el, msg, kind){
  if (!el) return;
  el.style.display = "block";
  el.classList.remove("ok","err");
  if (kind) el.classList.add(kind);
  el.textContent = msg;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#join-trainer-form");
  const statusEl = document.querySelector("#form-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // If config is not set, show a clear message
    if (!window.sb) {
      nahjShowStatus(statusEl, "الإعدادات غير مكتملة: تأكدي من supabase_config.js (URL + ANON KEY).", "err");
      return;
    }

    const fd = new FormData(form);

    const payload = {
      full_name: (fd.get("full_name") || "").toString().trim() || null,
      phone: (fd.get("phone") || "").toString().trim() || null,
      email: (fd.get("email") || "").toString().trim() || null,
      city: (fd.get("city") || "").toString().trim() || null,
      specialization: (fd.get("specialization") || "").toString().trim() || null,
      years_experience: (() => {
        const v = (fd.get("years_experience") || "").toString().trim();
        if (!v) return null;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
      })(),
      bio: (fd.get("bio") || "").toString().trim() || null,
      linkedin_url: (fd.get("linkedin_url") || "").toString().trim() || null,
      website_url: (fd.get("website_url") || "").toString().trim() || null,
      cv_path: null
    };

    const cvFile = fd.get("cv");

    try {
      // 1) Optional CV upload
      if (cvFile instanceof File && cvFile.size > 0) {
        const safeName = cvFile.name.replace(/[^\w.\-]+/g, "_");
        const path = `public/${Date.now()}_${safeName}`;

        const { error: upErr } = await window.sb.storage
          .from("cvs")
          .upload(path, cvFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream"
          });

        if (upErr) throw upErr;
        payload.cv_path = path;
      }

      // 2) Insert application (even if all fields are empty)
      const { error: insErr } = await window.sb
        .from("trainers")
        .insert([payload]);

      if (insErr) throw insErr;

      nahjShowStatus(statusEl, "تم إرسال طلبك بنجاح ✅", "ok");
      form.reset();

    } catch (err) {
      console.error(err);
      nahjShowStatus(statusEl, "صار خطأ أثناء الإرسال ❌\n" + (err?.message || "حاولي مرة ثانية"), "err");
    }
  });
});
