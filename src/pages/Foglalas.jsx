import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "../firabse/FireBaseConfig";
import { useNavigate } from "react-router-dom";

export const Foglalas = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [service, setService] = useState("");
  const [error, setError] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const navigate = useNavigate();
  const serviceDuration = {
    szempilla: 70,
    skincare: 130,
    smink: 160,
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8–17
  const minutes = ["00", "10", "20", "30", "40", "50"];

  // Naptár lapozás
  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  // Dátumok generálása
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startDay = startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const daysArray = [];
  for (let i = 1; i < startDay; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  const fetchSlots = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const q = query(collection(db, "bookings"), where("date", "==", dateStr));
    const snapshot = await getDocs(q);

    const booked = [];
    const blocked = [];

    snapshot.docs.forEach((doc) => {
      const { time, duration = 0, blocked: isBlocked } = doc.data();

      if (!time) {
        if (isBlocked) blocked.push("all-day");
        return;
      }

      const [startHour, startMin] = time.split(":").map(Number);
      let totalMin = 0;
      while (totalMin < duration) {
        const hour = startHour + Math.floor((startMin + totalMin) / 60);
        const min = (startMin + totalMin) % 60;
        const slot = `${hour}:${min.toString().padStart(2, "0")}`;
        if (isBlocked) blocked.push(slot);
        else booked.push(slot);
        totalMin += 10;
      }
    });

    setBookedSlots(booked);
    setBlockedSlots(blocked);
  };

  // Nap kiválasztásakor lekéri a slotokat
  useEffect(() => {
    if (!selectedDay) return;
    fetchSlots(selectedDay);
    setSelectedTime(null);
    setService("");
  }, [selectedDay]);

  const handleBooking = async () => {
    if (!service) {
      setError("Kérjük válassz szolgáltatást!");
      return;
    }
    if (!selectedTime || !selectedDay) return;

    const dateStr = selectedDay.toISOString().split("T")[0];
    await addDoc(collection(db, "bookings"), {
      date: dateStr,
      time: selectedTime,
      service,
      duration: serviceDuration[service],
      status: "booked",
    });

    alert(`Sikeres foglalás: ${dateStr} ${selectedTime} (${service})`);
    setShowPopup(false);
    setSelectedTime(null);
    setService("");
    fetchSlots(selectedDay); // frissítés után újra lekérjük
  };

  const selectedDayString = selectedDay
    ? selectedDay.toISOString().split("T")[0]
    : "";

  return (
    <section className="booking-wrapper">
      <div className="booking-card">
        <div className="booking-text">
          <h2>Foglalj időpontot</h2>
          <p>
            Válaszd ki a számodra megfelelő napot. Minden időpont prémium
            kezelés.
          </p>
        </div>

        <div className="calendar-box">
          <div className="calendar-header">
            <button onClick={prevMonth}>&lt;</button>
            <h3>
              {currentDate.toLocaleString("hu-HU", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button onClick={nextMonth}>&gt;</button>
          </div>

          <div className="calendar-grid">
            {["H", "K", "Sz", "Cs", "P", "Sz", "V"].map((n, idx) => (
              <div key={idx} className="calendar-dayname">{n}</div>
            ))}

            {daysArray.map((day, i) => {
              if (!day) return <div key={i} className="calendar-cell empty" />;
              const dayDate = new Date(year, month, day);
              return (
                <div
                  key={i}
                  className={`calendar-cell day ${
                    selectedDayString === dayDate.toISOString().split("T")[0]
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedDay(dayDate);
                    setShowPopup(true);
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showPopup && selectedDay && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <h3>Időpont – {selectedDay.toLocaleDateString("hu-HU")}</h3>

            <select
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setError("");
              }}
              className="service-select"
            >
              <option value="">Kérjük válassz</option>
              <option value="szempilla">Szempilla</option>
              <option value="skincare">Skincare</option>
              <option value="smink">Smink</option>
            </select>
            {error && <p className="error-text">{error}</p>}

            <div className="time-table">
              {hours.map((hour) => (
                <div key={hour} className="time-row">
                  {minutes.map((min) => {
                    const time = `${hour}:${min}`;
                    const isBooked = bookedSlots.includes(time);
                    const isBlocked = blockedSlots.includes(time);
                    return (
                      <button
                        key={time}
                        className={`time-cell slot ${
                          selectedTime === time ? "selected" : ""
                        } ${isBooked ? "booked" : ""} ${
                          isBlocked ? "blocked" : ""
                        }`}
                        disabled={isBooked || isBlocked}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              className="confirm-btn"
              disabled={!selectedTime}
              onClick={handleBooking}
            >
              Foglalás megerősítése
            </button>
          </div>
        </div>
      )}
      <button onClick={() => navigate("/adminfoglalas")}>Admin</button>
    </section>
  );
};
