// ===================================================================
// BOOKING CALENDAR - TELJES JSX custom dropdown-nal
// Szerver idő alapú időpont validáció (Europe/Budapest, DST-biztos)
// ===================================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firabse/FireBaseConfig";
import "./BookingCalendar.css";
import { IoMdClose } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";

const SLOT_MINUTES = 10;
const BUFFER_MINUTES = 10;
const BOOKING_BUFFER_MINUTES = 10; // ennyi perccel az aktuális idő előtt nem foglalható

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ─── Hungarian timezone helpers ─────────────────────────────────────────────

/**
 * A szerver timestamp (UTC ms) alapján visszaadja a Budapest
 * szerinti aktuális időt percben (óra*60 + perc) és a dátumot.
 * Az Intl API kezeli a DST átállást is.
 */
const getBudapestNow = (serverNowMs) => {
  const d = new Date(serverNowMs);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parseInt(parts.find((p) => p.type === type).value);

  return {
    dateStr: `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")}`,
    totalMinutes: get("hour") * 60 + get("minute"),
  };
};

/**
 * Egy adott dátum+időpont slot le van-e tiltva mert az aktuális
 * Budapest idő + 10 percen belül van?
 */
const isSlotTooSoon = (dateStr, timeStr, serverNowMs) => {
  const bp = getBudapestNow(serverNowMs);

  if (dateStr > bp.dateStr) return false; // jövőbeli nap → mindig ok
  if (dateStr < bp.dateStr) return true; // múltbeli nap → mindig blokkolt

  // Ugyanaz a nap → perc-szintű összehasonlítás
  const [h, m] = timeStr.split(":").map(Number);
  const slotMinutes = h * 60 + m;
  return slotMinutes <= bp.totalMinutes + BOOKING_BUFFER_MINUTES;
};

// ─── Working hours ────────────────────────────────────────────────────────────

const getWorkingHours = (date) => {
  if (!date) return null;
  const day = date.getDay();
  if (day === 0) return null;
  if (day === 6) return { startHour: 9, endHour: 12, endMinute: 0 };
  return { startHour: 9, endHour: 17, endMinute: 0 };
};

const getHoursForDay = (date) => {
  const wh = getWorkingHours(date);
  if (!wh) return [];
  const hours = [];
  for (let h = wh.startHour; h < wh.endHour; h++) {
    if (h !== 12) hours.push(h);
  }
  return hours;
};

// ─── Component ────────────────────────────────────────────────────────────────

const BookingCalendar = ({
  services = [],
  defaultService = null,
  open = null,
  setOpen,
}) => {
  const { user, userData, isAuthenticated } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [service, setService] = useState("");
  const [error, setError] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Szerver idő kezelése – eltolás a kliens Date.now()-hoz képest
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // ms
  const serverOffsetRef = useRef(0);

  const popupRef = useRef(null);
  const calendarRef = useRef(null);
  const dropdownRef = useRef(null);

  // ── Szerver idő lekérése ─────────────────────────────────────────────────

  const fetchServerTime = async () => {
    try {
      const before = Date.now();
      const res = await fetch(`${BACKEND_URL}/api/time`);
      const after = Date.now();
      const data = await res.json();
      if (!data.success) return;

      // Hálózati késés felét levonjuk a pontosság érdekében
      const latency = (after - before) / 2;
      const offset = data.timestamp + latency - Date.now();
      setServerTimeOffset(offset);
      serverOffsetRef.current = offset;
    } catch (err) {
      console.warn(
        "Nem sikerült lekérni a szerver időt, kliens időt használunk:",
        err,
      );
    }
  };

  // Pontos aktuális idő (szerver alapú)
  const getServerNowMs = () => Date.now() + serverOffsetRef.current;

  useEffect(() => {
    fetchServerTime();
    // Percenként frissítjük az offsetet, hogy hosszú session esetén se csússzon el
    const interval = setInterval(fetchServerTime, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────

  const getAuthError = () => {
    if (!isAuthenticated) return "A foglaláshoz be kell jelentkezned!";
    if (!userData?.email)
      return "A foglaláshoz email cím szükséges. Kérjük frissítsd a profilodat!";
    if (!userData?.phone)
      return "A foglaláshoz telefonszám szükséges. Kérjük frissítsd a profilodat!";
    return null;
  };

  // ── Blokkolt dátumok / időszakok ─────────────────────────────────────────

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blocked-dates`);
      const data = await response.json();
      if (data.success) setBlockedDates(data.blockedDates);
    } catch (error) {
      console.error("Hiba a blokkolt datumok betoltesekor:", error);
    }
  };

  const fetchBlockedTimes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "blockedTimes"));
      const times = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBlockedTimes(times);
    } catch (error) {
      console.error("Hiba a blokkolt idopontok betoltesekor:", error);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
    fetchBlockedTimes();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const overlapsWithExistingBooking = (startTime, duration) => {
    const start = timeToMinutes(startTime);
    const end = start + duration;
    return blockedSlots.some((blockedTime) => {
      const blockedStart = timeToMinutes(blockedTime) - BUFFER_MINUTES;
      const blockedEnd =
        timeToMinutes(blockedTime) + SLOT_MINUTES + BUFFER_MINUTES;
      return start < blockedEnd && end > blockedStart;
    });
  };

  const overlapsWithBlockedTime = (date, startTime, duration) => {
    const dateStr = formatDate(date);
    const relevantBlocks = blockedTimes.filter((bt) => bt.date === dateStr);
    if (relevantBlocks.length === 0) return false;
    const start = timeToMinutes(startTime);
    const end = start + duration;
    return relevantBlocks.some((block) => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return start < blockEnd && end > blockStart;
    });
  };

  const roundTo10 = (time) => {
    const [h, m] = time.split(":").map(Number);
    const rounded = Math.round(m / 10) * 10;
    const hourFix = rounded === 60 ? h + 1 : h;
    const minFix = rounded === 60 ? 0 : rounded;
    return `${String(hourFix).padStart(2, "0")}:${String(minFix).padStart(2, "0")}`;
  };

  // ── Naptár ────────────────────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const minutes = ["00", "10", "20", "30", "40", "50"];
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  const buildCalendarDays = () => {
    const result = [];
    let firstCol = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0) {
        firstCol = dow - 1;
        break;
      }
    }
    for (let i = 0; i < firstCol; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0) result.push(d);
    }
    return result;
  };
  const daysArray = buildCalendarDays();

  // ── Foglalt slotok lekérése ───────────────────────────────────────────────

  const fetchSlots = async (date) => {
    const dateStr = formatDate(date);
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings/${dateStr}`);
      const data = await response.json();
      if (!data.success) return;

      const booked = [];
      const blocked = [];

      data.bookings.forEach((booking) => {
        const { time, duration } = booking;
        let [h, m] = time.split(":").map(Number);
        let used = 0;
        while (used < duration) {
          const slot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          blocked.push(slot);
          m += SLOT_MINUTES;
          if (m >= 60) {
            m = 0;
            h++;
          }
          used += SLOT_MINUTES;
        }
        booked.push(time);
      });

      const relevantBlockedTimes = blockedTimes.filter(
        (bt) => bt.date === dateStr,
      );
      relevantBlockedTimes.forEach((block) => {
        let startMinutes = timeToMinutes(block.startTime);
        const endMinutes = timeToMinutes(block.endTime);
        while (startMinutes < endMinutes) {
          const h = Math.floor(startMinutes / 60);
          const m = startMinutes % 60;
          const slot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (!blocked.includes(slot)) blocked.push(slot);
          startMinutes += SLOT_MINUTES;
        }
      });

      setBookedSlots(booked);
      setBlockedSlots(blocked);
    } catch (error) {
      console.error("Hiba a foglalasok betoltesekor:", error);
    }
  };

  useEffect(() => {
    if (!selectedDay) return;
    fetchSlots(selectedDay);
    setSelectedTime(null);
  }, [selectedDay, blockedTimes]);

  useEffect(() => {
    if (defaultService) setService(defaultService);
  }, [defaultService]);

  useEffect(() => {
    if (open === true && defaultService) setService(defaultService);
    if (open === false) {
      setSelectedDay(null);
      setSelectedTime(null);
      setShowPopup(false);
      setError("");
      setDropdownOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isSubmitting) return; // ← foglalás közben ne csukjon be semmi
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (showPopup) {
        if (popupRef.current && !popupRef.current.contains(e.target))
          setShowPopup(false);
        return;
      }
      if (open !== null) {
        if (calendarRef.current && !calendarRef.current.contains(e.target))
          setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, showPopup, isSubmitting]); // ← isSubmitting hozzáadva

  // ── Foglalás küldése ──────────────────────────────────────────────────────

  const handleBooking = async () => {
    if (isSubmitting) return;

    const authError = getAuthError();
    if (authError) {
      toast.error(authError);
      return;
    }
    if (!service) {
      setError("Kérjük válassz szolgáltatást!");
      return;
    }
    if (!selectedTime || !selectedDay) return;

    const roundedTime = roundTo10(selectedTime);
    const dateStr = formatDate(selectedDay);
    const selectedService = services.find((s) => s.id === service);

    if (!selectedService || !selectedService.duration) {
      setError("Érvénytelen szolgáltatás! Kérjük válassz újra.");
      setService("");
      return;
    }

    const duration = selectedService.duration;

    // Szerver idő alapú validáció – nem lehet az aktuális időnél 10 percnél
    // közelebb foglalni (device clock manipuláció ellen)
    if (isSlotTooSoon(dateStr, roundedTime, getServerNowMs())) {
      toast.error(
        "Ez az időpont már nem foglalható (túl közel van a jelenlegi időponthoz)!",
      );
      setSelectedTime(null);
      return;
    }

    if (blockedSlots.includes(roundedTime)) {
      toast.error("Ez az időpont már foglalt!");
      return;
    }
    if (overlapsWithBlockedTime(selectedDay, roundedTime, duration)) {
      toast.error("Ez az időpont blokkolt!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          time: roundedTime,
          duration,
          service,
          serviceName: selectedService.name,
          userId: user?.uid || null,
          userName: userData?.name || "Vendég",
          userEmail: userData?.email || "",
          userPhone: userData?.phone || "",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.code === "ALREADY_BOOKED") {
          toast.error(
            "Ez az időpont közben már foglalttá vált. Kérjük válassz másik időpontot!",
          );
          fetchSlots(selectedDay);
        } else {
          toast.error(data.message || "Hiba tortent a foglalas soran");
        }
        return;
      }

      toast.success("Sikeres foglalás!");
      setShowPopup(false);
      setSelectedTime(null);
      setService("");
      fetchSlots(selectedDay);
      if (open !== null) setOpen(false);
    } catch (error) {
      console.error("Hiba a foglalas soran:", error);
      toast.error("Hiba tortent a foglalas soran!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseClick = () => {
    if (isSubmitting) return; // ← foglalás közben ne lehessen bezárni
    setShowPopup(false);
    setDropdownOpen(false);
    setOpen(false);
  };

  const handleDayClick = (dayDate) => {
    const authError = getAuthError();
    if (authError) {
      toast.error(authError);
      return;
    }
    // Szerver idő lekérése frissítése napkijelöléskor
    fetchServerTime();
    setSelectedDay(dayDate);
    setDropdownOpen(false);
    setShowPopup(true);
  };

  const selectedDayString = selectedDay ? formatDate(selectedDay) : "";
  const hoursForSelectedDay = getHoursForDay(selectedDay);
  const selectedServiceObj = services.find((s) => s.id === service);

  useEffect(() => {
    if (open || showPopup) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open, showPopup]);

  useEffect(() => {
    const navbar = document.querySelector(".nav-header");
    const isOpen = open || showPopup;
    if (isOpen) {
      document.body.classList.add("modal-open");
      if (navbar && navbar.dataset.originalZ === undefined) {
        navbar.dataset.originalZ = navbar.style.zIndex || "";
        navbar.style.zIndex = "1";
      }
    } else {
      document.body.classList.remove("modal-open");
      if (navbar && navbar.dataset.originalZ !== undefined) {
        navbar.style.zIndex = navbar.dataset.originalZ;
        delete navbar.dataset.originalZ;
      }
    }
    return () => {
      const nav = document.querySelector(".nav-header");
      if (nav && nav.dataset.originalZ !== undefined) {
        nav.style.zIndex = nav.dataset.originalZ;
        delete nav.dataset.originalZ;
      }
      document.body.classList.remove("modal-open");
    };
  }, [open, showPopup]);

  /* ========================= POPUP TARTALOM ========================= */
  const popupContent =
    showPopup &&
    selectedDay &&
    createPortal(
      <div className="popup-overlay">
        <div ref={popupRef} className="popup">
          {open && (
            <button
              className="close-btn arrow popup-close"
              onClick={() => !isSubmitting && setShowPopup(false)}
              disabled={isSubmitting}
            >
              <IoArrowBack />
            </button>
          )}
          <button
            className="close-btn popup-close"
            onClick={handleCloseClick}
            disabled={isSubmitting}
          >
            <IoMdClose />
          </button>

          <h3 className="popup-title">
            Időpont – {selectedDay.toLocaleDateString("hu-HU")}
          </h3>

          {/* CUSTOM DROPDOWN */}
          <div className="service-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className={`service-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {selectedServiceObj ? (
                <span className="selected-label">
                  {selectedServiceObj.name}
                </span>
              ) : (
                <span className="placeholder">Válassz szolgáltatást</span>
              )}
              <svg
                className="dropdown-chevron"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="service-dropdown-list">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={`service-dropdown-option ${service === s.id ? "active" : ""}`}
                    onClick={() => {
                      setService(s.id);
                      setDropdownOpen(false);
                      setError("");
                      setSelectedTime(null);
                    }}
                  >
                    <span className="option-name">{s.name}</span>
                    <span className="option-duration">{s.duration} perc</span>
                    {service === s.id && (
                      <svg
                        className="option-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="time-table">
            {hoursForSelectedDay.map((hour) => (
              <div key={hour} className="time-row">
                {minutes.map((min) => {
                  const time = `${String(hour).padStart(2, "0")}:${min}`;
                  const isBooked = bookedSlots.includes(time);
                  const isBlocked = blockedSlots.includes(time);

                  const currentService = services.find((s) => s.id === service);
                  const duration = currentService?.duration || 0;

                  const overlaps =
                    service && overlapsWithExistingBooking(time, duration);
                  const overlapsBlocked =
                    service &&
                    overlapsWithBlockedTime(selectedDay, time, duration);
                  const serviceSelected = !!service;

                  // Szerver idő alapú múltbeli / 10 percen belüli blokkolás
                  const tooSoon = isSlotTooSoon(
                    selectedDayString,
                    time,
                    getServerNowMs(),
                  );

                  const isDisabled =
                    !serviceSelected ||
                    isBooked ||
                    isBlocked ||
                    overlaps ||
                    overlapsBlocked ||
                    tooSoon;

                  return (
                    <button
                      key={time}
                      className={`time-cell
                      ${selectedTime === time ? "selected" : ""}
                      ${isBooked ? "booked" : ""}
                      ${!serviceSelected || isBlocked || overlaps || tooSoon ? "blocked" : ""}
                    `}
                      disabled={isDisabled}
                      onClick={() =>
                        serviceSelected && !isDisabled && setSelectedTime(time)
                      }
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            className={`confirm-btn ${isSubmitting ? "loading" : ""}`}
            disabled={!selectedTime || isSubmitting}
            onClick={handleBooking}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Foglalás folyamatban...
              </>
            ) : (
              "Foglalás megerősítése"
            )}
          </button>
        </div>
      </div>,
      document.body,
    );

  /* ========================= NAPTÁR TARTALOM ========================= */
  const calendarContent = (
    <div
      ref={calendarRef}
      className="booking-calendar-wrapper"
      style={open !== null ? { maxWidth: "fit-content" } : {}}
    >
      <div className="booking-calendar-card">
        {open !== null && (
          <button className="close-btn" onClick={handleCloseClick}>
            <IoMdClose />
          </button>
        )}

        <div className="booking-calendar-header">
          <h3 className="booking-calendar-title">Időpontfoglalás</h3>
          <p className="booking-calendar-subtitle">
            Válaszd ki a számodra megfelelő napot
          </p>
        </div>

        <div className="calendar-navigation">
          <button onClick={prevMonth} className="calendar-nav-btn">
            &lt;
          </button>
          <h4 className="calendar-month">
            {currentDate.toLocaleString("hu-HU", {
              month: "long",
              year: "numeric",
            })}
          </h4>
          <button onClick={nextMonth} className="calendar-nav-btn">
            &gt;
          </button>
        </div>

        <div className="calendar-grid">
          {["H", "K", "Sz", "Cs", "P", "Sz"].map((n, idx) => (
            <div key={idx} className="calendar-dayname">
              {n}
            </div>
          ))}

          {daysArray.map((day, i) => {
            if (!day) return <div key={i} className="calendar-cell empty" />;

            const dayDate = new Date(year, month, day);
            const dayDateStr = formatDate(dayDate);
            const isSelected = selectedDayString === dayDateStr;

            // Szerver idő alapján ellenőrzöm, hogy a nap múltban van-e
            const bp = getBudapestNow(getServerNowMs());
            const isPast = dayDateStr < bp.dateStr;
            const isToday = dayDateStr === bp.dateStr;
            const isBlocked = blockedDates.includes(dayDateStr);

            return (
              <div
                key={i}
                className={`calendar-cell day
      ${isSelected ? "selected" : ""}
      ${isPast || isToday ? "past" : ""}
      ${isBlocked ? "blocked-day" : ""}
      ${isToday ? "today" : ""}
    `}
                onClick={() => {
                  if (!isPast && !isToday && !isBlocked) handleDayClick(dayDate);
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ========================= RENDER ========================= */
  if (open !== null) {
    return createPortal(
      <div
        className={`${open === true ? "open" : open === false ? "close" : ""} ${
          !(selectedDay && showPopup) && open && "overlay"
        }`}
      >
        {calendarContent}
        {popupContent}
      </div>,
      document.body,
    );
  }

  return (
    <>
      {calendarContent}
      {popupContent}
    </>
  );
};

export default BookingCalendar;