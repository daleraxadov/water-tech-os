import React, { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  Thermometer,
  Waves,
  Power,
  Activity,
  Bot,
  Send,
  X,
  Monitor,
  MapPinned,
  CalendarDays,
  FileText,
  Zap,
  Settings,
  TrendingUp,
  TrendingDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Leaf,
  Gauge,
  BarChart3,
  ShieldCheck,
  Wifi,
  Database,
  Clock3,
  Map,
  Siren,
  Sparkles,
  ChevronRight,
  LogOut,
  UserCircle2,
  Lock,
  User,
  Save,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

/* ----------------------------- helpers ----------------------------- */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function trendPercent(current, previous) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function nowTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function nowDateTime() {
  return new Date().toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function generateInitialChartData() {
  return [
    { time: "08:00", moisture: 38.2, temperature: 31.8 },
    { time: "08:03", moisture: 38.5, temperature: 31.7 },
    { time: "08:06", moisture: 38.8, temperature: 31.6 },
    { time: "08:09", moisture: 39.0, temperature: 31.5 },
    { time: "08:12", moisture: 39.2, temperature: 31.4 },
    { time: "08:15", moisture: 39.5, temperature: 31.3 },
    { time: "08:18", moisture: 39.7, temperature: 31.2 },
    { time: "08:21", moisture: 40.0, temperature: 31.1 },
    { time: "08:24", moisture: 40.2, temperature: 31.0 },
    { time: "08:27", moisture: 40.5, temperature: 30.9 },
  ];
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function statusByMoisture(value, moistureAlertLimit) {
  if (value < moistureAlertLimit) {
    return {
      label: "Kritik",
      helper: "Sug'orish talab qilinadi",
      chip: "bg-red-50 border-red-200 text-red-600",
    };
  }
  if (value < 45) {
    return {
      label: "Nazorat",
      helper: "Namlik nazoratda",
      chip: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }
  if (value <= 60) {
    return {
      label: "Ideal",
      helper: "Namlik me'yorida",
      chip: "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
  }
  return {
    label: "Yuqori",
    helper: "Namlik yetarli",
    chip: "bg-sky-50 border-sky-200 text-sky-700",
  };
}

function statusByTemperature(value, tempAlertLimit) {
  if (value > tempAlertLimit) {
    return {
      label: "Yuqori",
      chip: "bg-red-50 border-red-200 text-red-600",
    };
  }
  if (value >= 28) {
    return {
      label: "Stabil",
      chip: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }
  return {
    label: "Ideal",
    chip: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
}

function statusByFlow(value) {
  if (value === 0) {
    return {
      label: "To'xtagan",
      chip: "bg-slate-50 border-slate-200 text-slate-600",
    };
  }
  if (value < 10) {
    return {
      label: "Past oqim",
      chip: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }
  return {
    label: "Faol oqim",
    chip: "bg-sky-50 border-sky-200 text-sky-700",
  };
}

const WEEK_DAYS = [
  { key: "mon", label: "Du" },
  { key: "tue", label: "Se" },
  { key: "wed", label: "Cho" },
  { key: "thu", label: "Pa" },
  { key: "fri", label: "Ju" },
  { key: "sat", label: "Sha" },
  { key: "sun", label: "Yak" },
];

/* ----------------------------- UI pieces ----------------------------- */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-3xl border border-emerald-200 bg-white shadow-2xl px-4 py-3">
      <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <p className="text-emerald-700">
          Namlik: <span className="font-bold">{payload[0]?.value}%</span>
        </p>
        <p className="text-orange-600">
          Harorat: <span className="font-bold">{payload[1]?.value}°C</span>
        </p>
      </div>
    </div>
  );
}

function MenuButton({ item, active, collapsed, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 ${
        active
          ? "bg-emerald-500 text-white shadow-lg"
          : "text-white/90 hover:bg-white/10"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {item.name}
      </span>
    </button>
  );
}

function StatCard({ title, value, unit, icon: Icon, trend, status, iconBg }) {
  const positive = trend >= 0;

  return (
    <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs font-semibold inline-flex items-center gap-1 ${
                positive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {positive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {positive ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <h3 className="text-4xl font-bold text-slate-900">{value}</h3>
            <span className="text-slate-500 text-sm mb-1">{unit}</span>
          </div>
        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-5">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${status.chip}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

function SmallInfoCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
  className = "",
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-3xl border border-emerald-200 bg-white shadow-sm p-5 text-left ${
        onClick
          ? "hover:shadow-lg transition-all duration-300 cursor-pointer w-full"
          : ""
      } ${className}`}
      type={onClick ? "button" : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Wrapper>
  );
}

/* ----------------------------- main ----------------------------- */

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => loadLS("wt_auth", false) || false
  );
  const [currentUser, setCurrentUser] = useState(
    () =>
      loadLS("wt_user", {
        username: "admin",
        role: "Admin",
      }) || { username: "admin", role: "Admin" }
  );

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Monitoring");
  const [pumpOn, setPumpOn] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [schedule, setSchedule] = useState(() =>
    loadLS("wt_schedule", {
      startTime: "08:00",
      duration: 30,
      durationUnit: "min",
      days: {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: false,
        sun: false,
      },
    })
  );

  const [tempSchedule, setTempSchedule] = useState(schedule);

  const [settingsData, setSettingsData] = useState(() =>
    loadLS("wt_settings", {
      moistureAlertLimit: 30,
      temperatureAlertLimit: 35,
      flowAlertLimit: 10,
    })
  );

  const [settingsDraft, setSettingsDraft] = useState(settingsData);

  const [moisture, setMoisture] = useState(40.5);
  const [temperature, setTemperature] = useState(30.9);
  const [waterFlow, setWaterFlow] = useState(0);

  const [prev, setPrev] = useState({
    moisture: 40.5,
    temperature: 30.9,
    waterFlow: 0,
  });

  const [chartData, setChartData] = useState(generateInitialChartData());

  const [eventLogs, setEventLogs] = useState(() =>
    loadLS("wt_events", [
      {
        id: 1,
        title: "Tizim ishga tushdi",
        desc: "Dashboard holati tayyorlandi",
        time: nowDateTime(),
        tone: "emerald",
      },
    ])
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState(() =>
    loadLS("wt_chat", [
      {
        role: "ai",
        text: "Assalomu alaykum. WaterTech AI yordamchisi ishga tayyor. Monitoring, namlik, nasos va tahlillar bo‘yicha savol berishingiz mumkin.",
      },
    ])
  );

  const [lastAlertType, setLastAlertType] = useState({
    moisture: false,
    temperature: false,
  });

  useEffect(() => {
    saveLS("wt_settings", settingsData);
  }, [settingsData]);

  useEffect(() => {
    saveLS("wt_events", eventLogs);
  }, [eventLogs]);

  useEffect(() => {
    saveLS("wt_chat", messages);
  }, [messages]);

  useEffect(() => {
    saveLS("wt_auth", isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    saveLS("wt_user", currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveLS("wt_schedule", schedule);
  }, [schedule]);

  useEffect(() => {
    if (!showBubble) return;
    const timer = setTimeout(() => setShowBubble(false), 5000);
    return () => clearTimeout(timer);
  }, [showBubble]);

  const addEvent = (title, desc, tone = "emerald") => {
    setEventLogs((prevLogs) => [
      {
        id: Date.now(),
        title,
        desc,
        time: nowDateTime(),
        tone,
      },
      ...prevLogs,
    ].slice(0, 20));
  };

  const openScheduleModal = () => {
    setTempSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
  };

  const handleSaveSchedule = () => {
    setSchedule(tempSchedule);
    setIsScheduleModalOpen(false);

    addEvent(
      "Sug'orish jadvali yangilandi",
      `Boshlanish: ${tempSchedule.startTime}, davomiylik: ${tempSchedule.duration} ${
        tempSchedule.durationUnit === "min" ? "minut" : "sekund"
      }`,
      "emerald"
    );
  };

  const activeDaysText = useMemo(() => {
    const selected = WEEK_DAYS.filter((day) => schedule.days[day.key]).map(
      (day) => day.label
    );
    return selected.length ? selected.join(", ") : "Kun tanlanmagan";
  }, [schedule.days]);

  const todayIrrigationText = useMemo(() => {
    const [hours, minutes] = schedule.startTime.split(":").map(Number);

    const start = new Date();
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start);

    if (schedule.durationUnit === "min") {
      end.setMinutes(end.getMinutes() + Number(schedule.duration));
    } else {
      end.setSeconds(end.getSeconds() + Number(schedule.duration));
    }

    const formatTime = (date) =>
      date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

    return `${formatTime(start)} - ${formatTime(end)}`;
  }, [schedule.startTime, schedule.duration, schedule.durationUnit]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setPrev({
        moisture,
        temperature,
        waterFlow,
      });

      let nextMoisture = moisture;
      let nextTemperature = temperature;
      let nextWaterFlow = waterFlow;

      if (pumpOn) {
        nextWaterFlow = Number(rand(14.0, 15.0).toFixed(1));
        nextMoisture = Number(
          clamp(moisture + rand(0.25, 0.55), 0, 100).toFixed(1)
        );
        nextTemperature = Number(
          clamp(temperature - rand(0.05, 0.18), 10, 60).toFixed(1)
        );
      } else {
        nextWaterFlow = 0;
        nextMoisture = Number(
          clamp(moisture - rand(0.08, 0.18), 0, 100).toFixed(1)
        );
        nextTemperature = Number(
          clamp(temperature + rand(-0.03, 0.12), 10, 60).toFixed(1)
        );
      }

      setMoisture(nextMoisture);
      setTemperature(nextTemperature);
      setWaterFlow(nextWaterFlow);

      const label = nowTime().slice(0, 5);

      setChartData((prevData) => [
        ...prevData.slice(-9),
        {
          time: label,
          moisture: nextMoisture,
          temperature: nextTemperature,
        },
      ]);

      if (
        nextMoisture < settingsData.moistureAlertLimit &&
        !lastAlertType.moisture
      ) {
        addEvent(
          "Namlik bo‘yicha ogohlantirish",
          `Namlik ${settingsData.moistureAlertLimit}% dan pastga tushdi (${nextMoisture}%)`,
          "amber"
        );
        setLastAlertType((p) => ({ ...p, moisture: true }));
      }

      if (
        nextMoisture >= settingsData.moistureAlertLimit &&
        lastAlertType.moisture
      ) {
        setLastAlertType((p) => ({ ...p, moisture: false }));
      }

      if (
        nextTemperature > settingsData.temperatureAlertLimit &&
        !lastAlertType.temperature
      ) {
        addEvent(
          "Harorat bo‘yicha ogohlantirish",
          `Harorat limitdan oshdi (${nextTemperature}°C)`,
          "red"
        );
        setLastAlertType((p) => ({ ...p, temperature: true }));
      }

      if (
        nextTemperature <= settingsData.temperatureAlertLimit &&
        lastAlertType.temperature
      ) {
        setLastAlertType((p) => ({ ...p, temperature: false }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    pumpOn,
    moisture,
    temperature,
    waterFlow,
    settingsData,
    lastAlertType,
  ]);

  const moistureTrend = useMemo(
    () => trendPercent(moisture, prev.moisture),
    [moisture, prev.moisture]
  );
  const temperatureTrend = useMemo(
    () => trendPercent(temperature, prev.temperature),
    [temperature, prev.temperature]
  );
  const flowTrend = useMemo(
    () => trendPercent(waterFlow, prev.waterFlow),
    [waterFlow, prev.waterFlow]
  );

  const moistureStatus = useMemo(
    () => statusByMoisture(moisture, settingsData.moistureAlertLimit),
    [moisture, settingsData.moistureAlertLimit]
  );
  const temperatureStatus = useMemo(
    () => statusByTemperature(temperature, settingsData.temperatureAlertLimit),
    [temperature, settingsData.temperatureAlertLimit]
  );
  const flowStatus = useMemo(() => statusByFlow(waterFlow), [waterFlow]);

  const aiAnalysis = useMemo(() => {
    if (pumpOn) {
      return {
        title: "Sug'orish jarayoni faol",
        text: "2-hudud namlanmoqda. Nasos stansiyasi ishga tushgan. Namlik bosqichma-bosqich oshmoqda va harorat nazorat ostida.",
        box: "bg-emerald-50 border-emerald-200",
        titleColor: "text-emerald-700",
      };
    }

    if (moisture < settingsData.moistureAlertLimit) {
      return {
        title: "Shoshilinch tavsiya",
        text: "Namlik belgilangan limitdan past. Sug'orishni ishga tushirish yoki jadvalni o'zgartirish tavsiya etiladi.",
        box: "bg-red-50 border-red-200",
        titleColor: "text-red-600",
      };
    }

    if (moisture > 50) {
      return {
        title: "Namlik yetarli",
        text: "Tuproq holati yaxshi. Nasosni o'chirilgan holatda qoldirish va monitoringni davom ettirish mumkin.",
        box: "bg-sky-50 border-sky-200",
        titleColor: "text-sky-700",
      };
    }

    return {
      title: "Intellektual Analitika",
      text: "Tizim barqaror ishlamoqda. Hozirgi ko‘rsatkichlar bo‘yicha nazorat rejimi yetarli deb baholanmoqda.",
      box: "bg-amber-50 border-amber-200",
      titleColor: "text-amber-700",
    };
  }, [pumpOn, moisture, settingsData.moistureAlertLimit]);

  const menuTop = [
    { name: "Monitoring", icon: Monitor },
    { name: "Datchiklar Xaritasi", icon: MapPinned },
    { name: "Sug'orish Jadvali", icon: CalendarDays },
    { name: "Hisobotlar", icon: FileText },
    { name: "Energiya Sarfi", icon: Zap },
  ];

  const menuBottom = [
    { name: "AI Yordamchi", icon: Bot },
    { name: "Tizim Sog'ligi", icon: ShieldCheck },
    { name: "Ma'lumotlar Ombori", icon: Database },
    { name: "Sozlamalar", icon: Settings },
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    if (loginForm.username === "admin" && loginForm.password === "123") {
      setIsAuthenticated(true);
      setCurrentUser({ username: "admin", role: "Admin" });
      setLoginError("");
      addEvent("Tizimga kirish", "Admin tizimga muvaffaqiyatli kirdi", "emerald");
    } else {
      setLoginError("Login yoki parol noto‘g‘ri");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setChatOpen(false);
    setActiveMenu("Monitoring");
    localStorage.removeItem("wt_auth");
  };

  const handlePumpToggle = () => {
    setPumpOn((prevState) => {
      const next = !prevState;
      addEvent(
        next ? "Nasos yoqildi" : "Nasos o‘chirildi",
        next
          ? "Avtomatlashtirilgan nasos stansiyasi ishga tushirildi"
          : "Nasos stansiyasi to‘xtatildi",
        next ? "emerald" : "amber"
      );
      return next;
    });
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setMessages((prevMsgs) => [...prevMsgs, { role: "user", text: userText }]);

    let reply = "Tizim ma'lumotlari qabul qilindi. Monitoring davom etmoqda.";
    const q = userText.toLowerCase();

    if (q.includes("namlik")) {
      reply = `Joriy namlik ${moisture}% ni tashkil etadi. Holat: ${moistureStatus.label}. ${moistureStatus.helper}.`;
    } else if (q.includes("harorat")) {
      reply = `Joriy harorat ${temperature}°C. Holat: ${temperatureStatus.label}.`;
    } else if (q.includes("nasos")) {
      reply = pumpOn
        ? "Nasos stansiyasi faol. Sug'orish jarayoni davom etmoqda."
        : "Nasos hozirda o'chirilgan. Tizim monitoring rejimida ishlamoqda.";
    } else if (q.includes("suv")) {
      reply = `Joriy suv sarfi ${waterFlow} L/min. Holat: ${flowStatus.label}.`;
    } else if (q.includes("tahlil") || q.includes("ai")) {
      reply = aiAnalysis.text;
    }

    setTimeout(() => {
      setMessages((prevMsgs) => [...prevMsgs, { role: "ai", text: reply }]);
    }, 400);

    setChatInput("");
  };

  const saveSettings = () => {
    const cleaned = {
      moistureAlertLimit: Number(settingsDraft.moistureAlertLimit),
      temperatureAlertLimit: Number(settingsDraft.temperatureAlertLimit),
      flowAlertLimit: Number(settingsDraft.flowAlertLimit),
    };
    setSettingsData(cleaned);
    addEvent(
      "Sozlamalar yangilandi",
      `Namlik: ${cleaned.moistureAlertLimit}%, Harorat: ${cleaned.temperatureAlertLimit}°C`,
      "emerald"
    );
  };

  const renderToneClass = (tone) => {
    if (tone === "red") return "bg-red-50 border-red-200";
    if (tone === "amber") return "bg-amber-50 border-amber-200";
    return "bg-emerald-50 border-emerald-200";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[36px] overflow-hidden shadow-2xl border border-slate-200 bg-white">
          <div
            className="p-10 lg:p-14 text-white flex flex-col justify-between"
            style={{ backgroundColor: "#0F172A" }}
          >
            <div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center">
                  <Droplets className="w-8 h-8 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">WaterTech OS</h1>
                  <p className="text-slate-300 mt-1">Smart Irrigation Control</p>
                </div>
              </div>

              <div className="mt-12 space-y-5">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-xl font-semibold">Gidrometeorologik Monitoring</h3>
                  <p className="text-slate-300 mt-2 leading-7">
                    Suv resurslarini nazorat qilish, nasoslarni boshqarish va
                    intellektual tahlillar uchun yagona boshqaruv muhiti.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                    <ShieldCheck className="w-6 h-6 text-emerald-300" />
                    <p className="mt-3 font-medium">Xavfsiz kirish</p>
                    <p className="text-sm text-slate-300 mt-1">Lokal autentifikatsiya</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                    <Bot className="w-6 h-6 text-emerald-300" />
                    <p className="mt-3 font-medium">AI yordamchi</p>
                    <p className="text-sm text-slate-300 mt-1">Real vaqt tavsiyalari</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-sm mt-10">
              Demo kirish: <span className="text-white font-semibold">admin / 123</span>
            </p>
          </div>

          <div className="p-10 lg:p-14 flex items-center">
            <form onSubmit={handleLogin} className="w-full max-w-md mx-auto">
              <div className="mb-8">
                <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wider">
                  Login
                </p>
                <h2 className="text-4xl font-bold text-slate-900 mt-2">
                  Tizimga kirish
                </h2>
                <p className="text-slate-500 mt-3">
                  Dashboard’ga kirish uchun login va parolni kiriting.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Login
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm((p) => ({ ...p, username: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="admin"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Parol
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((p) => ({ ...p, password: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="123"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 transition"
                >
                  Tizimga kirish
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    if (activeMenu === "Sozlamalar") {
      return (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-emerald-200 bg-white shadow-sm p-7">
            <p className="text-emerald-700 text-sm font-semibold tracking-wide uppercase">
              Sozlamalar
            </p>
            <h1 className="text-4xl font-bold mt-3 text-slate-900">
              Datchik limitlarini boshqarish
            </h1>
            <p className="text-slate-600 mt-3 max-w-3xl leading-8 text-lg">
              Tizim ogohlantirishlari uchun limit qiymatlarini o‘zgartiring.
            </p>
          </div>

          <div className="grid xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 rounded-3xl border border-emerald-200 bg-white shadow-sm p-7">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Namlik ogohlantirish limiti (%)
                  </label>
                  <input
                    type="number"
                    value={settingsDraft.moistureAlertLimit}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        moistureAlertLimit: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Harorat ogohlantirish limiti (°C)
                  </label>
                  <input
                    type="number"
                    value={settingsDraft.temperatureAlertLimit}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        temperatureAlertLimit: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Suv sarfi ogohlantirish limiti (L/min)
                  </label>
                  <input
                    type="number"
                    value={settingsDraft.flowAlertLimit}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        flowAlertLimit: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <button
                  onClick={saveSettings}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                >
                  <Save className="w-5 h-5" />
                  Saqlash
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Joriy limitlar</h3>
                  <p className="text-slate-500 text-sm">Amaldagi ogohlantirish sozlamalari</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Namlik limiti</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {settingsData.moistureAlertLimit}%
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Harorat limiti</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {settingsData.temperatureAlertLimit}°C
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Suv sarfi limiti</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {settingsData.flowAlertLimit} L/min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-[32px] border border-emerald-200 bg-white shadow-sm p-7">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <p className="text-emerald-700 text-sm font-semibold tracking-wide uppercase">
                Gidrometeorologik Monitoring
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mt-3 text-slate-900">
                Suv Resurslarini Boshqarish Paneli
              </h1>
              <p className="text-slate-600 mt-3 max-w-4xl leading-8 text-lg">
                Sensor ma'lumotlari, avtomatlashtirilgan nasos boshqaruvi va
                intellektual analitika yagona boshqaruv muhitida birlashtirilgan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold text-emerald-700 animate-pulse">
                  Tizim faol: Real vaqt rejimi
                </span>
              </div>

              <button
                onClick={handlePumpToggle}
                className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                  pumpOn
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Power className="w-5 h-5" />
                {pumpOn ? "Nasosni o'chirish" : "Nasosni yoqish"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Tuproq namligi"
            value={moisture}
            unit="%"
            trend={moistureTrend}
            icon={Droplets}
            status={moistureStatus}
            iconBg="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Harorat"
            value={temperature}
            unit="°C"
            trend={temperatureTrend}
            icon={Thermometer}
            status={temperatureStatus}
            iconBg="bg-orange-100 text-orange-600"
          />
          <StatCard
            title="Suv sarfi"
            value={waterFlow}
            unit="L/min"
            trend={flowTrend}
            icon={Waves}
            status={flowStatus}
            iconBg="bg-sky-100 text-sky-700"
          />
          <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Avtomatlashtirilgan Nasos Stansiyasi
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs font-semibold ${pumpOn ? "text-emerald-600" : "text-slate-500"}`}>
                    {pumpOn ? "+1.0%" : "-1.0%"}
                  </span>
                </div>
                <h3 className="text-4xl font-bold text-slate-900 mt-3">
                  {pumpOn ? "ON" : "OFF"}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100">
                <Activity className="w-6 h-6 text-slate-700" />
              </div>
            </div>

            <div className="mt-5">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${
                  pumpOn
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {pumpOn ? "Faol boshqaruv" : "Kuzatuv rejimi"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SmallInfoCard
            title="Faol hududlar"
            value="12 ta"
            subtitle="Shundan 3 tasi yuqori ustuvor"
            icon={Map}
            color="bg-emerald-100 text-emerald-700"
          />
          <SmallInfoCard
            title="Bugungi sug'orish"
            value={todayIrrigationText}
            subtitle={`Faol kunlar: ${activeDaysText}`}
            icon={Clock3}
            color="bg-sky-100 text-sky-700"
          />
          <SmallInfoCard
            title="Tarmoq holati"
            value="Online"
            subtitle="Barcha sensorlar ulangan"
            icon={Wifi}
            color="bg-emerald-100 text-emerald-700"
          />
          <SmallInfoCard
            title="Ogohlantirishlar"
            value={`${eventLogs.filter((e) => e.tone !== "emerald").length} ta`}
            subtitle="Ko‘rib chiqish tavsiya etiladi"
            icon={Bell}
            color="bg-amber-100 text-amber-700"
          />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 items-start">
          <div className="2xl:col-span-2 rounded-3xl border border-emerald-200 bg-white shadow-sm p-7">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Dinamik monitoring grafigi
                </h2>
                <p className="text-slate-600 mt-2 text-lg">
                  Namlik va harorat ko'rsatkichlarining real vaqt dinamikasi
                </p>
              </div>

              <div className="rounded-full border border-emerald-200 px-5 py-3 text-sm font-medium text-slate-700 bg-emerald-50">
                Yangilanish oralig'i: 3 soniya
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.03} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" stroke="#D1D5DB" />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  name="Namlik"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#moistureFill)"
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={700}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Harorat"
                  stroke="#F97316"
                  strokeWidth={3}
                  fill="url(#tempFill)"
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Intellektual Analitika
                  </h2>
                  <p className="text-slate-500">
                    Sensor ma'lumotlariga mos tavsiyalar
                  </p>
                </div>
              </div>

              <div className={`rounded-3xl border p-5 ${aiAnalysis.box}`}>
                <h3 className={`text-xl font-bold ${aiAnalysis.titleColor}`}>
                  {aiAnalysis.title}
                </h3>
                <p className="text-slate-700 mt-3 leading-8">
                  {aiAnalysis.text}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Joriy namlik</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{moisture}%</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Harorat</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{temperature}°C</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-sm text-slate-500">Suv sarfi</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{waterFlow} L/min</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Siren className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Tezkor ogohlantirishlar</h3>
                  <p className="text-slate-500 text-sm">Muhim tizim xabarlari</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-amber-800">2-hudud monitoringda</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Namlik me’yordan biroz past.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-700 shrink-0" />
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-emerald-800">Nasos stansiyasi tayyor</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Boshqaruv moduli normal holatda.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-700 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Operativ bo‘limlar</h3>
                <p className="text-slate-500">Tezkor boshqaruv va tizim modullari</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  icon: Gauge,
                  title: "Bosim nazorati",
                  desc: "Nasos bosimini monitoring qilish",
                },
                {
                  icon: Leaf,
                  title: "Tuproq holati",
                  desc: "Namlik va vegetatsiya nazorati",
                },
                {
                  icon: CalendarDays,
                  title: "Jadval boshqaruvi",
                  desc: "Avtomatik sug'orish jadvali",
                },
                {
                  icon: Database,
                  title: "Arxiv ma'lumotlar",
                  desc: "Tarixiy ko'rsatkichlar bazasi",
                },
              ].map((item) => {
                const Icon = item.icon;
                const isScheduleCard = item.title === "Jadval boshqaruvi";

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={isScheduleCard ? openScheduleModal : undefined}
                    className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 hover:bg-emerald-50 transition-all duration-300 text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h4 className="font-bold text-slate-900 mt-4">{item.title}</h4>
                    <p className="text-sm text-slate-600 mt-2 leading-6">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Faol hodisalar</h3>
                <p className="text-slate-500">Brauzer xotirasida saqlanadi</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {eventLogs.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${renderToneClass(item.tone)}`}
                >
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                  <p className="text-xs text-slate-500 mt-2">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex">
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes aiBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .ai-breath {
          animation: aiBreath 2.6s ease-in-out infinite;
        }
      `}</style>

      <aside
        className={`sticky top-0 h-screen shrink-0 transition-all duration-300 border-r border-slate-800/20 shadow-xl ${
          collapsed ? "w-20" : "w-80"
        }`}
        style={{ backgroundColor: "#0F172A" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Droplets className="w-7 h-7 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">WaterTech OS</h2>
                  <p className="text-sm text-slate-300">Smart Irrigation Control</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center shrink-0 text-white"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              {!collapsed && (
                <p className="text-xs uppercase tracking-wider text-slate-400 px-3">
                  Asosiy bo'limlar
                </p>
              )}
              {menuTop.map((item) => (
                <MenuButton
                  key={item.name}
                  item={item}
                  active={activeMenu === item.name}
                  collapsed={collapsed}
                  onClick={() => setActiveMenu(item.name)}
                />
              ))}
            </div>

            <div className="space-y-2">
              {!collapsed && (
                <p className="text-xs uppercase tracking-wider text-slate-400 px-3">
                  Qo‘shimcha
                </p>
              )}
              {menuBottom.map((item) => (
                <MenuButton
                  key={item.name}
                  item={item}
                  active={activeMenu === item.name}
                  collapsed={collapsed}
                  onClick={() => {
                    setActiveMenu(item.name);
                    if (item.name === "AI Yordamchi") {
                      setShowBubble(true);
                    }
                  }}
                />
              ))}
            </div>

            {!collapsed && (
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Modul</p>
                    <h3 className="text-white font-semibold mt-1">
                      Intellektual Analitika
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 leading-6">
                      Sug'orish qarorlari va real vaqt monitoringi avtomatik tahlil qilinadi.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 space-y-3">
            <div className={`rounded-2xl bg-white/10 p-3 ${collapsed ? "flex justify-center" : ""}`}>
              <div className="flex items-center gap-3">
                <UserCircle2 className="w-11 h-11 text-emerald-300 shrink-0" />
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  <p className="text-xs text-slate-400">Joriy foydalanuvchi</p>
                  <p className="text-sm font-semibold text-white">
                    {currentUser.username}
                  </p>
                  <p className="text-xs text-emerald-300">{currentUser.role}</p>
                </div>
              </div>
            </div>

            {!collapsed ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white py-3 transition"
              >
                <LogOut className="w-4 h-4" />
                Chiqish
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white py-3 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-7">
        <div className="max-w-[1600px] mx-auto">{renderMainContent()}</div>
      </main>

      {showBubble && !chatOpen && (
        <div className="fixed bottom-24 right-8 z-40 rounded-2xl border border-emerald-200 bg-white px-4 py-2 shadow-lg">
          <div className="relative">
            <p className="text-sm font-medium text-slate-700">AI Yordamchi</p>
            <span className="absolute -bottom-4 right-8 w-3 h-3 bg-white border-r border-b border-emerald-200 rotate-45"></span>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setChatOpen(true);
          setShowBubble(false);
        }}
        className="fixed bottom-8 right-8 z-40 rounded-full bg-emerald-500 text-white shadow-2xl p-4 transition hover:scale-110 ai-breath"
        aria-label="Open AI assistant"
      >
        <Bot className="w-7 h-7" />
      </button>

      {chatOpen && (
        <div className="fixed bottom-28 right-8 z-50 w-[92vw] max-w-md h-[70vh] rounded-3xl border border-emerald-200 bg-white shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white border border-emerald-200 p-2">
                <Bot className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">AI Yordamchi</h3>
                <p className="text-xs text-slate-500">WaterTech virtual assistant</p>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="rounded-xl p-2 hover:bg-white transition text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "ai"
                    ? "bg-white text-slate-800 border border-emerald-200"
                    : "bg-emerald-500 text-white ml-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-emerald-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Namlik, nasos yoki tahlil haqida so'rang..."
                className="flex-1 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={handleSend}
                className="rounded-2xl bg-emerald-500 text-white p-3 transition hover:scale-105"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Sug'orish jadvali
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Vaqt, davomiylik va haftalik kunlarni tanlang
                </p>
              </div>

              <button
                type="button"
                onClick={closeScheduleModal}
                className="rounded-2xl p-2 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Sug'orish vaqti
                </label>
                <input
                  type="time"
                  value={tempSchedule.startTime}
                  onChange={(e) =>
                    setTempSchedule((p) => ({
                      ...p,
                      startTime: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Davomiyligi
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    value={tempSchedule.duration}
                    onChange={(e) =>
                      setTempSchedule((p) => ({
                        ...p,
                        duration: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <select
                    value={tempSchedule.durationUnit}
                    onChange={(e) =>
                      setTempSchedule((p) => ({
                        ...p,
                        durationUnit: e.target.value,
                      }))
                    }
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="sec">Sekund</option>
                    <option value="min">Minut</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-3">
                  Haftalik kunlar
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WEEK_DAYS.map((day) => (
                    <div
                      key={day.key}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {day.label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setTempSchedule((p) => ({
                            ...p,
                            days: {
                              ...p.days,
                              [day.key]: !p.days[day.key],
                            },
                          }))
                        }
                        className={`relative h-6 w-11 rounded-full transition ${
                          tempSchedule.days[day.key]
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            tempSchedule.days[day.key] ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 font-semibold text-white transition"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}