import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firabse/FireBaseConfig";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import {
  IoMdClose, IoMdTrash, IoMdCreate, IoMdCalendar,
  IoMdPerson, IoMdMail, IoMdAdd, IoMdCheckmark,
} from "react-icons/io";
import { MdBlock, MdSettings, MdAccessTime, MdChevronLeft, MdChevronRight } from "react-icons/md";
import "./admindashboard.css";

// ─── Szolgáltatások kategóriánként ───────────────────────────────────────────
const SERVICE_CATEGORIES = [
  {
    label: "💆 Kozmetika",
    services: [
      { id: "kollagen_szalas_carboxy_terapia", name: "Kollagénszálas arckezelés + carboxy terápia", duration: 120 },
      { id: "hydro_cell",                      name: "HYDRO-CELL kezelés",                          duration: 90  },
      { id: "kollagen_szalas",                 name: "Kollagénszálas arckezelés",                   duration: 90  },
      { id: "anti_acne",                       name: "Anti Acné kezelés",                           duration: 90  },
      { id: "borkimelo_nyugtato",              name: "Bőrnyugtató, gyulladáscsökkentő kezelés",     duration: 90  },
      { id: "melyhidratalo",                   name: "Mélyhidratáló kezelés",                       duration: 90  },
      { id: "energetizalo_arckezeles",         name: "Energetizáló arckezelés",                     duration: 90  },
      { id: "vitaminos_arcmasszazs",           name: "Vitaminos arcmasszázs",                       duration: 30  },
      { id: "vio",                             name: "Vio",                                         duration: 15  },
      { id: "szemoldok_szedes",                name: "Szemöldök szedés",                            duration: 15  },
      { id: "szemoldok_festes",                name: "Szemöldök festés",                            duration: 30  },
    ],
  },
  {
    label: "🪡 Gyanta",
    services: [
      { id: "bajusz",         name: "Bajusz",             duration: 20 },
      { id: "szemoldok",      name: "Szemöldök",          duration: 20 },
      { id: "honalj",         name: "Hónalj",             duration: 20 },
      { id: "teljes_arc",     name: "Teljes arc",         duration: 30 },
      { id: "kar",            name: "Kar",                duration: 30 },
      { id: "labszar",        name: "Lábszár",            duration: 30 },
      { id: "honalj_labszar", name: "Hónalj és lábszár",  duration: 50 },
      { id: "has",            name: "Has",                duration: 30 },
      { id: "teljes_lab",     name: "Teljes láb",         duration: 50 },
    ],
  },
  {
    label: "💄 Smink",
    services: [
      { id: "alkalmi",             name: "Alkalmi smink",               duration: 90  },
      { id: "menyasszonyi_eskuvo", name: "Menyasszonyi smink – Esküvő", duration: 120 },
    ],
  },
  {
    label: "👁️ Szempilla",
    services: [
      { id: "1d_new",    name: "1D Műszempilla – Új szett", duration: 180 },
      { id: "1d_refill", name: "1D Műszempilla – Töltés",   duration: 120 },
      { id: "2d_new",    name: "2D Műszempilla – Új szett", duration: 180 },
      { id: "2d_refill", name: "2D Műszempilla – Töltés",   duration: 120 },
      { id: "3d_new",    name: "3D Műszempilla – Új szett", duration: 180 },
      { id: "3d_refill", name: "3D Műszempilla – Töltés",   duration: 120 },
      { id: "4d_new",    name: "4D Műszempilla – Új szett", duration: 180 },
      { id: "4d_refill", name: "4D Műszempilla – Töltés",   duration: 120 },
      { id: "5d_new",    name: "5D Műszempilla – Új szett", duration: 180 },
      { id: "5d_refill", name: "5D Műszempilla – Töltés",   duration: 120 },
      { id: "6d_new",    name: "6D Műszempilla – Új szett", duration: 180 },
      { id: "6d_refill", name: "6D Műszempilla – Töltés",   duration: 120 },
      { id: "leoldas",   name: "Műszempilla leoldás",       duration: 30  },
    ],
  },
];

const ALL_SERVICES = SERVICE_CATEGORIES.flatMap((c) => c.services);
const serviceById  = (id) => ALL_SERVICES.find((s) => s.id === id) || null;

// ─── Helpers ────────────────────────────────────────────────────────────────

const bookingEndTime = (b) => {
  if (!b.date || !b.time) return null;
  const [y, m, d] = b.date.split("-").map(Number);
  const [h, min]  = b.time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min + (b.duration || 0));
};

const isCompleted = (b) => {
  if (b.status === "pending") return false;
  const end = bookingEndTime(b);
  return end && end < new Date();
};

const isBlockedDateExpired = (bd) => {
  if (!bd.date) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = bd.date.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
};

const isBlockedTimeExpired = (bt) => {
  if (!bt.date || !bt.endTime) return false;
  const [y, m, d] = bt.date.split("-").map(Number);
  const [h, min]  = bt.endTime.split(":").map(Number);
  return new Date(y, m - 1, d, h, min) < new Date();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "–";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("hu-HU", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
};

const isNoShow = (b) => b.attended === false;

const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
};

const resolveServiceName = (booking) => {
  if (booking.serviceName) return booking.serviceName;
  const svc = serviceById(booking.service);
  return svc ? svc.name : (booking.service || "–");
};

// ─── Sort Button ─────────────────────────────────────────────────────────────

const SortBtn = ({ dir, onClick, label = "Rendezés" }) => (
  <button
    className="sort-btn"
    onClick={onClick}
    title={`Jelenleg: ${dir === "asc" ? "növekvő" : "csökkenő"}`}
  >
    {label} {dir === "asc" ? "↑" : "↓"}
  </button>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

// ─── Live Indicator ───────────────────────────────────────────────────────────

const LiveIndicator = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "5px",
    fontSize: "11px", color: "hsl(150,60%,40%)", fontWeight: 600,
    padding: "3px 9px", borderRadius: "999px",
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
  }}>
    <span style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: "hsl(150,65%,45%)",
      animation: "livePulse 2s infinite",
    }} />
    Élő
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ emoji, label, value, sub, color }) => (
  <div className="stat-card" style={{ borderTopColor: color }}>
    <div className="stat-card__emoji">{emoji}</div>
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__label">{label}</div>
    {sub && <div className="stat-card__sub">{sub}</div>}
  </div>
);

// ─── Attendance Toggle ────────────────────────────────────────────────────────

const AttendanceToggle = ({ booking, onChange }) => {
  const noShow = booking.attended === false;
  return (
    <button
      className={`att-btn ${noShow ? "att-btn--no active" : "att-btn--yes"}`}
      title={noShow ? "Megjelölve: nem jelent meg" : "Kattints ha nem jelent meg"}
      onClick={() => onChange(booking.id, noShow ? null : false)}
    >
      {noShow ? "❌ Nem jelent meg" : "✅ Megjelent"}
    </button>
  );
};

// ─── Pending Actions ──────────────────────────────────────────────────────────

const PendingActions = ({ booking, onApprove, onReject, approveLoading }) => (
  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
    <button
      className="btn-approve"
      title="Jóváhagyás – visszaigazoló email az ügyfélnek"
      disabled={approveLoading === booking.id}
      onClick={() => onApprove(booking)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "5px 12px", borderRadius: "20px", border: "none",
        background: "linear-gradient(135deg, hsl(150,60%,42%), hsl(150,65%,48%))",
        color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
        opacity: approveLoading === booking.id ? 0.6 : 1,
      }}
    >
      {approveLoading === booking.id ? "⏳" : <><IoMdCheckmark /> Jóváhagyás</>}
    </button>
    <button
      className="btn-cancel"
      title="Elutasítás – értesítő email az ügyfélnek"
      onClick={() => onReject(booking.id)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "5px 12px", borderRadius: "20px", border: "none",
        background: "linear-gradient(135deg, hsl(0,70%,52%), hsl(0,75%,58%))",
        color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
      }}
    >
      <IoMdClose /> Elutasítás
    </button>
  </div>
);

// ─── Booking Row ──────────────────────────────────────────────────────────────

const BookingRow = ({
  booking, onEdit, onCancel, onDelete, onAttendance,
  onApprove, onReject, approveLoading, showUser = true,
}) => {
  const completed = isCompleted(booking);
  const isPending = booking.status === "pending";

  return (
    <tr className={
      isPending
        ? "row--pending"
        : completed
          ? (isNoShow(booking) ? "row--noshow" : "row--completed")
          : "row--upcoming"
    }>
      <td>{formatDate(booking.date)}</td>
      <td>{booking.time || "–"}</td>
      <td>{resolveServiceName(booking)}</td>
      <td>{booking.duration ? `${booking.duration} perc` : "–"}</td>
      {showUser && <td>{booking.userName || "–"}</td>}
      {showUser && <td>{booking.userEmail || "–"}</td>}
      {showUser && <td>{booking.userPhone || "–"}</td>}
      <td>
        {isPending ? (
          <span className="att-badge" style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            color: "#92400e", border: "1px solid #f59e0b",
          }}>⏳ Jóváhagyásra vár</span>
        ) : completed ? (
          <AttendanceToggle booking={booking} onChange={onAttendance} />
        ) : (
          <span className="att-badge att--upcoming">⏳ Közelgő</span>
        )}
      </td>
      <td className="action-buttons">
        {isPending ? (
          <PendingActions
            booking={booking}
            onApprove={onApprove}
            onReject={onReject}
            approveLoading={approveLoading}
          />
        ) : (
          <>
            <button className="btn-edit"   title="Szerkesztés"           onClick={() => onEdit(booking)}><IoMdCreate /></button>
            <button className="btn-cancel" title="Visszamondás (email)"  onClick={() => onCancel(booking.id)}><IoMdMail /></button>
            <button className="btn-delete" title="Törlés (email nélkül)" onClick={() => onDelete(booking.id)}><IoMdTrash /></button>
          </>
        )}
      </td>
    </tr>
  );
};

// ─── Service Selector ─────────────────────────────────────────────────────────

const ServiceSelector = ({ value, onChange, onDurationChange }) => {
  const [catTab, setCatTab] = useState(() => {
    const found = SERVICE_CATEGORIES.findIndex((c) => c.services.some((s) => s.id === value));
    return found >= 0 ? found : 0;
  });

  const handleSelect = (svc) => {
    onChange(svc.id, svc.name);
    onDurationChange(svc.duration);
  };

  return (
    <div className="service-selector">
      <div className="service-cat-tabs">
        {SERVICE_CATEGORIES.map((cat, i) => (
          <button key={i} type="button"
            className={`service-cat-tab ${catTab === i ? "active" : ""}`}
            onClick={() => setCatTab(i)}
          >{cat.label}</button>
        ))}
      </div>
      <div className="service-options">
        {SERVICE_CATEGORIES[catTab].services.map((svc) => (
          <div key={svc.id}
            className={`service-option ${value === svc.id ? "selected" : ""}`}
            onClick={() => handleSelect(svc)}
          >
            <span className="service-option__name">{svc.name}</span>
            <span className="service-option__dur">{svc.duration} perc</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Add Booking Modal ────────────────────────────────────────────────────────

const EMPTY_BOOKING_FORM = {
  date: "", time: "", service: "", serviceName: "", duration: 0,
  userName: "", userEmail: "", userPhone: "",
};

const AddBookingModal = ({ onClose, onSave }) => {
  const [form, setForm]     = useState(EMPTY_BOOKING_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.date)     e.date     = "Dátum kötelező";
    if (!form.time)     e.time     = "Időpont kötelező";
    if (!form.service)  e.service  = "Szolgáltatás kötelező";
    if (!form.userName) e.userName = "Név kötelező";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error("Hiba: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => { const n = {...p}; delete n[key]; return n; });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IoMdClose /></button>
        <h3>➕ Új foglalás hozzáadása</h3>
        <p style={{ color: "hsl(340,30%,50%)", fontSize: "13px", marginBottom: "16px" }}>
          Admin által manuálisan létrehozott foglalás – azonnal aktív, jóváhagyás nélkül.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Dátum *</label>
            <input type="date" value={form.date} min={todayStr()}
              onChange={(e) => set("date", e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
          <div className="form-group">
            <label>Időpont *</label>
            <input type="time" step="600" value={form.time}
              onChange={(e) => set("time", e.target.value)} />
            {errors.time && <span className="form-error">{errors.time}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Szolgáltatás *</label>
          <ServiceSelector
            value={form.service}
            onChange={(id, name) => { set("service", id); set("serviceName", name); }}
            onDurationChange={(dur) => set("duration", dur)}
          />
          {errors.service && <span className="form-error">{errors.service}</span>}
        </div>

        <div className="form-group">
          <label>Időtartam (perc)</label>
          <input type="number" min="5" step="5" value={form.duration || ""}
            onChange={(e) => set("duration", parseInt(e.target.value) || 0)} />
        </div>

        <div style={{ borderTop: "1px solid rgba(214,62,120,0.12)", margin: "16px 0", paddingTop: "16px" }}>
          <p style={{ color: "hsl(340,40%,45%)", fontWeight: 600, fontSize: "13px", marginBottom: "12px" }}>
            👤 Ügyfél adatai
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Név *</label>
              <input type="text" placeholder="pl. Kiss Éva" value={form.userName}
                onChange={(e) => set("userName", e.target.value)} />
              {errors.userName && <span className="form-error">{errors.userName}</span>}
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input type="tel" placeholder="+36 30 000 0000" value={form.userPhone}
                onChange={(e) => set("userPhone", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Email <span style={{ color: "hsl(340,30%,55%)", fontWeight: 400 }}>(visszaigazoló email küldéséhez)</span></label>
            <input type="email" placeholder="pelda@email.hu" value={form.userEmail}
              onChange={(e) => set("userEmail", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button className="btn-secondary" onClick={onClose}>Mégse</button>
          <button className="btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving ? "Mentés..." : "➕ Foglalás létrehozása"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Calendar View ────────────────────────────────────────────────────────────

const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const HU_MONTHS = [
  "Január","Február","Március","Április","Május","Június",
  "Július","Augusztus","Szeptember","Október","November","December",
];

const serviceCategoryColor = (serviceId) => {
  if (!serviceId) return "hsl(340,65%,55%)";
  if (["kollagen","hydro","anti","borkimelo","melyhidratalo","energetizalo","vitaminos","vio","szemoldok_szedes","szemoldok_festes"].some(k => serviceId.startsWith(k) || serviceId === k))
    return "hsl(280,60%,58%)";
  if (["bajusz","szemoldok","honalj","teljes_arc","kar","labszar","has","teljes_lab"].some(k => serviceId === k))
    return "hsl(25,80%,55%)";
  if (["alkalmi","menyasszonyi"].some(k => serviceId.startsWith(k)))
    return "hsl(340,70%,52%)";
  if (serviceId.includes("szempilla") || serviceId.match(/^\d+d_/))
    return "hsl(195,70%,48%)";
  return "hsl(340,65%,55%)";
};

const generateCalendarWeeks = (year, month) => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    days.push({ date: d, thisMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month - 1, d), thisMonth: true });
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    days.push({ date: new Date(last.getTime() + 86400000), thisMonth: false });
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
};

const dateToStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const CalendarView = ({
  bookings, blockedDates, onEdit, onCancel, onDelete,
  onAttendance, onAddBooking, onApprove, onReject, approveLoading,
}) => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(null);
  const today = dateToStr(now);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setYear(now.getFullYear()); setMonth(now.getMonth() + 1);
    setSelectedDay(today);
  };

  const weeks = useMemo(() => generateCalendarWeeks(year, month), [year, month]);

  const byDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.date) return;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const blockedSet = useMemo(() => new Set(blockedDates.map(b => b.date)), [blockedDates]);

  const selectedBookings = useMemo(() => {
    if (!selectedDay) return [];
    return (byDate[selectedDay] || []).slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [selectedDay, byDate]);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="cal-nav-btn" onClick={prevMonth}><MdChevronLeft /></button>
          <h2 className="calendar-title">{HU_MONTHS[month - 1]} {year}</h2>
          <button className="cal-nav-btn" onClick={nextMonth}><MdChevronRight /></button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="sort-btn" onClick={goToday}>Ma</button>
          <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={onAddBooking}>
            <IoMdAdd style={{ marginRight: "4px" }} /> Új foglalás
          </button>
        </div>
      </div>

      <div className="calendar-body">
        <div className="calendar-grid-wrap">
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="cal-week">
              {week.map(({ date, thisMonth }, di) => {
                const ds         = dateToStr(date);
                const dayBooks   = byDate[ds] || [];
                const isToday    = ds === today;
                const isSelected = ds === selectedDay;
                const isBlocked  = blockedSet.has(ds);
                const isPast     = ds < today;
                const upcoming   = dayBooks.filter(b => !isCompleted(b) && b.status !== "pending");
                const pending    = dayBooks.filter(b => b.status === "pending");
                const done       = dayBooks.filter(b => isCompleted(b));

                return (
                  <div
                    key={di}
                    className={[
                      "cal-day",
                      !thisMonth  ? "cal-day--other"    : "",
                      isToday     ? "cal-day--today"    : "",
                      isSelected  ? "cal-day--selected" : "",
                      isBlocked   ? "cal-day--blocked"  : "",
                      isPast && thisMonth ? "cal-day--past" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => setSelectedDay(isSelected ? null : ds)}
                  >
                    <div className="cal-day__num">{date.getDate()}</div>

                    {isBlocked && <div className="cal-blocked-tag">Szabadnap</div>}

                    {dayBooks.length > 0 && (
                      <div className="cal-day__bookings">
                        {pending.length > 0 && (
                          <div className="cal-booking-pill" style={{ background: "hsl(40,90%,52%)", fontSize: "10px" }}>
                            ⏳ {pending.length} függőben
                          </div>
                        )}
                        {upcoming.slice(0, 3).map((b) => (
                          <div key={b.id} className="cal-booking-pill" style={{ background: serviceCategoryColor(b.service) }}>
                            <span className="cal-pill-time">{b.time}</span>
                            <span className="cal-pill-name">{b.userName?.split(" ").slice(-1)[0] || "–"}</span>
                          </div>
                        ))}
                        {done.length > 0 && (
                          <div className="cal-booking-pill cal-booking-pill--done">+{done.length} lezajlott</div>
                        )}
                        {upcoming.length > 3 && (
                          <div className="cal-booking-pill cal-booking-pill--more">+{upcoming.length - 3} további</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {selectedDay && (
          <div className="cal-detail-panel">
            <div className="cal-detail-header">
              <h3>{formatDate(selectedDay)}</h3>
              <button className="modal-close" style={{ position: "static" }} onClick={() => setSelectedDay(null)}>
                <IoMdClose />
              </button>
            </div>

            {blockedSet.has(selectedDay) && (
              <div className="cal-detail-blocked">🚫 Ez a nap blokkolva van (szabadnap)</div>
            )}

            {selectedBookings.length === 0 && !blockedSet.has(selectedDay) && (
              <div className="cal-detail-empty">
                <p>Ezen a napon nincs foglalás.</p>
                <button className="btn-primary" style={{ marginTop: "10px", fontSize: "13px", padding: "8px 16px" }}
                  onClick={() => { onAddBooking(selectedDay); setSelectedDay(null); }}>
                  ➕ Foglalás erre a napra
                </button>
              </div>
            )}

            <div className="cal-detail-list">
              {selectedBookings.map((b) => {
                const done     = isCompleted(b);
                const noshow   = isNoShow(b);
                const isPending = b.status === "pending";
                const catColor = serviceCategoryColor(b.service);
                return (
                  <div key={b.id} className={`cal-detail-card${isPending ? " cal-detail-card--pending" : done ? (noshow ? " cal-detail-card--noshow" : " cal-detail-card--done") : ""}`}>
                    <div className="cal-detail-card__stripe" style={{ background: isPending ? "#f59e0b" : catColor }} />
                    <div className="cal-detail-card__body">
                      <div className="cal-detail-card__top">
                        <span className="cal-detail-time">{b.time}</span>
                        <span className="cal-detail-dur">{b.duration} perc</span>
                        {isPending && (
                          <span className="att-badge" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" }}>
                            ⏳ Jóváhagyásra vár
                          </span>
                        )}
                        {!isPending && done && (
                          <span className={`att-badge ${noshow ? "att--noshow" : "att--done"}`}>
                            {noshow ? "❌ Nem jelent meg" : "✅ Megjelent"}
                          </span>
                        )}
                        {!isPending && !done && <span className="att-badge att--upcoming">⏳ Közelgő</span>}
                      </div>
                      <div className="cal-detail-service">{resolveServiceName(b)}</div>
                      <div className="cal-detail-client">
                        <strong>{b.userName || "–"}</strong>
                        {b.userPhone && <span> · 📞 {b.userPhone}</span>}
                        {b.userEmail && <span className="cal-detail-email"> · {b.userEmail}</span>}
                      </div>
                      <div className="cal-detail-actions">
                        {isPending ? (
                          <PendingActions
                            booking={b}
                            onApprove={onApprove}
                            onReject={onReject}
                            approveLoading={approveLoading}
                          />
                        ) : (
                          <>
                            {done && <AttendanceToggle booking={b} onChange={onAttendance} />}
                            <button className="btn-edit"   onClick={() => onEdit(b)}><IoMdCreate /></button>
                            <button className="btn-cancel" onClick={() => onCancel(b.id)}><IoMdMail /></button>
                            <button className="btn-delete" onClick={() => onDelete(b.id)}><IoMdTrash /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedBookings.length > 0 && (
              <button className="btn-primary" style={{ width: "100%", marginTop: "12px", fontSize: "13px", padding: "9px" }}
                onClick={() => { onAddBooking(selectedDay); setSelectedDay(null); }}>
                ➕ Foglalás hozzáadása erre a napra
              </button>
            )}
          </div>
        )}
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "hsl(40,90%,52%)" }}/>Függőben</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "hsl(280,60%,58%)" }}/>Kozmetika</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "hsl(25,80%,55%)" }}/>Gyanta</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "hsl(340,70%,52%)" }}/>Smink</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "hsl(195,70%,48%)" }}/>Szempilla</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: "rgba(220,38,38,0.4)", border: "1px solid #dc2626" }}/>Szabadnap</span>
      </div>
    </div>
  );
};

// ─── User Detail Modal ────────────────────────────────────────────────────────

const UserDetailModal = ({ user, allBookings, onClose, onAttendance, onCancel, onDelete }) => {
  const [filter, setFilter]   = useState("all");
  const [sortDir, setSortDir] = useState("asc");

  const userBookings = useMemo(() =>
    allBookings.filter((b) => b.userId === user.id || b.userEmail === user.email),
    [allBookings, user]
  );

  const filtered = useMemo(() => {
    let list = userBookings;
    if (filter === "upcoming")  list = list.filter((b) => !isCompleted(b) && b.status !== "pending");
    if (filter === "pending")   list = list.filter((b) => b.status === "pending");
    if (filter === "completed") list = list.filter((b) =>  isCompleted(b));
    if (filter === "noshow")    list = list.filter((b) =>  isCompleted(b) && isNoShow(b));
    return [...list].sort((a, b) => {
      const da  = `${a.date} ${a.time}`;
      const db2 = `${b.date} ${b.time}`;
      return sortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [userBookings, filter, sortDir]);

  const ustats = useMemo(() => ({
    total:     userBookings.length,
    pending:   userBookings.filter((b) => b.status === "pending").length,
    upcoming:  userBookings.filter((b) => !isCompleted(b) && b.status !== "pending").length,
    completed: userBookings.filter((b) =>  isCompleted(b)).length,
    noshow:    userBookings.filter((b) =>  isCompleted(b) && isNoShow(b)).length,
    attended:  userBookings.filter((b) =>  isCompleted(b) && !isNoShow(b)).length,
  }), [userBookings]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IoMdClose /></button>

        <div className="user-detail-header">
          <div className="user-detail-avatar">{(user.name || user.email || "?")[0].toUpperCase()}</div>
          <div>
            <h3>{user.name || "–"}</h3>
            <p>{user.email}</p>
            {user.phone && <p>📞 {user.phone}</p>}
            <span className={`role-badge ${user.role || "user"}`}>{user.role || "user"}</span>
            {user.banned && (
              <span style={{ marginLeft: "8px", background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px" }}>
                🚫 TILTVA
              </span>
            )}
          </div>
        </div>

        <div className="user-detail-stats">
          <div className="mini-stat">📋 <strong>{ustats.total}</strong> összesen</div>
          {ustats.pending > 0 && <div className="mini-stat" style={{ color: "#92400e" }}>⏳ <strong>{ustats.pending}</strong> függőben</div>}
          <div className="mini-stat">⏳ <strong>{ustats.upcoming}</strong> közelgő</div>
          <div className="mini-stat">✅ <strong>{ustats.attended}</strong> megjelent</div>
          <div className="mini-stat">❌ <strong>{ustats.noshow}</strong> nem jelent meg</div>
          <div className={`mini-stat${(user.cancelCount || 0) > 0 ? " mini-stat--warn" : ""}`}>
            🚫 <strong>{user.cancelCount || 0}</strong> visszamondva
          </div>
        </div>

        <div className="sub-tabs-row">
          <div className="sub-tabs">
            {[
              { key: "all",       label: `Összes (${ustats.total})` },
              { key: "pending",   label: `Függőben (${ustats.pending})`, warn: ustats.pending > 0 },
              { key: "upcoming",  label: `Közelgő (${ustats.upcoming})` },
              { key: "completed", label: `Lezajlott (${ustats.completed})` },
              { key: "noshow",    label: `Nem jelent meg (${ustats.noshow})`, warn: ustats.noshow > 0 },
            ].map(({ key, label, warn }) => (
              <button key={key}
                className={`sub-tab${filter === key ? " active" : ""}${warn ? " sub-tab--warn" : ""}`}
                onClick={() => setFilter(key)}
              >{label}</button>
            ))}
          </div>
          <SortBtn dir={sortDir} onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} label="Dátum" />
        </div>

        {filtered.length === 0 ? (
          <p className="no-data">Nincs foglalás ebben a szűrőben</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Dátum</th><th>Idő</th><th>Szolgáltatás</th><th>Időtartam</th><th>Státusz</th><th>Műveletek</th></tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <BookingRow key={b.id} booking={b} showUser={false}
                    onEdit={() => {}} onCancel={onCancel}
                    onDelete={onDelete} onAttendance={onAttendance}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { userData } = useUser();
  const [activeTab, setActiveTab]                     = useState("calendar");
  const [bookingSubTab, setBookingSubTab]             = useState("pending");
  const [blockedDateSubTab, setBlockedDateSubTab]     = useState("upcoming");
  const [blockedTimeSubTab, setBlockedTimeSubTab]     = useState("upcoming");
  const [users, setUsers]                             = useState([]);
  const [bookings, setBookings]                       = useState([]);
  const [blockedDates, setBlockedDates]               = useState([]);
  const [blockedTimes, setBlockedTimes]               = useState([]);
  const [loading, setLoading]                         = useState(false);
  const [approveLoading, setApproveLoading]           = useState(null);
  const [editingUser, setEditingUser]                 = useState(null);
  const [editingBooking, setEditingBooking]           = useState(null);
  const [selectedUser, setSelectedUser]               = useState(null);
  const [showBlockDateModal, setShowBlockDateModal]   = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal]   = useState(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [addBookingInitDate, setAddBookingInitDate]   = useState("");
  const [newBlockedDate, setNewBlockedDate]           = useState({ date: "", reason: "" });
  const [newBlockedTime, setNewBlockedTime]           = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [banLoading, setBanLoading]                   = useState(null);
  const [isSaving, setIsSaving]                       = useState(false);

  const [bookingSortDir, setBookingSortDir] = useState("asc");
  const [userSortDir,    setUserSortDir]    = useState("asc");
  const [bdSortDir,      setBdSortDir]      = useState("asc");
  const [btSortDir,      setBtSortDir]      = useState("asc");

  const isAdmin = userData?.role === "admin";

  // Előző pending szám – toast értesítéshez
  const prevPendingCount = useRef(null);

  // ── Valós idejű adatbetöltés (onSnapshot) ────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    let ready = 0;
    const checkReady = () => { if (++ready >= 3) setLoading(false); };

    // Foglalások – real-time
    const unsubBookings = onSnapshot(
      collection(db, "bookings"),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((b) => ["booked", "pending"].includes(b.status) && !b.blocked);

        const newPendingCount = all.filter((b) => b.status === "pending").length;
        if (prevPendingCount.current !== null && newPendingCount > prevPendingCount.current) {
          toast.info("🔔 Új foglalási kérelem érkezett!", { autoClose: 6000 });
        }
        prevPendingCount.current = newPendingCount;

        setBookings(all);
        checkReady();
      },
      (err) => { console.error("❌ bookings snapshot:", err); checkReady(); }
    );

    // Felhasználók – real-time
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => { setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkReady(); },
      (err) => { console.error("❌ users snapshot:", err); checkReady(); }
    );

    // Blokkolt napok – real-time
    const unsubBlockedDates = onSnapshot(
      collection(db, "blockedDates"),
      (snap) => { setBlockedDates(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkReady(); },
      (err) => { console.error("❌ blockedDates snapshot:", err); checkReady(); }
    );

    // Blokkolt időszakok – real-time
    const unsubBlockedTimes = onSnapshot(
      collection(db, "blockedTimes"),
      (snap) => setBlockedTimes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("❌ blockedTimes snapshot:", err)
    );

    // Leiratkozás unmount-kor
    return () => {
      unsubBookings();
      unsubUsers();
      unsubBlockedDates();
      unsubBlockedTimes();
    };
  }, [isAdmin]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const pending   = bookings.filter((b) => b.status === "pending");
    const active    = bookings.filter((b) => b.status === "booked");
    const upcoming  = active.filter((b) => !isCompleted(b));
    const completed = active.filter((b) =>  isCompleted(b));
    const noshow    = completed.filter((b) => isNoShow(b));
    const attended  = completed.filter((b) => !isNoShow(b));
    return {
      totalUsers: users.length,
      pending: pending.length,
      upcoming: upcoming.length,
      completed: completed.length,
      noshow: noshow.length,
      attended: attended.length,
    };
  }, [bookings, users]);

  // ── Pending approve / reject ──────────────────────────────────────────────

  const approveBooking = async (booking) => {
    if (!window.confirm(`Jóváhagyod a foglalást?\n${booking.userName} – ${booking.date} ${booking.time}\nA vendég visszaigazoló emailt kap.`)) return;
    setApproveLoading(booking.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${booking.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      // Frissítjük a lokális state-et
      setBookings((prev) => prev.map((b) =>
        b.id === booking.id ? { ...b, status: "booked", approveToken: undefined, cancelToken: undefined } : b
      ));
      toast.success("✅ Foglalás jóváhagyva! Visszaigazoló email elküldve.");
    } catch (err) {
      toast.error("Hiba: " + err.message);
    } finally {
      setApproveLoading(null);
    }
  };

  const rejectBooking = async (bookingId) => {
    if (!window.confirm("Elutasítod ezt a foglalási kérelmet? A vendég értesítő emailt kap.")) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}?notify=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Foglalási kérelem elutasítva, ügyfél értesítve.");
    } catch (err) {
      toast.error("Hiba: " + err.message);
    }
  };

  // ── Sorted bookings ───────────────────────────────────────────────────────

  const pendingBookings = useMemo(() => {
    const list = bookings.filter((b) => b.status === "pending");
    return [...list].sort((a, b) => {
      const da = `${a.date} ${a.time}`, db2 = `${b.date} ${b.time}`;
      return bookingSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [bookings, bookingSortDir]);

  const upcomingBookings = useMemo(() => {
    const list = bookings.filter((b) => b.status === "booked" && !isCompleted(b));
    return [...list].sort((a, b) => {
      const da = `${a.date} ${a.time}`, db2 = `${b.date} ${b.time}`;
      return bookingSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [bookings, bookingSortDir]);

  const completedBookings = useMemo(() => {
    const list = bookings.filter((b) => b.status === "booked" && isCompleted(b));
    return [...list].sort((a, b) => {
      const da = `${a.date} ${a.time}`, db2 = `${b.date} ${b.time}`;
      return bookingSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [bookings, bookingSortDir]);

  // ── Sorted users ──────────────────────────────────────────────────────────

  const sortedUsers = useMemo(() =>
    [...users].sort((a, b) => {
      const an = (a.name || a.email || "").toLowerCase();
      const bn = (b.name || b.email || "").toLowerCase();
      return userSortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
    }), [users, userSortDir]);

  // ── Blocked dates ─────────────────────────────────────────────────────────

  const blockedDatesFiltered = useMemo(() => {
    const list = blockedDates.filter((bd) =>
      blockedDateSubTab === "upcoming" ? !isBlockedDateExpired(bd) : isBlockedDateExpired(bd)
    );
    return [...list].sort((a, b) => {
      const da = a.date || "", db2 = b.date || "";
      return bdSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [blockedDates, blockedDateSubTab, bdSortDir]);

  const bdCounts = useMemo(() => ({
    upcoming: blockedDates.filter((bd) => !isBlockedDateExpired(bd)).length,
    expired:  blockedDates.filter((bd) =>  isBlockedDateExpired(bd)).length,
  }), [blockedDates]);

  const blockedTimesFiltered = useMemo(() => {
    const list = blockedTimes.filter((bt) =>
      blockedTimeSubTab === "upcoming" ? !isBlockedTimeExpired(bt) : isBlockedTimeExpired(bt)
    );
    return [...list].sort((a, b) => {
      const da = `${a.date || ""} ${a.startTime || ""}`;
      const db2 = `${b.date || ""} ${b.startTime || ""}`;
      return btSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [blockedTimes, blockedTimeSubTab, btSortDir]);

  const btCounts = useMemo(() => ({
    upcoming: blockedTimes.filter((bt) => !isBlockedTimeExpired(bt)).length,
    expired:  blockedTimes.filter((bt) =>  isBlockedTimeExpired(bt)).length,
  }), [blockedTimes]);

  // ── Attendance ────────────────────────────────────────────────────────────

  const updateAttendance = async (bookingId, value) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { attended: value });
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, attended: value } : b));
    } catch (err) {
      alert("Hiba a részvétel rögzítésekor: " + err.message);
    }
  };

  // ── Ban / Unban ───────────────────────────────────────────────────────────

  const handleBan = async (userId, currentBanned) => {
    const action = currentBanned ? "feloldod a tiltást" : "letiltod ezt a felhasználót";
    if (!window.confirm(`Biztosan ${action}?`)) return;
    setBanLoading(userId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ banned: !currentBanned }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: !currentBanned } : u));
      toast.success(!currentBanned ? "Felhasználó letiltva." : "Tiltás feloldva.");
    } catch (err) {
      toast.error("Hiba: " + err.message);
    } finally {
      setBanLoading(null);
    }
  };

  // ── User ops ──────────────────────────────────────────────────────────────

  const deleteUser = async (userId) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a felhasználót?")) return;
    const token = await auth.currentUser?.getIdToken();
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }

  };

  const updateUser = async (userId, updatedData) => {
    const { id, ...toUpdate } = updatedData;
    try {
      const originalUser = users.find((u) => u.id === userId);
      const emailChanged = originalUser && originalUser.email !== toUpdate.email;
      const token = await auth.currentUser?.getIdToken();
      if (emailChanged) {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/email`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: toUpdate.email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const { email, ...restToUpdate } = toUpdate;
        if (Object.keys(restToUpdate).length > 0) await updateDoc(doc(db, "users", userId), restToUpdate);
      } else {
        await updateDoc(doc(db, "users", userId), toUpdate);
      }
      setEditingUser(null);
  
      toast.success("✅ Felhasználó sikeresen mentve!");
    } catch (err) {
      toast.error("❌ Hiba a mentés során: " + err.message);
    }
  };

  // ── Booking ops ───────────────────────────────────────────────────────────

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a foglalást?")) return;
    const token = await auth.currentUser?.getIdToken();
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}?notify=false`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Visszamondod ezt a foglalást? A vendég emailt kap.")) return;
    const token = await auth.currentUser?.getIdToken();
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}?notify=true`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const updateBooking = async (bookingId, updatedData) => {
    const { id, createdAt, ...toUpdate } = updatedData;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "bookings", bookingId), toUpdate);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, ...toUpdate } : b));
      setEditingBooking(null);
      toast.success("✅ Foglalás sikeresen mentve!");
    } catch (err) {
      toast.error("❌ Hiba a mentés során: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Add Booking ───────────────────────────────────────────────────────────

  const handleAddBooking = async (formData) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    toast.success("✅ Foglalás sikeresen létrehozva!");

  };

  const openAddBooking = useCallback((prefilledDate = "") => {
    setAddBookingInitDate(prefilledDate);
    setShowAddBookingModal(true);
  }, []);

  // ── Blocked ops ───────────────────────────────────────────────────────────

  const addBlockedDate = async () => {
    if (!newBlockedDate.date) { alert("Kérlek válassz dátumot!"); return; }
    if (blockedDates.find((bd) => bd.date === newBlockedDate.date)) { alert("Ez a dátum már blokkolva van!"); return; }
    await addDoc(collection(db, "blockedDates"), {
      date: newBlockedDate.date, reason: newBlockedDate.reason || "Szabadnap", createdAt: new Date(),
    });
    setShowBlockDateModal(false);
    setNewBlockedDate({ date: "", reason: "" });

  };

  const deleteBlockedDate = async (dateId) => {
    if (!window.confirm("Törlöd ezt a szabadnapot?")) return;
    await deleteDoc(doc(db, "blockedDates", dateId));

  };

  const addBlockedTime = async () => {
    if (!newBlockedTime.date || !newBlockedTime.startTime || !newBlockedTime.endTime) { alert("Kérlek töltsd ki az összes mezőt!"); return; }
    if (newBlockedTime.startTime >= newBlockedTime.endTime) { alert("A kezdő időpontnak kisebbnek kell lennie!"); return; }
    await addDoc(collection(db, "blockedTimes"), {
      ...newBlockedTime, reason: newBlockedTime.reason || "Blokkolt időszak", createdAt: new Date(),
    });
    setShowBlockTimeModal(false);
    setNewBlockedTime({ date: "", startTime: "", endTime: "", reason: "" });

  };

  const deleteBlockedTime = async (timeId) => {
    if (!window.confirm("Törlöd ezt a blokkolt időszakot?")) return;
    await deleteDoc(doc(db, "blockedTimes", timeId));

  };

  const runCleanup = async () => {
    if (!window.confirm("Törlöd az összes lejárt foglalást és blokkolt napot?")) return;
    setLoading(true);
    const token = await auth.currentUser?.getIdToken();
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cleanup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    toast.success(`Cleanup kész! Törölt: ${data.total} rekord`);

    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="admin-no-access">
        <h2>⚠️ Hozzáférés megtagadva</h2>
        <p>Nincs jogosultságod az admin felület eléréséhez.</p>
      </div>
    );
  }

  const bookingList =
    bookingSubTab === "pending"   ? pendingBookings   :
    bookingSubTab === "upcoming"  ? upcomingBookings  :
    completedBookings;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <p style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          Üdv, {userData?.name}! <LiveIndicator />
        </p>
      </div>

      {/* ── Stat kártyák ── */}
      <div className="stats-row">
        <StatCard emoji="👥" label="Felhasználók"   value={stats.totalUsers} color="#818cf8" />
        <StatCard
          emoji="⏳" label="Függőben"
          value={stats.pending}
          color="#f59e0b"
          sub={stats.pending > 0 ? "Jóváhagyásra vár" : "Nincs függőben lévő"}
        />
        <StatCard emoji="📅" label="Közelgő"        value={stats.upcoming}   color="#34d399" />
        <StatCard emoji="📋" label="Lezajlott"      value={stats.completed}  color="#60a5fa"
          sub={`✅ ${stats.attended} megjelent  ·  ❌ ${stats.noshow} nem jelent meg`}
        />
      </div>

      {/* Pending figyelmeztetés ha van függőben */}
      {stats.pending > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          border: "1.5px solid rgba(245,158,11,0.4)",
          borderRadius: "12px", padding: "14px 20px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "22px" }}>⏳</span>
          <div>
            <strong style={{ color: "#92400e" }}>
              {stats.pending} foglalási kérelem vár jóváhagyásra
            </strong>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#b45309" }}>
              Kattints a „Foglalások" fülre és válaszd a „Függőben" szekciót.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ marginLeft: "auto", padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
            onClick={() => { setActiveTab("bookings"); setBookingSubTab("pending"); }}
          >
            Megtekintés →
          </button>
        </div>
      )}

      {/* ── Főtabok ── */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>
          <IoMdCalendar /> Naptár
        </button>
        <button className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
          📋 Foglalások
          {stats.pending > 0 && (
            <span style={{ marginLeft: "6px", background: "#f59e0b", color: "#fff", borderRadius: "999px", fontSize: "11px", fontWeight: 700, padding: "1px 7px" }}>
              {stats.pending}
            </span>
          )}
        </button>
        <button className={`admin-tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <IoMdPerson /> Felhasználók
        </button>
        <button className={`admin-tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
          <MdSettings /> Beállítások
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Betöltés...</div>
        ) : (
          <>
            {/* ══ NAPTÁR ══ */}
            {activeTab === "calendar" && (
              <div className="admin-section">
                <CalendarView
                  bookings={bookings}
                  blockedDates={blockedDates.length ? blockedDates : []}
                  onEdit={setEditingBooking}
                  onCancel={cancelBooking}
                  onDelete={deleteBooking}
                  onAttendance={updateAttendance}
                  onAddBooking={openAddBooking}
                  onApprove={approveBooking}
                  onReject={rejectBooking}
                  approveLoading={approveLoading}
                />
              </div>
            )}

            {/* ══ FOGLALÁSOK ══ */}
            {activeTab === "bookings" && (
              <div className="admin-section">
                <div className="section-header">
                  <h2>Foglalások</h2>
                  <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}
                    onClick={() => openAddBooking()}>
                    <IoMdAdd style={{ marginRight: "4px" }} /> Új foglalás
                  </button>
                </div>

                <div className="sub-tabs-row">
                  <div className="sub-tabs">
                    <button
                      className={`sub-tab ${bookingSubTab === "pending" ? "active" : ""}${stats.pending > 0 ? " sub-tab--warn" : ""}`}
                      onClick={() => setBookingSubTab("pending")}
                    >
                      ⏳ Függőben
                      <span className="tab-badge" style={stats.pending > 0 ? { background: "#f59e0b" } : {}}>
                        {stats.pending}
                      </span>
                    </button>
                    <button className={`sub-tab ${bookingSubTab === "upcoming" ? "active" : ""}`} onClick={() => setBookingSubTab("upcoming")}>
                      📅 Közelgő <span className="tab-badge">{stats.upcoming}</span>
                    </button>
                    <button className={`sub-tab ${bookingSubTab === "completed" ? "active" : ""}`} onClick={() => setBookingSubTab("completed")}>
                      📋 Lezajlott <span className="tab-badge">{stats.completed}</span>
                    </button>
                  </div>
                  <SortBtn dir={bookingSortDir} onClick={() => setBookingSortDir(d => d === "asc" ? "desc" : "asc")} label="Dátum" />
                </div>

                {bookingSubTab === "pending" && (
                  <div style={{
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#92400e",
                  }}>
                    ⏳ Az alábbi foglalások az ügyfelek kérelmei – <strong>Jóváhagyás</strong> után az ügyfél visszaigazoló, <strong>Elutasítás</strong> után értesítő emailt kap.
                  </div>
                )}

                {bookingSubTab === "completed" && (
                  <div className="completion-legend">
                    <span>Részvétel:</span>
                    <span>✅ Alapból megjelentnek számít</span>
                    <span>·</span>
                    <span className="legend-note">Ha nem jött el, kattints a gombra</span>
                  </div>
                )}

                {bookingList.length === 0 ? (
                  <p className="no-data">
                    {bookingSubTab === "pending"   ? "Nincs jóváhagyásra váró foglalás 🎉" :
                     bookingSubTab === "upcoming"  ? "Nincs közelgő foglalás" :
                     "Nincs lezajlott foglalás"}
                  </p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Dátum</th><th>Idő</th><th>Szolgáltatás</th><th>Időtartam</th>
                          <th>Név</th><th>Email</th><th>Telefon</th>
                          <th>Státusz</th><th>Műveletek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingList.map((b) => (
                          <BookingRow key={b.id} booking={b}
                            onEdit={setEditingBooking}
                            onCancel={cancelBooking}
                            onDelete={deleteBooking}
                            onAttendance={updateAttendance}
                            onApprove={approveBooking}
                            onReject={rejectBooking}
                            approveLoading={approveLoading}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ FELHASZNÁLÓK ══ */}
            {activeTab === "users" && (
              <div className="admin-section">
                <div className="section-header">
                  <h2>Felhasználók ({users.length})</h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <SortBtn dir={userSortDir} onClick={() => setUserSortDir(d => d === "asc" ? "desc" : "asc")} label="Név" />
                    <button className="btn-secondary" onClick={runCleanup}>🧹 Cleanup</button>
                  </div>
                </div>

                {sortedUsers.length === 0 ? (
                  <p className="no-data">Nincsenek felhasználók</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Név</th><th>Email</th><th>Telefon</th><th>Szerepkör</th><th>Regisztráció</th>
                          <th>Közelgő</th><th>Lezajlott</th><th>Nem jelent meg</th><th>Visszamondás</th>
                          <th>Státusz</th><th>Műveletek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map((user) => {
                          const ub          = bookings.filter((b) => b.userId === user.id || b.userEmail === user.email);
                          const ubUpcoming  = ub.filter((b) => !isCompleted(b) && b.status !== "pending").length;
                          const ubCompleted = ub.filter((b) =>  isCompleted(b)).length;
                          const ubNoshow    = ub.filter((b) =>  isCompleted(b) && isNoShow(b)).length;
                          const isBanned    = user.banned === true;
                          return (
                            <tr key={user.id}
                              className={`user-row${isBanned ? " user-row--banned" : ""}`}
                              onClick={() => setSelectedUser(user)}
                              title="Kattints a foglalások megtekintéséhez"
                              style={isBanned ? { opacity: 0.7, background: "rgba(220,38,38,0.04)" } : {}}
                            >
                              <td><strong>{user.name || "–"}</strong></td>
                              <td>{user.email}</td>
                              <td>{user.phone || "–"}</td>
                              <td><span className={`role-badge ${user.role || "user"}`}>{user.role || "user"}</span></td>
                              <td>{user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString("hu-HU") : "–"}</td>
                              <td><span className="mini-badge mini-badge--upcoming">⏳ {ubUpcoming}</span></td>
                              <td><span className="mini-badge mini-badge--completed">📋 {ubCompleted}</span></td>
                              <td>{ubNoshow > 0 ? <span className="mini-badge mini-badge--noshow">❌ {ubNoshow}</span> : <span className="mini-badge">–</span>}</td>
                              <td>{(user.cancelCount || 0) > 0 ? <span className="mini-badge mini-badge--cancel">🚫 {user.cancelCount}</span> : <span className="mini-badge">–</span>}</td>
                              <td>
                                {isBanned
                                  ? <span className="mini-badge" style={{ background: "rgba(220,38,38,0.12)", color: "#b91c1c", fontWeight: 700 }}>🚫 Tiltva</span>
                                  : <span className="mini-badge" style={{ background: "rgba(34,197,94,0.1)", color: "#15803d", fontWeight: 600 }}>✅ Aktív</span>
                                }
                              </td>
                              <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-edit" onClick={() => setEditingUser(user)}><IoMdCreate /></button>
                                <button
                                  disabled={banLoading === user.id}
                                  onClick={() => handleBan(user.id, isBanned)}
                                  style={{ width:"30px", height:"30px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"14px", display:"inline-flex", alignItems:"center", justifyContent:"center",
                                    background: isBanned ? "linear-gradient(135deg, hsl(140,65%,45%), hsl(140,75%,50%))" : "linear-gradient(135deg, hsl(0,70%,55%), hsl(0,80%,60%))",
                                    color:"white", opacity: banLoading === user.id ? 0.6 : 1,
                                  }}
                                >
                                  {banLoading === user.id ? "⏳" : isBanned ? "🔓" : "🚫"}
                                </button>
                                <button className="btn-delete" onClick={() => deleteUser(user.id)}><IoMdTrash /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ BEÁLLÍTÁSOK ══ */}
            {activeTab === "settings" && (
              <div className="admin-section">
                <div className="section-header"><h2>Blokkolások kezelése</h2></div>

                <div className="blocking-subsection">
                  <div className="subsection-header">
                    <h3><MdBlock /> Teljes napok blokkolása</h3>
                    <button className="btn-primary" onClick={() => setShowBlockDateModal(true)}><MdBlock /> Nap blokkolása</button>
                  </div>
                  <div className="sub-tabs-row">
                    <div className="sub-tabs">
                      <button className={`sub-tab ${blockedDateSubTab === "upcoming" ? "active" : ""}`} onClick={() => setBlockedDateSubTab("upcoming")}>
                        📅 Közelgő <span className="tab-badge">{bdCounts.upcoming}</span>
                      </button>
                      <button className={`sub-tab ${blockedDateSubTab === "expired" ? "active" : ""}`}  onClick={() => setBlockedDateSubTab("expired")}>
                        🔒 Lejárt <span className="tab-badge">{bdCounts.expired}</span>
                      </button>
                    </div>
                    <SortBtn dir={bdSortDir} onClick={() => setBdSortDir(d => d === "asc" ? "desc" : "asc")} label="Dátum" />
                  </div>
                  {blockedDatesFiltered.length === 0 ? (
                    <p className="no-data">{blockedDateSubTab === "upcoming" ? "Nincs közelgő blokkolt nap" : "Nincs lejárt blokkolt nap"}</p>
                  ) : (
                    <div className="blocked-dates-grid">
                      {blockedDatesFiltered.map((bd) => {
                        const expired = isBlockedDateExpired(bd);
                        return (
                          <div key={bd.id} className={`blocked-date-card${expired ? " blocked-card--expired" : ""}`}>
                            <div className="blocked-date-info">
                              <h4>{expired ? "🔒" : "📅"} {bd.date}{expired && <span className="expired-tag">Lejárt</span>}</h4>
                              <p>{bd.reason || "Szabadnap"}</p>
                            </div>
                            <button className="btn-delete-small" onClick={() => deleteBlockedDate(bd.id)}><IoMdTrash /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="blocking-subsection">
                  <div className="subsection-header">
                    <h3><MdAccessTime /> Időszakok blokkolása</h3>
                    <button className="btn-primary" onClick={() => setShowBlockTimeModal(true)}><MdAccessTime /> Időszak blokkolása</button>
                  </div>
                  <div className="sub-tabs-row">
                    <div className="sub-tabs">
                      <button className={`sub-tab ${blockedTimeSubTab === "upcoming" ? "active" : ""}`} onClick={() => setBlockedTimeSubTab("upcoming")}>
                        ⏳ Közelgő <span className="tab-badge">{btCounts.upcoming}</span>
                      </button>
                      <button className={`sub-tab ${blockedTimeSubTab === "expired" ? "active" : ""}`}  onClick={() => setBlockedTimeSubTab("expired")}>
                        🔒 Lejárt <span className="tab-badge">{btCounts.expired}</span>
                      </button>
                    </div>
                    <SortBtn dir={btSortDir} onClick={() => setBtSortDir(d => d === "asc" ? "desc" : "asc")} label="Dátum" />
                  </div>
                  {blockedTimesFiltered.length === 0 ? (
                    <p className="no-data">{blockedTimeSubTab === "upcoming" ? "Nincs közelgő blokkolt időszak" : "Nincs lejárt blokkolt időszak"}</p>
                  ) : (
                    <div className="blocked-dates-grid">
                      {blockedTimesFiltered.map((bt) => {
                        const expired = isBlockedTimeExpired(bt);
                        return (
                          <div key={bt.id} className={`blocked-date-card blocked-time-card${expired ? " blocked-card--expired" : ""}`}>
                            <div className="blocked-date-info">
                              <h4>{expired ? "🔒" : "📅"} {bt.date}{expired && <span className="expired-tag">Lejárt</span>}</h4>
                              <p className="time-range">🕐 {bt.startTime} – {bt.endTime}</p>
                              <p className="reason">{bt.reason}</p>
                            </div>
                            <button className="btn-delete-small" onClick={() => deleteBlockedTime(bt.id)}><IoMdTrash /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser} allBookings={bookings}
          onClose={() => setSelectedUser(null)} onAttendance={updateAttendance}
          onCancel={cancelBooking} onDelete={deleteBooking}
        />
      )}

      {/* ── Add Booking Modal ── */}
      {showAddBookingModal && (
        <AddBookingModal
          onClose={() => setShowAddBookingModal(false)}
          onSave={handleAddBooking}
          initialDate={addBookingInitDate}
        />
      )}

      {/* ── User Edit Modal ── */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setEditingUser(null)}><IoMdClose /></button>
            <h3>Felhasználó szerkesztése</h3>
            {[
              { label: "Név",     key: "name",  type: "text"  },
              { label: "Email",   key: "email", type: "email" },
              { label: "Telefon", key: "phone", type: "tel"   },
            ].map(({ label, key, type }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input type={type} value={editingUser[key] || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, [key]: e.target.value })} />
              </div>
            ))}
            <div className="form-group">
              <label>Szerepkör</label>
              <select value={editingUser.role || "user"} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn-primary" onClick={() => updateUser(editingUser.id, editingUser)}>Mentés</button>
          </div>
        </div>
      )}

      {/* ── Booking Edit Modal ── */}
      {editingBooking && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingBooking(null)}><IoMdClose /></button>
            <h3>Foglalás szerkesztése</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Dátum</label>
                <input type="date" value={editingBooking.date || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Időpont</label>
                <input type="time" value={editingBooking.time || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>Szolgáltatás</label>
              <ServiceSelector
                value={editingBooking.service || ""}
                onChange={(id, name) => setEditingBooking({ ...editingBooking, service: id, serviceName: name })}
                onDurationChange={(dur) => setEditingBooking((prev) => ({ ...prev, duration: dur }))}
              />
            </div>

            <div className="form-group">
              <label>Időtartam (perc)</label>
              <input type="number" min="5" step="5" value={editingBooking.duration || ""}
                onChange={(e) => setEditingBooking({ ...editingBooking, duration: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Név</label>
                <input type="text" value={editingBooking.userName || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, userName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input type="tel" value={editingBooking.userPhone || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, userPhone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={editingBooking.userEmail || ""}
                onChange={(e) => setEditingBooking({ ...editingBooking, userEmail: e.target.value })} />
            </div>

            <button className="btn-primary" disabled={isSaving} onClick={() => updateBooking(editingBooking.id, editingBooking)}>
              {isSaving ? "Mentés..." : "Mentés"}
            </button>
          </div>
        </div>
      )}

      {/* ── Block Date Modal ── */}
      {showBlockDateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setShowBlockDateModal(false); setNewBlockedDate({ date: "", reason: "" }); }}><IoMdClose /></button>
            <h3>Teljes nap blokkolása</h3>
            <div className="form-group">
              <label>Dátum *</label>
              <input type="date" value={newBlockedDate.date} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Indok (opcionális)</label>
              <input type="text" placeholder="pl. Szabadnap, Ünnep..." value={newBlockedDate.reason}
                onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={addBlockedDate}>Nap blokkolása</button>
          </div>
        </div>
      )}

      {/* ── Block Time Modal ── */}
      {showBlockTimeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setShowBlockTimeModal(false); setNewBlockedTime({ date: "", startTime: "", endTime: "", reason: "" }); }}><IoMdClose /></button>
            <h3>Időszak blokkolása</h3>
            <div className="form-group">
              <label>Dátum *</label>
              <input type="date" value={newBlockedTime.date} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setNewBlockedTime({ ...newBlockedTime, date: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kezdő időpont *</label>
                <input type="time" step="600" value={newBlockedTime.startTime}
                  onChange={(e) => setNewBlockedTime({ ...newBlockedTime, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vég időpont *</label>
                <input type="time" step="600" value={newBlockedTime.endTime}
                  onChange={(e) => setNewBlockedTime({ ...newBlockedTime, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Indok (opcionális)</label>
              <input type="text" placeholder="pl. Ebédszünet, Meeting..." value={newBlockedTime.reason}
                onChange={(e) => setNewBlockedTime({ ...newBlockedTime, reason: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={addBlockedTime}>Időszak blokkolása</button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;