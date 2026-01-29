/* =========================================================
   NAHJ Website Script
   - Typing effect
   - Tracks (beneficiaries) expand/collapse
   - Footer Newsletter -> EmailJS
========================================================= */

// =========================
// Typing effect (Hero)
// =========================
(() => {
  const typingEl = document.getElementById("typing-text");
  if (!typingEl) return;

  const phrases = [
    "Training & Health Education",
    "التدريب والتثقيف الصحي",
    "For Business Services",
  ];

  let p = 0;
  let i = 0;
  let deleting = false;

  function typeLoop() {
    const current = phrases[p];

    typingEl.textContent = deleting
      ? current.slice(0, i--)
      : current.slice(0, i++);

    if (!deleting && i > current.length + 12) {
      deleting = true;
    }

    if (deleting && i < 0) {
      deleting = false;
      p = (p + 1) % phrases.length;
      i = 0;
    }

    setTimeout(typeLoop, deleting ? 45 : 65);
  }

  typeLoop();
})();

// =========================
// Tracks expand/collapse
// =========================
(() => {
  const tracks = document.querySelectorAll(".track");
  if (!tracks.length) return;

  tracks.forEach((card) => {
    card.addEventListener("click", () => {
      tracks.forEach((c) => {
        if (c !== card) c.classList.remove("active");
      });
      card.classList.toggle("active");
    });
  });
})();

// =========================
// Newsletter -> EmailJS
// =========================
(() => {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;

  const success = document.getElementById("success");
  const error = document.getElementById("error");

  // ✅ Your EmailJS configuration
  const EMAILJS_PUBLIC_KEY = "KObVMqi571bw1E-YV"; // ✅ Public Key
  const EMAILJS_SERVICE_ID = "service_vo34r5q"; // 🔴 Replace with your Service ID
  const EMAILJS_TEMPLATE_ID = "template_eemy0hr"; // ✅ Template ID

  // Hide messages at start
  if (success) success.style.display = "none";
  if (error) error.style.display = "none";

  function showMessage(el, ms = 2500) {
    if (!el) return;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, ms);
  }

  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide previous state
    if (success) success.style.display = "none";
    if (error) error.style.display = "none";

    const btn = newsletterForm.querySelector("button[type='submit']");
    const oldText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      const currentLang = localStorage.getItem("nahj_lang") || "ar";
      btn.textContent = (dict[currentLang] && dict[currentLang].newsletter_sending) ? dict[currentLang].newsletter_sending : "Sending...";
    }

    try {
      // Check library loaded
      if (typeof emailjs === "undefined") {
        throw new Error("EmailJS library not loaded");
      }

      // Init EmailJS (safe to call multiple times)
      emailjs.init(EMAILJS_PUBLIC_KEY);

      // Send form fields (name="email" and name="message")
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        newsletterForm
      );

      showMessage(success, 2500);
      newsletterForm.reset();
    } catch (err) {
      console.error("EmailJS Error:", err);
      showMessage(error, 3000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || "إرسال";
      }
    }
  });
})();

// =========================
// Navbar Axes Dropdown (محاورنا)
// =========================
(() => {
  const dropdown = document.querySelector(".nav-dropdown");
  const btn = document.querySelector(".nav-dropbtn");
  const menu = document.querySelector(".nav-dropdown-menu");

  if (!dropdown || !btn || !menu) return;

  function closeMenu() {
    dropdown.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    dropdown.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }

  // ✅ Mobile / touch: open by click
  btn.addEventListener("click", (e) => {
    // On desktop we prefer hover behavior (CSS)
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    if (!isMobile) return;

    e.preventDefault();
    e.stopPropagation();

    const isOpen = dropdown.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Prevent closing when tapping inside menu (mobile)
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close on outside click
  document.addEventListener("click", () => closeMenu());

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // If screen resized to desktop: close "open" state
  window.addEventListener("resize", () => {
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    if (!isMobile) closeMenu();
  });
})();

// =========================
// Language Toggle (AR/EN) + RTL/LTR (Full Homepage)
// =========================
(() => {
  const toggleBtn = document.querySelector(".lang-toggle");
  if (!toggleBtn) return;

  const dict = {
    ar: {
      // header
      logo_line1: "نهج للتدريب والتثقيف الصحي",
      logo_line2: "لخدمات الأعمال",
      nav_about: "عن نهج",
      nav_services: "خدماتنا",
      nav_axes: "محاورنا",
      axes_menu_title: "محاور نهج الأساسية",
      axis_training: "التدريب والتطوير",
      axis_health: "التثقيف الصحي",
      axis_accredit: "الاعتمادات والشهادات",
      axis_consult: "الاستشارات",
      axis_projects: "إدارة المشاريع",
      nav_partners: "شركاؤنا",
      nav_contact: "تواصل معنا",

      // partners section
      partners_title: "نتعاون مع جهات رائدة لدعم تطوير الكفاءات<br/>وتقديم برامج بمعايير جودة عالية",
      partners_link: "استعرض الشراكات ‹",
      join_trainer: "انضم كمدرب",

      // hero
      hero_title_html: `نهج… <span class="hero-title__accent">شريك موثوق</span><br/>لتطوير الكوادر وصناعة الأثر`,
      hero_subtitle_html: `حلول تدريبية وتثقيفية بأثر مستدام.<br/>
      نصمّم البرامج وفق احتياج الجهة وننفّذها بمعايير جودة عالية،<br/>
      مع متابعة وقياس يترجم النتائج إلى قيمة ملموسة.`,
      hero_points: [
        "محتوى حديث ومعايير جودة",
        "حلول تناسب الأفراد والمنشآت",
        "متابعة وتقييم للأثر"
      ],
      btn_services: "استعرض خدماتنا",
      btn_contact: "تواصل معنا",

      // mission / quote
      mission_quote: "“نسعى أن نكون شريكًا موثوقًا في تطوير الكوادر البشرية وتمكين المجتمع من خلال نشر ثقافة الوعي الصحي”",
      mission_title: "رسالتنا",

      // about
      about_label_who: "من نحن",
      about_label_vision: "رؤيتنا",
      about_who_title: "شركة نهج للتدريب والتثقيف الصحي",
      about_who_p1: "نحن في شركة نهج للتدريب والتثقيف الصحي لخدمات الأعمال، نسعى أن نكون شريكًا موثوقًا في تطوير الكوادر البشرية وتمكين المجتمع من خلال نشر ثقافة الوعي الصحي وتقديم برامج تدريبية متخصصة.",
      about_who_p2: "نعمل بخطط مدروسة ونهج احترافي يدمج بين التدريب، التثقيف، والاستشارات لتقديم حلول عملية ومستدامة تسهم في رفع كفاءة الأفراد والمنشآت في القطاعين الخاص والعام.",
      about_vision_title: "ريادة وطنية في التدريب والتثقيف الصحي",
      about_vision_p1: "أن نكون الجهة الرائدة في مجال التدريب والتثقيف الصحي على مستوى المملكة، من خلال جودة المحتوى، وابتكار أساليب تدريبية حديثة، وبناء شراكات استراتيجية تسهم في تحقيق مستهدفات رؤية السعودية 2030 في تطوير رأس المال البشري ورفع جودة الحياة.",

      // beneficiaries
      beneficiaries_title: "فئات المستفيدين من خدمات نهج",
      benef_track1_title: "برامج الأفراد",
      benef_track1_sub: "برامج تطوير وبناء مهارات",
      benef_track1_details: "برامج تدريبية وتوعوية تستهدف تطوير المهارات الفردية وبناء القدرات المهنية وفق احتياجات سوق العمل.",
      benef_track2_title: "برامج قطاعات الشركات",
      benef_track2_sub: "حلول تدريبية مخصصة",
      benef_track2_details: "برامج تدريبية مصممة لرفع كفاءة الموظفين وتطوير الأداء المؤسسي وتحقيق الأهداف الاستراتيجية.",
      benef_track3_title: "برامج القطاعات الحكومية",
      benef_track3_sub: "تمكين الكفاءات الوطنية",
      benef_track3_details: "برامج تدريبية وتوعوية تسهم في تطوير الكوادر ودعم مستهدفات رؤية السعودية 2030.",
      benef_track4_title: "التدريب الإلكتروني",
      benef_track4_sub: "تعلم مرن وعن بُعد",
      benef_track4_details: "برامج تدريبية رقمية تتيح الوصول إلى المحتوى التدريبي في أي وقت ومن أي مكان.",

      // axes cards
      axes_title: "محاور نهج الأساسية",
      axis_training_title: "التدريب والتطوير",
      axis_training_desc: "تصميم وتنفيذ برامج تدريبية نوعية تواكب احتياجات الأفراد والمنشآت وفق أعلى معايير الجودة.",
      axis_health_title: "التثقيف الصحي",
      axis_health_desc: "نشر ثقافة الوعي الصحي من خلال برامج توعوية موجهة لمختلف شرائح المجتمع.",
      axis_accredit_title: "الاعتمادات والشهادات",
      axis_accredit_desc: "دعم المراكز والمدربين للحصول على الاعتمادات والشهادات المهنية المعتمدة.",
      axis_consult_title: "الاستشارات",
      axis_consult_desc: "تقديم حلول استشارية تدريبية وإدارية وتشغيلية تحقق الأثر والاستدامة.",
      axis_projects_title: "إدارة المشاريع",
      axis_projects_desc: "إدارة وتشغيل المشاريع التدريبية باحترافية عالية من التخطيط إلى التقييم.",

      // services
      services_tag: "خدماتنا",
      services_title: "البرامج التدريبية",
      services_intro: "تقدم نهج حزمة من البرامج التدريبية النوعية التي يتم تنفيذها وفق أعلى معايير الجودة والاحترافية...",
      services_fields_title: "مجالات البرامج التدريبية",

      // fields (1..17)
      services_field_1: "البرامج الإدارية والقيادية",
      services_field_2: "برامج الموارد البشرية والتدريب",
      services_field_3: "برامج إدارة المشاريع PMP",
      services_field_4: "برامج التسويق والمبيعات",
      services_field_5: "برامج المحاسبة والمالية",
      services_field_6: "برامج تطوير الذات",
      services_field_7: "برامج العلاقات العامة والإعلام",
      services_field_8: "برامج القانون",
      services_field_9: "برامج الجودة",
      services_field_10: "برامج الإمدادات والمشتريات",
      services_field_11: "البرامج التعليمي والتربوي",
      services_field_12: "برامج الأمن والسلامة",
      services_field_13: "برامج تقنية المعلومات والحاسب الآلي",
      services_field_14: "البرامج الصحية والتمريض",
      services_field_15: "برامج البنوك والتأمين",
      services_field_16: "برامج الحرفية والهوايات الشخصية",
      services_field_17: "برامج البيئة والزراعة",

      // projects ops
      projects_title: "إدارة وتشغيل المشاريع التدريبية",
      projects_intro: "نقدم خدمات متكاملة في إدارة وتشغيل المشاريع التدريبية باحترافية عالية...",
      ops_title: "مهام إدارة وتشغيل المشاريع التدريبية",
      label_prep: "التحضير",
      label_ops: "التشغيل",
      label_output: "المخرجات",
      list_prep_1: "تنسيق وتنظيم الخطط التدريبية",
      list_prep_2: "تجهيز قاعات التدريب والمتطلبات الفنية",
      list_ops_1: "إدارة حضور المتدربين والسجلات",
      list_ops_2: "التنسيق مع المدربين",
      list_ops_3: "إدارة منصات التدريب الإلكتروني",
      list_output_1: "إعداد وطباعة الحقائب التدريبية",
      list_output_2: "تجهيز الشهادات وتقارير تقييم الأداء",

      // kits (if present)
      kits_title: "الحقائب التدريبية",
      kits_intro: "إعداد وتصميم حقائب تدريبية احترافية تشمل المحتوى والعروض والتمارين والأدلة وفق أعلى المعايير.",
      kits_card_1_title: "تصميم الحقائب",
      kits_card_1_desc: "إعداد وتصميم الحقائب التدريبية (ورقية أو رقمية) وفق معايير الجودة.",
      kits_card_2_title: "الأنشطة التفاعلية",
      kits_card_2_desc: "تنظيم المحتوى وتطوير الأنشطة والتطبيقات التفاعلية.",
      kits_card_3_title: "العروض التعليمية",
      kits_card_3_desc: "تجهيز العروض التقديمية والمواد التعليمية المساندة.",
      kits_card_4_title: "تخصيص الحقائب",
      kits_card_4_desc: "تخصيص الحقائب للقطاعات المختلفة حسب الاحتياج.",

      // footer
      footer_about: "عن نهج",
      footer_about_text: "شركة نهج للتدريب والتثقيف الصحي، نسعى إلى تمكين الأفراد وتطوير بيئات العمل من خلال برامج تدريبية وتوعوية احترافية ذات أثر مستدام.",
      footer_links: "روابط مهمة",
      footer_map: "خريطة الموقع",
      footer_contact: "تواصل معنا",
      footer_newsletter: "ليصلك كل جديد",
      footer_newsletter_desc: "اشترك في النشرة البريدية ليصلك كل جديد",
      footer_link_about: "عن نهج",
      footer_link_contact: "تواصل معنا",
      footer_link_join: "انضم كمدرب",
      footer_map_services: "البرامج التدريبية",
      footer_map_axes: "محاور نهج",
      footer_map_partners: "شركاؤنا",
      footer_map_consult: "الاستشارات",
      newsletter_placeholder: "أدخل بريدك الإلكتروني",
      newsletter_send: "إرسال",
      newsletter_sending: "جارٍ الإرسال...",
      newsletter_success: "تم الإرسال بنجاح ✅",
      newsletter_error: "❌ حدث خطأ أثناء الإرسال، جرّب مرة أخرى",
      footer_bottom: "© جميع الحقوق محفوظة – شركة نهج للتدريب والتثقيف الصحي",
    
      philo_title: "فلسفتنا في التدريب",
      philo_desc: "تعتمد نهج على منهجية تدريب احترافية تبدأ من فهم الاحتياج الحقيقي، وتنتهي بتحقيق أثر ملموس ومستدام من خلال برامج مصممة خصيصًا وتنفيذ احترافي مع تحسين مستمر.",
      philo_step1_title: "دراسة الاحتياجات التدريبية",
      philo_step1_desc: "بالتعاون مع الإدارات العليا والموارد البشرية.",
      philo_step2_title: "تصميم الاستبيانات والمقابلات",
      philo_step2_desc: "ورش عمل واجتماعات لفهم الاحتياج بدقة.",
      philo_step3_title: "تحليل الاحتياجات",
      philo_step3_desc: "تحليل معمق عبر خبراء متخصصين.",
      philo_step4_title: "تقديم الحلول التدريبية",
      philo_step4_desc: "برامج مناسبة لاحتياج العميل.",
      philo_step5_title: "التصميم والتنفيذ",
      philo_step5_desc: "تنفيذ احترافي بمنهجية Know-how.",
      philo_step6_title: "المتابعة والتحسين",
      philo_step6_desc: "قياس الأثر والتحسين المستمر.",
},

    en: {
      // header
      logo_line1: "Nahj for Training & Health Education",
      logo_line2: "Business Services",
      nav_about: "About Nahj",
      nav_services: "Services",
      nav_axes: "Axes",
      axes_menu_title: "Nahj Core Axes",
      axis_training: "Training & Development",
      axis_health: "Health Education",
      axis_accredit: "Accreditations & Certificates",
      axis_consult: "Consulting",
      axis_projects: "Project Management",
      nav_partners: "Partners",
      nav_contact: "Contact",

      // partners section
      partners_title: "We collaborate with leading organizations to develop talents<br/>and deliver high-quality programs",
      partners_link: "View partnerships ‹",
      join_trainer: "Join as a Trainer",

      // hero
      hero_title_html: `Nahj… <span class="hero-title__accent">a trusted partner</span><br/>for developing talents and creating impact`,
      hero_subtitle_html: `Training and educational solutions with sustainable impact.<br/>
      We design programs tailored to your needs and deliver them with high quality standards,<br/>
      supported by follow-up and measurement that turns results into real value.`,
      hero_points: [
        "Modern content & quality standards",
        "Solutions for individuals & organizations",
        "Impact tracking & evaluation"
      ],
      btn_services: "Explore Services",
      btn_contact: "Contact Us",

      // mission / quote
      mission_quote: "“We aim to be a trusted partner in developing human capital and empowering society through promoting health awareness.”",
      mission_title: "Our Mission",

      // about
      about_label_who: "Who We Are",
      about_label_vision: "Our Vision",
      about_who_title: "Nahj for Training & Health Education",
      about_who_p1: "At Nahj for Training & Health Education (Business Services), we aim to be a trusted partner in developing human capital and empowering society through promoting health awareness and delivering specialized training programs.",
      about_who_p2: "We work with structured plans and a professional approach that integrates training, education, and consulting to deliver practical, sustainable solutions that enhance individual and organizational performance in both the private and public sectors.",
      about_vision_title: "National Leadership in Training & Health Education",
      about_vision_p1: "To be the leading entity in training and health education across the Kingdom through content quality, innovative training methods, and strategic partnerships that support Saudi Vision 2030 goals in human capital development and quality of life.",

      // beneficiaries
      beneficiaries_title: "Beneficiary Categories",
      benef_track1_title: "Individual Programs",
      benef_track1_sub: "Skill building & development",
      benef_track1_details: "Training and awareness programs designed to develop personal skills and professional capabilities aligned with market needs.",
      benef_track2_title: "Corporate Sector Programs",
      benef_track2_sub: "Tailored training solutions",
      benef_track2_details: "Customized programs that enhance employee efficiency, improve institutional performance, and achieve strategic goals.",
      benef_track3_title: "Government Sector Programs",
      benef_track3_sub: "Empowering national talent",
      benef_track3_details: "Programs that develop competencies and support Saudi Vision 2030 objectives.",
      benef_track4_title: "E‑Learning",
      benef_track4_sub: "Flexible remote learning",
      benef_track4_details: "Digital programs that provide access to training content anytime, anywhere.",

      // axes cards
      axes_title: "Nahj Core Axes",
      axis_training_title: "Training & Development",
      axis_training_desc: "Design and deliver high-quality training programs tailored to individuals and organizations.",
      axis_health_title: "Health Education",
      axis_health_desc: "Promote health awareness through educational programs for diverse community groups.",
      axis_accredit_title: "Accreditations & Certificates",
      axis_accredit_desc: "Support centers and trainers to obtain professional accreditations and certificates.",
      axis_consult_title: "Consulting",
      axis_consult_desc: "Provide training, administrative, and operational consulting solutions with measurable impact.",
      axis_projects_title: "Project Management",
      axis_projects_desc: "Manage and operate training projects professionally from planning to evaluation.",

      // services
      services_tag: "Our Services",
      services_title: "Training Programs",
      services_intro: "Nahj offers a portfolio of high-quality training programs delivered with professionalism and excellence...",
      services_fields_title: "Training Program Areas",

      services_field_1: "Administrative & Leadership Programs",
      services_field_2: "HR & Training Programs",
      services_field_3: "Project Management (PMP)",
      services_field_4: "Marketing & Sales",
      services_field_5: "Accounting & Finance",
      services_field_6: "Self Development",
      services_field_7: "PR & Media",
      services_field_8: "Law",
      services_field_9: "Quality Management",
      services_field_10: "Supply & Procurement",
      services_field_11: "Education & Pedagogy",
      services_field_12: "Security & Safety",
      services_field_13: "IT & Computer Skills",
      services_field_14: "Healthcare & Nursing",
      services_field_15: "Banking & Insurance",
      services_field_16: "Crafts & Personal Hobbies",
      services_field_17: "Environment & Agriculture",

      // projects ops
      projects_title: "Training Project Operations",
      projects_intro: "We provide end-to-end services to manage and operate training projects with high professionalism...",
      ops_title: "Key Responsibilities",
      label_prep: "Preparation",
      label_ops: "Operations",
      label_output: "Outputs",
      list_prep_1: "Plan and coordinate training schedules",
      list_prep_2: "Prepare training rooms and technical requirements",
      list_ops_1: "Manage attendance and trainee records",
      list_ops_2: "Coordinate with trainers",
      list_ops_3: "Manage e-learning platforms",
      list_output_1: "Prepare and print training materials",
      list_output_2: "Issue certificates and performance evaluation reports",

      // kits
      kits_title: "Training Kits",
      kits_intro: "Professional training kits including content, slides, exercises, and guides based on best practices.",
      kits_card_1_title: "Content Design",
      kits_card_1_desc: "Build structured content that fits the target audience.",
      kits_card_2_title: "Presentations",
      kits_card_2_desc: "Create professional slides that support delivery.",
      kits_card_3_title: "Exercises",
      kits_card_3_desc: "Design practical activities to reinforce learning.",
      kits_card_4_title: "Templates & Guides",
      kits_card_4_desc: "Ready-to-use templates that help implementation and follow-up.",

      // footer
      footer_about: "About Nahj",
      footer_about_text: "Nahj for Training & Health Education empowers individuals and workplaces through professional training and awareness programs with sustainable impact.",
      footer_links: "Quick Links",
      footer_map: "Site Map",
      footer_contact: "Get in Touch",
      footer_newsletter: "Stay Updated",
      footer_newsletter_desc: "Subscribe to our newsletter to receive the latest updates.",
      footer_link_about: "About Nahj",
      footer_link_contact: "Contact",
      footer_link_join: "Join as a Trainer",
      footer_map_services: "Training Programs",
      footer_map_axes: "Axes",
      footer_map_partners: "Partners",
      footer_map_consult: "Consulting",
      newsletter_placeholder: "Enter your email",
      newsletter_send: "Send",
      newsletter_sending: "Sending...",
      newsletter_success: "Sent successfully ✅",
      newsletter_error: "❌ Sending failed, please try again",
      footer_bottom: "© All rights reserved – Nahj for Training & Health Education",
    
      philo_title: "Our Training Philosophy",
      philo_desc: "Nahj follows a professional training methodology that starts with understanding real needs and ends with measurable, sustainable impact through tailored programs, professional delivery, and continuous improvement.",
      philo_step1_title: "Training Needs Assessment",
      philo_step1_desc: "In collaboration with senior management and HR teams.",
      philo_step2_title: "Surveys & Interviews Design",
      philo_step2_desc: "Workshops and meetings to accurately capture needs.",
      philo_step3_title: "Needs Analysis",
      philo_step3_desc: "In-depth analysis by specialized experts.",
      philo_step4_title: "Training Solutions Proposal",
      philo_step4_desc: "Programs aligned with the client’s needs.",
      philo_step5_title: "Design & Delivery",
      philo_step5_desc: "Professional execution using proven know-how.",
      philo_step6_title: "Follow-up & Improvement",
      philo_step6_desc: "Impact measurement and continuous enhancement.",
},
  };

  function setHTML(sel, html) {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = html;
  }

  function applyI18n(lang) {
    // direction + language
    document.documentElement.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "ar");

    // toggle button label
    toggleBtn.textContent = lang === "en" ? "AR" : "EN";

    // generic i18n for text nodes
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = dict[lang][key];
      if (typeof val === "undefined") return;

      // Keep icons / nested elements safe: if element contains other tags and not a plain text container, only update its textContent
      if (/<br\s*\/?\s*>/i.test(val)) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = dict[lang][key];
      if (typeof val === "undefined") return;
      el.setAttribute("placeholder", val);
    });

    // HERO (needs HTML)
    setHTML(".hero-title", dict[lang].hero_title_html);
    setHTML(".hero-subtitle", dict[lang].hero_subtitle_html);

    const points = document.querySelectorAll(".hero-point span");
    points.forEach((sp, i) => {
      if (dict[lang].hero_points[i]) sp.textContent = dict[lang].hero_points[i];
    });
  }

  // Load saved language
  const saved = localStorage.getItem("nahj_lang") || "ar";
  applyI18n(saved);

  // Toggle on click
  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const current = localStorage.getItem("nahj_lang") || "ar";
    const next = current === "ar" ? "en" : "ar";
    localStorage.setItem("nahj_lang", next);
    applyI18n(next);
  });
})();








document.addEventListener("DOMContentLoaded", () => {
  const btns = document.querySelectorAll(".nav-dropbtn");

  function closeAll(exceptBtn = null) {
    btns.forEach((b) => {
      if (exceptBtn && b === exceptBtn) return;

      const li = b.closest("li") || b.parentElement;
      const menu =
        (li && li.querySelector(".nav-dropdown-menu, .nav-dropdown-content, .dropdown-menu")) ||
        b.nextElementSibling;

      if (menu) menu.classList.remove("is-open");
      b.setAttribute("aria-expanded", "false");
    });
  }

  btns.forEach((btn) => {
    const li = btn.closest("li") || btn.parentElement;
    const menu =
      (li && li.querySelector(".nav-dropdown-menu, .nav-dropdown-content, .dropdown-menu")) ||
      btn.nextElementSibling;

    if (!menu) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = menu.classList.contains("is-open");

      // اقفل أي قائمة ثانية
      closeAll(btn);

      // Toggle نفس الزر
      if (isOpen) {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      } else {
        menu.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // يقفل إذا ضغطتي برا
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-dropbtn, .nav-dropdown-menu, .nav-dropdown-content, .dropdown-menu")) {
      closeAll();
    }
  });

  // يقفل بـ ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
});





// ✅ Nahj: Axes dropdown open/close (mobile + desktop)
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".nav-dropdown");
  if (!dropdown) return;

  const btn = dropdown.querySelector(".nav-dropbtn");
  const menu = dropdown.querySelector(".nav-dropdown-menu");
  if (!btn || !menu) return;

  // Initial state
  btn.setAttribute("aria-expanded", "false");
  menu.setAttribute("hidden", "");

  const isOpen = () => btn.getAttribute("aria-expanded") === "true";

  const openMenu = () => {
    btn.setAttribute("aria-expanded", "true");
    menu.removeAttribute("hidden");
    dropdown.classList.add("is-open");
  };

  const closeMenu = () => {
    btn.setAttribute("aria-expanded", "false");
    menu.setAttribute("hidden", "");
    dropdown.classList.remove("is-open");
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation(); // مهم عشان ضغط الزر ما ينحسب "خارج"
    isOpen() ? closeMenu() : openMenu();
  };

  // 1) Toggle by button
  btn.addEventListener("click", toggleMenu);

  // 2) Close when clicking any link inside the menu
  menu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) closeMenu();
  });

  // 3) Close on outside click / touch
  const outsideClose = (e) => {
    if (!dropdown.contains(e.target)) closeMenu();
  };
  document.addEventListener("click", outsideClose);
  document.addEventListener("touchstart", outsideClose, { passive: true });

  // 4) Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
});
