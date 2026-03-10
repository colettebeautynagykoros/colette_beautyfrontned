import React, { useState, useEffect, useCallback } from "react";
import "./foglalasaim.css";
import { SectionTitle } from "./Sectiontitle";
import { useUser } from "../context/UserContext";
import { auth } from "../firabse/FireBaseConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// ─── Helpers ────────────────────────────────────────────────────────────────

const hoursUntil = (dateStr, timeStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const appt = new Date(y, m - 1, d, h, min);
  return (appt - Date.now()) / 36e5;
};

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

// bookingStatus: a DB-ből érkező status mező ("pending" | "booked" | undefined)
const statusOf = (dateStr, timeStr, bookingStatus) => {
  // Ha a backend "pending"-ként küldte, azt jelezzük – az időponttól függetlenül
  if (bookingStatus === "pending") return "pending";
  const h = hoursUntil(dateStr, timeStr);
  if (h < 0)  return "past";
  if (h < 24) return "locked";
  return "upcoming";
};

const statusLabel = {
  upcoming: { text: "Visszamondható",       cls: "status--upcoming" },
  locked:   { text: "Hamarosan",            cls: "status--locked"   },
  past:     { text: "Lezajlott",            cls: "status--past"     },
  pending:  { text: "Jóváhagyásra vár",     cls: "status--pending"  },
};

// ─── API helper ───────────────────────────────────────────────────────────────

const getAuthHeader = async () => {
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

// ─── Not Logged In State ──────────────────────────────────────────────────────

const NotLoggedInState = ({ onLogin }) => (
  <div className="foglalas-empty">
    <div className="foglalas-empty__icon">🔒</div>
    <h3 className="foglalas-empty__title">Bejelentkezés szükséges</h3>
    <p className="foglalas-empty__sub">
      A foglalásaid megtekintéséhez és kezeléséhez kérjük, jelentkezz be a fiókodba.
    </p>
    <button className="foglalas-empty__btn" onClick={onLogin}>
      Bejelentkezés
    </button>
  </div>
);

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────

const CancelModal = ({ booking, onConfirm, onClose, loading }) => {
  const isPending = booking.status === "pending";
  return (
    <div className="cancel-overlay" onClick={!loading ? onClose : undefined}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-modal__icon">{isPending ? "⏳" : "🌸"}</div>
        <h3 className="cancel-modal__title">
          {isPending ? "Kérelem visszavonása" : "Visszamondás megerősítése"}
        </h3>

        <p className="cancel-modal__body">
          {isPending
            ? "Biztosan vissza szeretnéd vonni a foglalási kérelmedet a"
            : "Biztosan vissza szeretnéd mondani a"}{" "}
          <strong>{booking.serviceName || booking.service}</strong>{" "}
          {isPending ? "szolgáltatásra?" : "foglalást?"}
        </p>
        <p className="cancel-modal__date">
          📅 {formatDate(booking.date)} – {booking.time}
        </p>
        <p className="cancel-modal__note">
          {isPending
            ? "⚠️ A kérelem visszavonása után ha újra szeretnél időpontot, foglalj újra az oldalon."
            : "⚠️ A visszamondás nem vonható vissza. Ha szeretnél új időpontot, foglalj újra az oldalon."}
        </p>

        <div className="cancel-modal__actions">
          <button className="cancel-modal__back" onClick={onClose} disabled={loading}>
            Mégsem, marad
          </button>
          <button
            className="cancel-modal__confirm"
            onClick={() => onConfirm(booking.id)}
            disabled={loading}
          >
            {loading ? (
              <span className="cancel-modal__loading-row">
                <span className="btn-spinner" />
                {isPending ? "Visszavonás..." : "Visszamondás..."}
              </span>
            ) : isPending ? (
              "Igen, visszavonom"
            ) : (
              "Igen, visszamondom"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Single Booking Card ──────────────────────────────────────────────────────

const BookingCard = ({ booking, onCancel, index }) => {
  const st = statusOf(booking.date, booking.time, booking.status);
  const { text, cls } = statusLabel[st];
  const hours = hoursUntil(booking.date, booking.time);

  return (
    <div
      className={`foglalas-card reveal foglalas-card--${st}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="foglalas-card__bar" />

      <div className="foglalas-card__body">
        <div className="foglalas-card__header">
          <span className={`foglalas-status ${cls}`}>{text}</span>
          {st === "locked" && hours > 0 && (
            <span className="foglalas-countdown">
              ⏳ {Math.ceil(hours)} órán belül
            </span>
          )}
        </div>

        <h3 className="foglalas-card__service">
          {booking.serviceName || booking.service}
        </h3>

        <div className="foglalas-card__details">
          <div className="foglalas-detail">
            <span className="foglalas-detail__icon">📅</span>
            <span>{formatDate(booking.date)}</span>
          </div>
          <div className="foglalas-detail">
            <span className="foglalas-detail__icon">🕐</span>
            <span>{booking.time}</span>
          </div>
          {booking.duration && (
            <div className="foglalas-detail">
              <span className="foglalas-detail__icon">⏱️</span>
              <span>{booking.duration} perc</span>
            </div>
          )}
          {booking.userName && (
            <div className="foglalas-detail">
              <span className="foglalas-detail__icon">👤</span>
              <span>{booking.userName}</span>
            </div>
          )}
          {booking.userPhone && (
            <div className="foglalas-detail">
              <span className="foglalas-detail__icon">📞</span>
              <span>{booking.userPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pending: tájékoztatás + visszavonás lehetősége */}
      {st === "pending" && (
        <div className="foglalas-card__footer foglalas-card__footer--pending">
          <p className="foglalas-pending-msg">
            ⏳ Jóváhagyásra vár – értesítünk emailben, amint megerősítjük.
          </p>
          <button
            className="foglalas-cancel-btn foglalas-cancel-btn--pending"
            onClick={() => onCancel(booking)}
          >
            Kérelem visszavonása
          </button>
        </div>
      )}

      {st === "upcoming" && (
        <div className="foglalas-card__footer">
          <button className="foglalas-cancel-btn" onClick={() => onCancel(booking)}>
            Visszamond
          </button>
        </div>
      )}

      {st === "locked" && (
        <div className="foglalas-card__footer">
          <span className="foglalas-locked-msg">
            🔒 24 órán belül nem mondható vissza
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Loading State ────────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="foglalas-empty">
    <div className="foglalas-empty__icon">⏳</div>
    <h3 className="foglalas-empty__title">Foglalások betöltése...</h3>
  </div>
);

// ─── Smart Empty State ────────────────────────────────────────────────────────

const EmptyState = ({ filter, totalCount, upcomingCount, pastCount }) => {
  if (totalCount === 0) {
    return (
      <div className="foglalas-empty">
        <div className="foglalas-empty__icon">🌷</div>
        <h3 className="foglalas-empty__title">Még nincsenek foglalásaid</h3>
        <p className="foglalas-empty__sub">
          Smink vagy szempilla időpontot a szolgáltatások oldalán foglalhatsz.
        </p>
        <a href="/#smink" className="foglalas-empty__btn">
          Foglalj most
        </a>
      </div>
    );
  }

  if (filter === "upcoming") {
    return (
      <div className="foglalas-empty">
        <div className="foglalas-empty__icon">📅</div>
        <h3 className="foglalas-empty__title">Nincs közelgő foglalásod</h3>
        <p className="foglalas-empty__sub">
          {pastCount > 0
            ? `${pastCount} lezajlott foglalásod megtalálható a „Lezajlott" fülön.`
            : "Ha szeretnél időpontot, foglalj a szolgáltatások oldalán."}
        </p>
        <a href="/#smink" className="foglalas-empty__btn">
          Foglalj most
        </a>
      </div>
    );
  }

  if (filter === "past") {
    if (upcomingCount > 0) {
      return (
        <div className="foglalas-empty">
          <div className="foglalas-empty__icon">🕐</div>
          <h3 className="foglalas-empty__title">Még nincs lezajlott foglalásod</h3>
          <p className="foglalas-empty__sub">
            {upcomingCount} közelgő foglalásod van – ezek a dátum lejártával
            automatikusan ide kerülnek.
          </p>
        </div>
      );
    }

    return (
      <div className="foglalas-empty">
        <div className="foglalas-empty__icon">✨</div>
        <h3 className="foglalas-empty__title">Még nem zajlott le foglalásod</h3>
        <p className="foglalas-empty__sub">
          A lezajlott foglalásaid majd itt jelennek meg.
        </p>
        <a href="/#smink" className="foglalas-empty__btn">
          Foglalj most
        </a>
      </div>
    );
  }

  return (
    <div className="foglalas-empty">
      <div className="foglalas-empty__icon">🌷</div>
      <h3 className="foglalas-empty__title">Nincs megjeleníthető foglalás</h3>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Foglalasaim = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [filter, setFilter]               = useState("upcoming");
  const [error, setError]                 = useState(null);

  // ── Foglalások lekérése ────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/user/bookings`, { headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Ismeretlen hiba");
      setBookings(data.bookings);
    } catch (err) {
      console.error("❌ Foglalások betöltési hiba:", err);
      setError("Nem sikerült betölteni a foglalásokat. Próbáld újra!");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [fetchBookings, user?.uid]);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [bookings]);

  // ── Visszamondás / visszavonás ─────────────────────────────────────────────
  const handleCancelConfirm = async (id) => {
    setCancelLoading(true);
    try {
      const headers = await getAuthHeader();
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/user/bookings/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();

      if (!data.success) {
        if (data.code === "TOO_LATE") {
          toast.error("Az időpont 24 órán belül van, visszamondás nem lehetséges.");
        } else {
          toast.error(data.message || "Hiba történt a visszamondás során.");
        }
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== id));
      setCancelTarget(null);

      const wasPending = cancelTarget?.status === "pending";
      toast.success(
        wasPending
          ? "Foglalási kérelem visszavonva."
          : "Foglalás sikeresen visszamondva! Megerősítő emailt küldtünk."
      );
    } catch (err) {
      console.error("❌ Visszamondási hiba:", err);
      toast.error("Hiba történt a visszamondás során. Kérjük, próbáld újra!");
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Szűrés + rendezés ──────────────────────────────────────────────────────
  const filtered = bookings.filter((b) => {
    const st = statusOf(b.date, b.time, b.status);
    if (filter === "upcoming") return st === "upcoming" || st === "locked" || st === "pending";
    if (filter === "past")     return st === "past";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return filter === "past" ? db - da : da - db;
  });

  const upcomingCount = bookings.filter((b) => {
    const st = statusOf(b.date, b.time, b.status);
    return st === "upcoming" || st === "locked" || st === "pending";
  }).length;

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const pastCount = bookings.filter((b) => statusOf(b.date, b.time, b.status) === "past").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => { if (!cancelLoading) setCancelTarget(null); }}
          loading={cancelLoading}
        />
      )}

      <div className="foglalasaim-page">
        <SectionTitle
          badge="Saját fiók"
          title="Foglalásaim"
          lead="Kövesd nyomon és kezeld az időpontjaidat."
          sub="Az időpontot legkésőbb 24 órával az időpont előtt mondhatod vissza."
        />

        {!user ? (
          <NotLoggedInState onLogin={() => navigate("/login")} />
        ) : (
          <>
            {/* Filter tabs */}
            <div className="foglalas-tabs reveal">
              {[
                { key: "upcoming", label: "Közelgő",  emoji: "📅" },
                { key: "past",     label: "Lezajlott", emoji: "✓"  },
                { key: "all",      label: "Összes",    emoji: "◉"  },
              ].map(({ key, label, emoji }) => (
                <button
                  key={key}
                  className={`foglalas-tab${filter === key ? " active" : ""}`}
                  onClick={() => setFilter(key)}
                >
                  <span>{emoji}</span> {label}
                  {key === "upcoming" && upcomingCount > 0 && (
                    <span className="tab-badge">{upcomingCount}</span>
                  )}
                  {key === "past" && pastCount > 0 && (
                    <span className="tab-badge">{pastCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Pending figyelmeztetés */}
            {pendingCount > 0 && filter !== "past" && (
              <div className="foglalas-pending-banner reveal">
                <span className="foglalas-pending-banner__icon">⏳</span>
                <div>
                  <strong>
                    {pendingCount} foglalásod jóváhagyásra vár.
                  </strong>
                  <p>
                    Értesítünk emailben, amint az admin megerősíti az időpontodat. Addig az időpont foglalva van tartva.
                  </p>
                </div>
              </div>
            )}

            {/* Hiba */}
            {error && (
              <div className="foglalas-error reveal">
                <p>{error}</p>
                <button onClick={fetchBookings}>Újra próbálom</button>
              </div>
            )}

            {/* Kártyák */}
            <section className="foglalas-list">
              {loading ? (
                <LoadingState />
              ) : sorted.length === 0 ? (
                <EmptyState
                  filter={filter}
                  totalCount={bookings.length}
                  upcomingCount={upcomingCount}
                  pastCount={pastCount}
                />
              ) : (
                sorted.map((b, i) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    index={i}
                    onCancel={setCancelTarget}
                  />
                ))
              )}
            </section>

            {/* Info box */}
            <div className="foglalas-info reveal">
              <div className="foglalas-info__icon">💬</div>
              <div>
                <strong>Kérdésed van a foglalásod kapcsán?</strong>
                <p>
                  Írj bátran Messengeren vagy e-mailben – igyekszem minél
                  hamarabb válaszolni.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Foglalasaim;