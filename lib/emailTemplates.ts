// file: lib/emailTemplates.ts

type Lang = "en" | "mm";
type ActivityType = "register" | "login" | "google-login" | "logout";

type ActivityProps = {
  type: ActivityType;
  name?: string;
  email?: string;
  date?: string;
  time?: string;
  device?: string;
  ip?: string;
  lang?: Lang;
};

type OtpProps = {
  name?: string;
  otp: string;
  title?: string;
  lang?: Lang;
};

const colors = {
  register: {
    from: "#10b981",
    via: "#14b8a6",
    to: "#22c55e",
    light: "#ecfdf5",
    border: "#bbf7d0",
    text: "#166534",
  },
  login: {
    from: "#6366f1",
    via: "#8b5cf6",
    to: "#ec4899",
    light: "#eef2ff",
    border: "#c7d2fe",
    text: "#3730a3",
  },
  "google-login": {
    from: "#4285f4",
    via: "#a855f7",
    to: "#ea4335",
    light: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  },
  logout: {
    from: "#f97316",
    via: "#f59e0b",
    to: "#ef4444",
    light: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
  },
};

const copy = {
  en: {
    brand: "Alumni Network",
    hello: "Hello",
    alumni: "Alumni",
    registerTitle: "Registration Successful",
    registerText: "Your Alumni Network account has been registered successfully.",
    loginTitle: "Login Alert",
    loginText: "Your Alumni Network account was logged in successfully.",
    googleTitle: "Google Login Alert",
    googleText: "Your Alumni Network account was logged in successfully using Google.",
    logoutTitle: "Logout Alert",
    logoutText: "Your Alumni Network account was logged out successfully.",
    warning: "If this was not you, please secure your account immediately.",
    otpTitle: "Verification Code",
    otpText: "Your OTP code is:",
    expire: "This OTP will expire in 10 minutes.",
    ignore: "If you did not request this, please ignore this email.",
    details: "Activity Details",
    name: "Name",
    email: "Email",
    date: "Date",
    time: "Time",
    device: "Device",
    ip: "IP Address",
  },
  mm: {
    brand: "ကျောင်းသားဟောင်း ကွန်ယက်",
    hello: "မင်္ဂလာပါ",
    alumni: "Alumni",
    registerTitle: "စာရင်းသွင်းမှု အောင်မြင်ပါသည်",
    registerText: "သင့် Alumni Network အကောင့်ကို အောင်မြင်စွာ စာရင်းသွင်းပြီးပါပြီ။",
    loginTitle: "ဝင်ရောက်မှု အသိပေးချက်",
    loginText: "သင့် Alumni Network အကောင့်ကို အောင်မြင်စွာ ဝင်ရောက်ခဲ့ပါသည်။",
    googleTitle: "Google ဖြင့် ဝင်ရောက်မှု အသိပေးချက်",
    googleText: "သင့် Alumni Network အကောင့်ကို Google ဖြင့် အောင်မြင်စွာ ဝင်ရောက်ခဲ့ပါသည်။",
    logoutTitle: "ထွက်ခွာမှု အသိပေးချက်",
    logoutText: "သင့် Alumni Network အကောင့်မှ အောင်မြင်စွာ ထွက်ခွာခဲ့ပါသည်။",
    warning: "ဤလုပ်ဆောင်မှုသည် သင်မဟုတ်ပါက သင့်အကောင့်ကို ချက်ချင်းကာကွယ်ပါ။",
    otpTitle: "အတည်ပြုကုဒ်",
    otpText: "သင့် OTP ကုဒ်မှာ:",
    expire: "ဤ OTP သည် ၁၀ မိနစ်အတွင်း သက်တမ်းကုန်ပါမည်။",
    ignore: "ဤတောင်းဆိုမှုကို သင်မပြုလုပ်ခဲ့ပါက ဤ Email ကို လျစ်လျူရှုနိုင်ပါသည်။",
    details: "လုပ်ဆောင်မှု အသေးစိတ်",
    name: "အမည်",
    email: "Email",
    date: "နေ့စွဲ",
    time: "အချိန်",
    device: "စက်ပစ္စည်း",
    ip: "IP လိပ်စာ",
  },
};

function safe(value?: string | number | null) {
  return String(value || "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell({
  lang,
  title,
  type,
  children,
}: {
  lang: Lang;
  title: string;
  type: ActivityType | "otp";
  children: string;
}) {
  const c = copy[lang];
  const color = type === "otp" ? colors.login : colors[type];

  return `
<!DOCTYPE html>
<html lang="${lang}">
<body style="margin:0;background:#f8fafc;padding:0;">
  <div style="font-family:${lang === "mm" ? "'Pyidaungsu','Noto Sans Myanmar',Arial,sans-serif" : "Inter,Arial,sans-serif"};background:linear-gradient(135deg,#eef2ff,#ffffff,#fdf2f8);padding:34px 16px;color:#0f172a;">
    <div style="max-width:660px;margin:auto;background:white;border-radius:30px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.14);border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,${color.from},${color.via},${color.to});padding:36px 28px;text-align:center;color:white;">
        <div style="display:inline-block;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);padding:8px 16px;border-radius:999px;font-weight:800;font-size:13px;">
          ${safe(c.brand)}
        </div>
        <h1 style="margin:18px 0 0;font-size:30px;line-height:1.3;font-weight:900;">${safe(title)}</h1>
      </div>

      <div style="padding:34px 28px;">
        ${children}
      </div>

      <div style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;color:#64748b;font-size:13px;">© ${new Date().getFullYear()} ${safe(c.brand)}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function row(label: string, value?: string) {
  return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:800;">${safe(label)}</td>
  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${safe(value)}</td>
</tr>`;
}

export function activityTemplate({
  type,
  name,
  email,
  date,
  time,
  device,
  ip,
  lang = "en",
}: ActivityProps) {
  const c = copy[lang];
  const color = colors[type];

  const title =
    type === "register"
      ? c.registerTitle
      : type === "google-login"
        ? c.googleTitle
        : type === "logout"
          ? c.logoutTitle
          : c.loginTitle;

  const message =
    type === "register"
      ? c.registerText
      : type === "google-login"
        ? c.googleText
        : type === "logout"
          ? c.logoutText
          : c.loginText;

  return shell({
    lang,
    title,
    type,
    children: `
<p style="margin:0 0 12px;font-size:16px;line-height:1.8;">
  ${safe(c.hello)} <b>${safe(name || c.alumni)}</b>,
</p>

<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.8;">
  ${safe(message)}
</p>

<div style="border-radius:22px;background:${color.light};border:1px solid ${color.border};padding:20px;">
  <p style="margin:0 0 10px;color:${color.text};font-size:15px;font-weight:900;">
    ${safe(c.details)}
  </p>

  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    ${row(c.name, name || c.alumni)}
    ${row(c.email, email)}
    ${row(c.date, date)}
    ${row(c.time, time)}
    ${row(c.device, device)}
    ${row(c.ip, ip)}
  </table>
</div>

${
  type === "register"
    ? ""
    : `<div style="margin-top:24px;border-left:4px solid ${color.from};background:#f8fafc;border-radius:16px;padding:16px 18px;">
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;font-weight:700;">${safe(c.warning)}</p>
      </div>`
}
`,
  });
}

export function otpTemplate({ name, otp, title, lang = "en" }: OtpProps) {
  const c = copy[lang];

  return shell({
    lang,
    title: title || c.otpTitle,
    type: "otp",
    children: `
<p style="margin:0 0 12px;font-size:16px;line-height:1.8;">
  ${safe(c.hello)} <b>${safe(name || c.alumni)}</b>,
</p>

<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.8;">
  ${safe(c.otpText)}
</p>

<div style="margin:24px 0;text-align:center;">
  <div style="display:inline-block;background:linear-gradient(135deg,#eef2ff,#fdf2f8);border:1px solid #c7d2fe;border-radius:22px;padding:22px 30px;font-size:42px;font-weight:900;letter-spacing:10px;color:#312e81;">
    ${safe(otp)}
  </div>
</div>

<div style="margin-top:24px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;padding:18px;">
  <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.7;">${safe(c.expire)}</p>
  <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">${safe(c.ignore)}</p>
</div>
`,
  });
}

export function loginTemplate(name?: string, lang: Lang = "en", data?: Partial<ActivityProps>) {
  return activityTemplate({ type: "login", name, lang, ...data });
}

export function googleLoginTemplate(name?: string, lang: Lang = "en", data?: Partial<ActivityProps>) {
  return activityTemplate({ type: "google-login", name, lang, ...data });
}

export function logoutTemplate(name?: string, lang: Lang = "en", data?: Partial<ActivityProps>) {
  return activityTemplate({ type: "logout", name, lang, ...data });
}

export function registerSuccessTemplate(name?: string, lang: Lang = "en", data?: Partial<ActivityProps>) {
  return activityTemplate({ type: "register", name, lang, ...data });
}