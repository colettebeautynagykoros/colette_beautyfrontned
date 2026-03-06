import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../firabse/FireBaseConfig";

export const AdminFoglalas = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [timeInput, setTimeInput] = useState("");
  const [rangeError, setRangeError] = useState("");

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 08–17
  const minutes = ["00", "10", "20", "30", "40", "50"];

  /* ---------------- SEGÉDFÜGGVÉNY: HELYI DÁTUM FORMÁTUM ---------------- */
  const formatDateLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  /* ---------------- FETCH ---------------- */
  const fetchSlots = async () => {
    const snapshot = await getDocs(collection(db, "bookings"));

    setBlockedSlots(
      snapshot.docs
        .filter(d => d.data().blocked)
        .map(d => ({ id: d.id, ...d.data() }))
    );

    setBookedSlots(
      snapshot.docs
        .filter(d => d.data().status === "booked")
        .map(d => ({ id: d.id, ...d.data() }))
    );
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  /* ---------------- NAPTÁR ---------------- */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  const getWeekday = (date) => {
    const day = date.getDay(); // 0 = vasárnap
    return day === 0 ? 7 : day; // vasárnap = 7
  };

  const startDay = getWeekday(startOfMonth);
  const daysArray = Array(startDay - 1).fill(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  const toggleDay = (day) => {
    const dateStr = formatDateLocal(new Date(year, month, day));
    setSelectedDays(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  /* ---------------- IDŐTARTOMÁNY PARSER ---------------- */
  const parseTimeRange = () => {
    setRangeError("");

    if (!timeInput.includes("-")) {
      setRangeError("Add meg a teljes időtartamot");
      return [];
    }

    let [start, end] = timeInput.split("-");
    if (!start || !end) {
      setRangeError("Hibás időformátum (HH:MM)");
      return [];
    }

    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const roundDown10 = (m) => Math.floor(m / 10) * 10;
    const roundUp10 = (m) => Math.ceil(m / 10) * 10;

    let startMin = toMinutes(start);
    let endMin = toMinutes(end);

    if (startMin === null || endMin === null) {
      setRangeError("Hibás időformátum (HH:MM)");
      return [];
    }

    startMin = roundDown10(startMin);
    endMin = roundUp10(endMin);

    if (startMin > endMin) {
      setRangeError("A kezdés nem lehet nagyobb a végénél");
      return [];
    }

    if (startMin < 8 * 60) startMin = 8 * 60;
    if (endMin > 18 * 60) endMin = 18 * 60;

    const slots = [];
    for (let m = startMin; m <= endMin; m += 10) {
      const h = Math.floor(m / 60);
      const mm = String(m % 60).padStart(2, "0");
      slots.push(`${h}:${mm}`);
    }

    return slots;
  };

  /* ---------------- BLOKKOLÁS ---------------- */
  const blockSelected = async () => {
    if (selectedDays.length === 0) {
      setRangeError("Válassz legalább egy napot");
      return;
    }

    const slots = parseTimeRange();
    if (slots.length === 0) return;

    for (const day of selectedDays) {
      const existingTimes = blockedSlots
        .filter(s => s.date === day)
        .map(s => s.time)
        .concat(
          bookedSlots
            .filter(s => s.date === day)
            .map(s => s.time)
        );

      for (const time of slots) {
        if (!existingTimes.includes(time)) {
          await addDoc(collection(db, "bookings"), {
            date: day,
            time,
            blocked: true,
            user: null,
            service: null
          });
        }
      }
    }

    setTimeInput("");
    fetchSlots();
  };

  /* ---------------- BLOKKOK ÖSSZEVONÁSA ---------------- */
  const groupBlockedSlots = (slots) => {
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const byDay = {};
    slots.forEach(s => {
      if (!byDay[s.date]) byDay[s.date] = [];
      byDay[s.date].push(s);
    });

    const result = [];
    Object.entries(byDay).forEach(([date, daySlots]) => {
      const sorted = [...daySlots].sort((a, b) => toMin(a.time) - toMin(b.time));

      let rangeStart = sorted[0].time;
      let rangeIds = [sorted[0].id];

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (toMin(curr.time) === toMin(prev.time) + 10) {
          rangeIds.push(curr.id);
        } else {
          result.push({ date, start: rangeStart, end: prev.time, ids: rangeIds });
          rangeStart = curr.time;
          rangeIds = [curr.id];
        }
      }

      result.push({ date, start: rangeStart, end: sorted[sorted.length - 1].time, ids: rangeIds });
    });

    return result;
  };

  const groupedBlocked = groupBlockedSlots(blockedSlots);

  /* ---------------- BLOKK FELOLDÁS OPTIMALIZÁLT ---------------- */
  const unblockSlots = async (ids) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, "bookings", id)));
    await batch.commit();

    setBlockedSlots(prev => prev.filter(s => !ids.includes(s.id)));
  };

  /* ---------------- SZÍNEZÉS ---------------- */
  const getSlotColor = (time) => {
    if (selectedDays.length === 0) return "#f5f5f4";

    const states = selectedDays.map(day => {
      if (blockedSlots.some(s => s.date === day && s.time === time)) return "blocked";
      if (bookedSlots.some(s => s.date === day && s.time === time)) return "booked";
      return "free";
    });

    if (states.every(s => s === "blocked")) return "#18181b";
    if (states.every(s => s === "booked")) return "#a1a1aa";
    if (states.includes("booked")) return "#7c3aed";

    return "#e7e5e4";
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  /* ---------------- JSX ---------------- */
  return (
    <div className="admin-booking-wrapper">
      <h2>Admin – Időpont blokkolás</h2>

      {/* Naptár */}
      <div className="calendar-box">
        <div className="calendar-header">
          <button onClick={prevMonth}>&lt;</button>
          <h3>{currentMonth.toLocaleString("hu-HU", { month: "long", year: "numeric" })}</h3>
          <button onClick={nextMonth}>&gt;</button>
        </div>

        <div className="calendar-grid">
          {["H","K","Sz","Cs","P","Sz","V"].map((n,i) => (
            <div key={i} className="calendar-dayname">{n}</div>
          ))}
          {daysArray.map((day, i) => {
            if (!day) return <div key={i} className="calendar-cell empty" />;
            const dateStr = formatDateLocal(new Date(year, month, day));
            return (
              <div
                key={i}
                className={`calendar-cell day ${selectedDays.includes(dateStr) ? "selected" : ""}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Időtartomány */}
      <div className="time-range-inputs">
        <label>Blokkolás időtartam</label>
        <input
          type="text"
          placeholder="pl. 08:00-10:00"
          value={timeInput}
          onChange={e => setTimeInput(e.target.value)}
        />
        {rangeError && <span className="error-text">{rangeError}</span>}
      </div>

      {/* Táblázat – csak dísz */}
      <div className="time-table">
        {hours.map(hour => (
          <div key={hour} className="time-row">
            {minutes.map(min => {
              const time = `${hour}:${min}`;
              return (
                <div
                  key={time}
                  className="time-cell display-only"
                  style={{ backgroundColor: getSlotColor(time) }}
                >
                  {time}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button onClick={blockSelected}>Időtartomány blokkolása</button>

      {/* ÖSSZEVONT BLOKKOLÁSOK */}
      <h3>Jelenlegi blokkolások</h3>
      <ul className="blocked-list">
        {groupedBlocked.map((b, i) => (
          <li key={i} className="blocked-item">
            <strong>{b.date}</strong> {b.start} – {b.end}
            <button onClick={() => unblockSlots(b.ids)}>Feloldás</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
