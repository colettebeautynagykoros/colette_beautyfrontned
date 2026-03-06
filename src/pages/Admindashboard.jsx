import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firabse/FireBaseConfig";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import {
  IoMdClose, IoMdTrash, IoMdCreate, IoMdCalendar,
  IoMdPerson, IoMdMail,
} from "react-icons/io";
import { MdBlock, MdSettings, MdAccessTime } from "react-icons/md";
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
      { id: "melyhidratolo",                   name: "Mélyhidratáló kezelés",                       duration: 90  },
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
  const end = bookingEndTime(b);
  return end && end < new Date();
};

const isBlockedDateExpired = (bd) => {
  if (!bd.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

// ─── Sort Button ──────────────────────────────────────────────────────────────

const SortBtn = ({ dir, onClick, label = "Rendezés" }) => (
  <button
    className="sort-btn"
    onClick={onClick}
    title={`Jelenleg: ${dir === "asc" ? "növekvő (legrégebbi elől)" : "csökkenő (legújabb elől)"}`}
  >
    {label} {dir === "asc" ? "↑" : "↓"}
  </button>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

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
      title={noShow ? "Megjelölve: nem jelent meg – kattints a visszavonáshoz" : "Kattints ha nem jelent meg"}
      onClick={() => onChange(booking.id, noShow ? null : false)}
    >
      {noShow ? "❌ Nem jelent meg" : "✅ Megjelent"}
    </button>
  );
};

// ─── Booking Row ──────────────────────────────────────────────────────────────

const BookingRow = ({ booking, onEdit, onCancel, onDelete, onAttendance, showUser = true }) => {
  const completed = isCompleted(booking);
  return (
    <tr className={completed ? (isNoShow(booking) ? "row--noshow" : "row--completed") : "row--upcoming"}>
      <td>{formatDate(booking.date)}</td>
      <td>{booking.time || "–"}</td>
      <td>{booking.service || "–"}</td>
      <td>{booking.duration ? `${booking.duration} perc` : "–"}</td>
      {showUser && <td>{booking.userName || "–"}</td>}
      {showUser && <td>{booking.userEmail || "–"}</td>}
      {showUser && <td>{booking.userPhone || "–"}</td>}
      <td>
        {completed
          ? <AttendanceToggle booking={booking} onChange={onAttendance} />
          : <span className="att-badge att--upcoming">⏳ Közelgő</span>}
      </td>
      <td className="action-buttons">
        <button className="btn-edit"   title="Szerkesztés"          onClick={() => onEdit(booking)}><IoMdCreate /></button>
        <button className="btn-cancel" title="Visszamondás (email)" onClick={() => onCancel(booking.id)}><IoMdMail /></button>
        <button className="btn-delete" title="Törlés (email nélkül)" onClick={() => onDelete(booking.id)}><IoMdTrash /></button>
      </td>
    </tr>
  );
};

// ─── Service Selector (kategóriás dropdown) ───────────────────────────────────

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
          <button
            key={i}
            type="button"
            className={`service-cat-tab ${catTab === i ? "active" : ""}`}
            onClick={() => setCatTab(i)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="service-options">
        {SERVICE_CATEGORIES[catTab].services.map((svc) => (
          <div
            key={svc.id}
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
    if (filter === "upcoming")  list = list.filter((b) => !isCompleted(b));
    if (filter === "completed") list = list.filter((b) => isCompleted(b));
    if (filter === "noshow")    list = list.filter((b) => isCompleted(b) && isNoShow(b));
    return [...list].sort((a, b) => {
      const da  = `${a.date} ${a.time}`;
      const db2 = `${b.date} ${b.time}`;
      return sortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [userBookings, filter, sortDir]);

  const ustats = useMemo(() => ({
    total:     userBookings.length,
    upcoming:  userBookings.filter((b) => !isCompleted(b)).length,
    completed: userBookings.filter((b) => isCompleted(b)).length,
    noshow:    userBookings.filter((b) => isCompleted(b) && isNoShow(b)).length,
    attended:  userBookings.filter((b) => isCompleted(b) && !isNoShow(b)).length,
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
              <span style={{
                marginLeft: "8px",
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "999px",
                letterSpacing: "0.04em",
              }}>🚫 TILTVA</span>
            )}
          </div>
        </div>

        <div className="user-detail-stats">
          <div className="mini-stat">📋 <strong>{ustats.total}</strong> összesen</div>
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
              { key: "upcoming",  label: `Közelgő (${ustats.upcoming})` },
              { key: "completed", label: `Lezajlott (${ustats.completed})` },
              { key: "noshow",    label: `Nem jelent meg (${ustats.noshow})`, warn: ustats.noshow > 0 },
            ].map(({ key, label, warn }) => (
              <button
                key={key}
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
                <tr>
                  <th>Dátum</th><th>Idő</th><th>Szolgáltatás</th>
                  <th>Időtartam</th><th>Részvétel</th><th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id} booking={b} showUser={false}
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
  const [activeTab, setActiveTab]                   = useState("bookings");
  const [bookingSubTab, setBookingSubTab]           = useState("upcoming");
  const [blockedDateSubTab, setBlockedDateSubTab]   = useState("upcoming");
  const [blockedTimeSubTab, setBlockedTimeSubTab]   = useState("upcoming");
  const [users, setUsers]                           = useState([]);
  const [bookings, setBookings]                     = useState([]);
  const [blockedDates, setBlockedDates]             = useState([]);
  const [blockedTimes, setBlockedTimes]             = useState([]);
  const [loading, setLoading]                       = useState(false);
  const [editingUser, setEditingUser]               = useState(null);
  const [editingBooking, setEditingBooking]         = useState(null);
  const [selectedUser, setSelectedUser]             = useState(null);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [newBlockedDate, setNewBlockedDate]         = useState({ date: "", reason: "" });
  const [newBlockedTime, setNewBlockedTime]         = useState({ date: "", startTime: "", endTime: "", reason: "" });
  const [banLoading, setBanLoading]                 = useState(null); // userId aki éppen ban alatt van

  // sort directions
  const [bookingSortDir, setBookingSortDir] = useState("asc");
  const [userSortDir,    setUserSortDir]    = useState("asc");
  const [bdSortDir,      setBdSortDir]      = useState("asc");
  const [btSortDir,      setBtSortDir]      = useState("asc");

  const isAdmin = userData?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      Promise.all([fetchUsers(), fetchAllBookings()]).finally(() => setLoading(false));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === "settings") {
      fetchBlockedDates();
      fetchBlockedTimes();
    }
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchAllBookings()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchAllBookings = async () => {
    const snap = await getDocs(collection(db, "bookings"));
    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => b.status === "booked" && !b.blocked);
    setBookings(all);
  };

  const fetchBlockedDates = async () => {
    const snap = await getDocs(collection(db, "blockedDates"));
    setBlockedDates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchBlockedTimes = async () => {
    const snap = await getDocs(collection(db, "blockedTimes"));
    setBlockedTimes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const upcoming  = bookings.filter((b) => !isCompleted(b));
    const completed = bookings.filter((b) =>  isCompleted(b));
    const noshow    = completed.filter((b) => isNoShow(b));
    const attended  = completed.filter((b) => !isNoShow(b));
    return {
      totalUsers: users.length,
      upcoming:   upcoming.length,
      completed:  completed.length,
      noshow:     noshow.length,
      attended:   attended.length,
    };
  }, [bookings, users]);

  // ── Sorted booking lists ───────────────────────────────────────────────────

  const upcomingBookings = useMemo(() => {
    const list = bookings.filter((b) => !isCompleted(b));
    return [...list].sort((a, b) => {
      const da = `${a.date} ${a.time}`, db2 = `${b.date} ${b.time}`;
      return bookingSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [bookings, bookingSortDir]);

  const completedBookings = useMemo(() => {
    const list = bookings.filter((b) => isCompleted(b));
    return [...list].sort((a, b) => {
      const da = `${a.date} ${a.time}`, db2 = `${b.date} ${b.time}`;
      return bookingSortDir === "asc" ? da.localeCompare(db2) : db2.localeCompare(da);
    });
  }, [bookings, bookingSortDir]);

  // ── Sorted users ───────────────────────────────────────────────────────────

  const sortedUsers = useMemo(() =>
    [...users].sort((a, b) => {
      const an = (a.name || a.email || "").toLowerCase();
      const bn = (b.name || b.email || "").toLowerCase();
      return userSortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
    }),
    [users, userSortDir]
  );

  // ── Blocked dates filtered + sorted ───────────────────────────────────────

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

  // ── Blocked times filtered + sorted ───────────────────────────────────────

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

  // ── Attendance ─────────────────────────────────────────────────────────────

  const updateAttendance = async (bookingId, value) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { attended: value });
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, attended: value } : b));
    } catch (err) {
      alert("Hiba a részvétel rögzítésekor: " + err.message);
    }
  };

  // ── Ban / Unban ────────────────────────────────────────────────────────────

  const handleBan = async (userId, currentBanned) => {
    const action = currentBanned ? "feloldod a tiltást" : "letiltod ezt a felhasználót";
    if (!window.confirm(`Biztosan ${action}?`)) return;

    setBanLoading(userId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ banned: !currentBanned }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, banned: !currentBanned } : u)
      );
      toast.success(!currentBanned ? "Felhasználó letiltva. Nem tud foglalni." : "Tiltás feloldva.");
    } catch (err) {
      toast.error("Hiba: " + err.message);
    } finally {
      setBanLoading(null);
    }
  };

  // ── User ops ───────────────────────────────────────────────────────────────

  const deleteUser = async (userId) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a felhasználót?")) return;
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    fetchUsers();
  };

  const updateUser = async (userId, updatedData) => {
    const { id, ...toUpdate } = updatedData;
    try {
      const originalUser = users.find((u) => u.id === userId);
      const emailChanged = originalUser && originalUser.email !== toUpdate.email;

      if (emailChanged) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/email`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: toUpdate.email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const { email, ...restToUpdate } = toUpdate;
        if (Object.keys(restToUpdate).length > 0) {
          await updateDoc(doc(db, "users", userId), restToUpdate);
        }
      } else {
        await updateDoc(doc(db, "users", userId), toUpdate);
      }

      setEditingUser(null);
      fetchUsers();
      alert("✅ Felhasználó sikeresen mentve!");
    } catch (err) {
      alert("❌ Hiba a mentés során: " + err.message);
    }
  };

  // ── Booking ops ────────────────────────────────────────────────────────────

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a foglalást?")) return;
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}?notify=false`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Visszamondod ezt a foglalást? A vendég emailt kap.")) return;
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings/${bookingId}?notify=true`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const [isSaving, setIsSaving] = useState(false);

  const updateBooking = async (bookingId, updatedData) => {
    const { id, createdAt, ...toUpdate } = updatedData;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "bookings", bookingId), toUpdate);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, ...toUpdate } : b));
      setEditingBooking(null);
      alert("✅ Foglalás sikeresen mentve!");
    } catch (err) {
      alert("❌ Hiba a mentés során: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Blocked date/time ops ──────────────────────────────────────────────────

  const addBlockedDate = async () => {
    if (!newBlockedDate.date) { alert("Kérlek válassz dátumot!"); return; }
    if (blockedDates.find((bd) => bd.date === newBlockedDate.date)) { alert("Ez a dátum már blokkolva van!"); return; }
    await addDoc(collection(db, "blockedDates"), {
      date: newBlockedDate.date, reason: newBlockedDate.reason || "Szabadnap", createdAt: new Date(),
    });
    setShowBlockDateModal(false);
    setNewBlockedDate({ date: "", reason: "" });
    fetchBlockedDates();
  };

  const deleteBlockedDate = async (dateId) => {
    if (!window.confirm("Törlöd ezt a szabadnapot?")) return;
    await deleteDoc(doc(db, "blockedDates", dateId));
    fetchBlockedDates();
  };

  const addBlockedTime = async () => {
    if (!newBlockedTime.date || !newBlockedTime.startTime || !newBlockedTime.endTime) {
      alert("Kérlek töltsd ki az összes mezőt!"); return;
    }
    if (newBlockedTime.startTime >= newBlockedTime.endTime) {
      alert("A kezdő időpontnak kisebbnek kell lennie!"); return;
    }
    await addDoc(collection(db, "blockedTimes"), {
      ...newBlockedTime, reason: newBlockedTime.reason || "Blokkolt időszak", createdAt: new Date(),
    });
    setShowBlockTimeModal(false);
    setNewBlockedTime({ date: "", startTime: "", endTime: "", reason: "" });
    fetchBlockedTimes();
  };

  const deleteBlockedTime = async (timeId) => {
    if (!window.confirm("Törlöd ezt a blokkolt időszakot?")) return;
    await deleteDoc(doc(db, "blockedTimes", timeId));
    fetchBlockedTimes();
  };

  const runCleanup = async () => {
    if (!window.confirm("Törlöd az összes lejárt foglalást és blokkolt napot?")) return;
    setLoading(true);
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cleanup`, { method: "POST" });
    const data = await res.json();
    alert(`Cleanup kész! Törölt: ${data.total} rekord`);
    fetchData();
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

  const bookingList = bookingSubTab === "upcoming" ? upcomingBookings : completedBookings;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Üdv, {userData?.name}!</p>
      </div>

      {/* ── Stat kártyák ── */}
      <div className="stats-row">
        <StatCard emoji="👥" label="Felhasználók"   value={stats.totalUsers} color="#818cf8" />
        <StatCard emoji="⏳" label="Közelgő"        value={stats.upcoming}   color="#34d399" />
        <StatCard
          emoji="📋" label="Lezajlott" value={stats.completed} color="#60a5fa"
          sub={`✅ ${stats.attended} megjelent  ·  ❌ ${stats.noshow} nem jelent meg`}
        />
        <StatCard emoji="❌" label="Nem jelent meg" value={stats.noshow} color="#f87171" />
      </div>

      {/* ── Főtabok ── */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
          <IoMdCalendar /> Foglalások
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
            {/* ══ FOGLALÁSOK ══ */}
            {activeTab === "bookings" && (
              <div className="admin-section">
                <div className="section-header"><h2>Foglalások</h2></div>

                <div className="sub-tabs-row">
                  <div className="sub-tabs">
                    <button className={`sub-tab ${bookingSubTab === "upcoming" ? "active" : ""}`} onClick={() => setBookingSubTab("upcoming")}>
                      ⏳ Közelgő <span className="tab-badge">{stats.upcoming}</span>
                    </button>
                    <button className={`sub-tab ${bookingSubTab === "completed" ? "active" : ""}`} onClick={() => setBookingSubTab("completed")}>
                      📋 Lezajlott <span className="tab-badge">{stats.completed}</span>
                    </button>
                  </div>
                  <SortBtn dir={bookingSortDir} onClick={() => setBookingSortDir(d => d === "asc" ? "desc" : "asc")} label="Dátum" />
                </div>

                {bookingSubTab === "completed" && (
                  <div className="completion-legend">
                    <span>Részvétel:</span>
                    <span>✅ Alapból megjelentnek számít</span>
                    <span>·</span>
                    <span className="legend-note">Ha nem jött el, kattints a gombra</span>
                  </div>
                )}

                {bookingList.length === 0 ? (
                  <p className="no-data">{bookingSubTab === "upcoming" ? "Nincs közelgő foglalás" : "Nincs lezajlott foglalás"}</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Dátum</th><th>Idő</th><th>Szolgáltatás</th><th>Időtartam</th>
                          <th>Név</th><th>Email</th><th>Telefon</th>
                          <th>Részvétel</th><th>Műveletek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingList.map((b) => (
                          <BookingRow key={b.id} booking={b}
                            onEdit={setEditingBooking} onCancel={cancelBooking}
                            onDelete={deleteBooking}   onAttendance={updateAttendance}
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
                          <th>Név</th><th>Email</th><th>Telefon</th>
                          <th>Szerepkör</th><th>Regisztráció</th>
                          <th>Közelgő</th><th>Lezajlott</th><th>Nem jelent meg</th><th>Visszamondás</th>
                          <th>Státusz</th>
                          <th>Műveletek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map((user) => {
                          const ub          = bookings.filter((b) => b.userId === user.id || b.userEmail === user.email);
                          const ubUpcoming  = ub.filter((b) => !isCompleted(b)).length;
                          const ubCompleted = ub.filter((b) =>  isCompleted(b)).length;
                          const ubNoshow    = ub.filter((b) =>  isCompleted(b) && isNoShow(b)).length;
                          const isBanned    = user.banned === true;
                          return (
                            <tr
                              key={user.id}
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
                              <td>
                                {ubNoshow > 0
                                  ? <span className="mini-badge mini-badge--noshow">❌ {ubNoshow}</span>
                                  : <span className="mini-badge">–</span>}
                              </td>
                              <td>
                                {(user.cancelCount || 0) > 0
                                  ? <span className="mini-badge mini-badge--cancel">🚫 {user.cancelCount}</span>
                                  : <span className="mini-badge">–</span>}
                              </td>
                              {/* ── Ban státusz ── */}
                              <td>
                                {isBanned
                                  ? <span className="mini-badge" style={{ background: "rgba(220,38,38,0.12)", color: "#b91c1c", fontWeight: 700 }}>🚫 Tiltva</span>
                                  : <span className="mini-badge" style={{ background: "rgba(34,197,94,0.1)", color: "#15803d", fontWeight: 600 }}>✅ Aktív</span>
                                }
                              </td>
                              <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-edit" onClick={() => setEditingUser(user)}><IoMdCreate /></button>
                                {/* ── Ban gomb ── */}
                                <button
                                  title={isBanned ? "Tiltás feloldása" : "Felhasználó letiltása"}
                                  disabled={banLoading === user.id}
                                  onClick={() => handleBan(user.id, isBanned)}
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: banLoading === user.id ? "not-allowed" : "pointer",
                                    fontSize: "14px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isBanned
                                      ? "linear-gradient(135deg, hsl(140,65%,45%), hsl(140,75%,50%))"
                                      : "linear-gradient(135deg, hsl(0,70%,55%), hsl(0,80%,60%))",
                                    color: "white",
                                    boxShadow: isBanned
                                      ? "0 2px 8px rgba(50,180,80,0.3)"
                                      : "0 2px 8px rgba(220,50,50,0.3)",
                                    opacity: banLoading === user.id ? 0.6 : 1,
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

                {/* Napok */}
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
                      <button className={`sub-tab ${blockedDateSubTab === "expired" ? "active" : ""}`} onClick={() => setBlockedDateSubTab("expired")}>
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

                {/* Időszakok */}
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
                      <button className={`sub-tab ${blockedTimeSubTab === "expired" ? "active" : ""}`} onClick={() => setBlockedTimeSubTab("expired")}>
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
    </div>
  );
};

export default AdminDashboard;