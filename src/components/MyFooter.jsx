import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import {
  MdEmail,
  MdPhone,
  MdFullscreen,
  MdClose,
  MdMap,
  MdCameraAlt,
} from "react-icons/md";
import { IoLocationSharp } from "react-icons/io5";

const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2706.0!2d19.7961!3d47.0261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4742f2e6d8c00001%3A0x1234abcd5678ef90!2sV%C3%A1ncsodi+u.+2%2C+Nagyk%C5%91r%C3%B6s%2C+2750!5e0!3m2!1shu!2shu!4v1700000000001!5m2!1shu!2shu";

const STREETVIEW_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1sMDOpNi7ODD3Gn3cGcN3yow!2m2!1d47.0259839!2d19.7983349!3f310.32!4f4.21!5f0.7820865974627469";

const MAP_LINK =
  "https://www.google.com/maps/place/V%C3%A1ncsodi+u.+2,+Nagyk%C5%91r%C3%B6s,+2750/@47.0259839,19.7983349,17z";

const overlayBtnBase = {
  background: "rgba(255,255,255,0.93)",
  border: "none",
  borderRadius: "6px",
  padding: "5px 10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontWeight: 600,
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  zIndex: 10,
  textDecoration: "none",
  color: "#333",
};

/* ─────────────────────────────────────────────────────────────────────────
   MapContainer
───────────────────────────────────────────────────────────────────────── */
const MapContainer = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [leftDuringDrag, setLeftDuringDrag] = useState(false);

  useEffect(() => {
    const resetDrag = () => {
      setIsDragging(false);
      setLeftDuringDrag(false);
    };

    document.addEventListener("mouseup", resetDrag);
    document.addEventListener("touchend", resetDrag, { passive: true });
    window.addEventListener("blur", resetDrag);
    window.addEventListener("mouseenter", resetDrag);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resetDrag();
    });

    return () => {
      document.removeEventListener("mouseup", resetDrag);
      document.removeEventListener("touchend", resetDrag);
      window.removeEventListener("blur", resetDrag);
      window.removeEventListener("mouseenter", resetDrag);
      document.removeEventListener("visibilitychange", resetDrag);
    };
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseLeave = (e) => {
    if (isDragging && e.buttons === 1) setLeftDuringDrag(true);
  };
  const handleCoverMouseMove = (e) => {
    if (e.buttons === 0) { setIsDragging(false); setLeftDuringDrag(false); }
  };
  const handleCoverMouseEnter = (e) => {
    if (e.buttons === 0) { setIsDragging(false); setLeftDuringDrag(false); }
  };
  const handleCoverMouseUp = () => {
    setIsDragging(false);
    setLeftDuringDrag(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", borderRadius: "10px", overflow: "hidden" }}
    >
      {children}
      {leftDuringDrag && (
        <div
          onMouseMove={handleCoverMouseMove}
          onMouseEnter={handleCoverMouseEnter}
          onMouseUp={handleCoverMouseUp}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            cursor: "grabbing",
            background: "transparent",
          }}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MyFooter
───────────────────────────────────────────────────────────────────────── */
export const MyFooter = () => {
  const [mapOpen, setMapOpen] = useState(false);
  const [viewMode, setViewMode] = useState("map");
  const navigate = useNavigate();

  const closeModal = useCallback(() => {
    setMapOpen(false);
    setViewMode("map");
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (mapOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mapOpen, closeModal]);

  useEffect(() => {
    if (!mapOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [mapOpen]);

  // Anchor linkek: görgess fel, majd ugorj a szekcióra
  const handleAnchorClick = (e, sectionId) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Route linkek (pl. /adatvedelem): görgess fel navigálás előtt
  const handleRouteClick = (e, path) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate(path);
  };

  const mainUrl = viewMode === "map" ? MAP_EMBED_URL : STREETVIEW_EMBED_URL;
  const thumbUrl = viewMode === "map" ? STREETVIEW_EMBED_URL : MAP_EMBED_URL;
  const thumbLabel = viewMode === "map" ? "Utcakép" : "Térkép nézet";
  const ThumbIcon = viewMode === "map" ? MdCameraAlt : MdMap;

  return (
    <>
      <div className="footer-wave-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>

      <footer className="luxury-footer">
        <div className="footer-glow" />

        <div className="footer-container">
          {/* Brand */}
          <div className="footer-column footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">✨</span>
              <h3>Colette Beauty</h3>
            </div>
            <p className="footer-tagline">
              "A szépség ott kezdődik, ahol eldöntöd, hogy önmagad leszel."
            </p>
            <div className="footer-social">
            
              <a
                href="https://www.facebook.com/colettebeautynagykoros/?locale=hu_HU"
                className="social-icon"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>
              <a
                href="mailto:colettebeautynagykoros@gmail.com"
                className="social-icon"
                aria-label="Email"
              >
                <MdEmail />
              </a>
            </div>
          </div>

          {/* Kapcsolat */}
          <div className="footer-column">
            <h4 className="footer-heading">Kapcsolat</h4>
            <div className="footer-links">
              <div className="contact-item">
                <IoLocationSharp className="contact-icon" />
                <div>
                  <p className="contact-label">Cím</p>
                  <a
                    href={MAP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      textDecoration: "underline dotted",
                    }}
                  >
                    2750 Nagykőrös, Váncsodi u. 2.
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <MdPhone className="contact-icon" />
                <div>
                  <p className="contact-label">Telefon</p>
                  <p>+36 20 399 0010</p>
                </div>
              </div>
              <div className="contact-item">
                <MdEmail className="contact-icon" />
                <div>
                  <p className="contact-label">Email</p>
                  <p>colettebeautynagykoros@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nyitvatartás */}
          <div className="footer-column">
            <h4 className="footer-heading">Nyitvatartás</h4>
            <div className="footer-links">
              <div className="hours-item">
                <span className="day">Hétfő – Péntek</span>
                <span className="time">09:00 - 17:00</span>
              </div>
              <div className="hours-item">
                <span className="day">Szombat</span>
                <span className="time">09:00 - 12:00</span>
              </div>
              <div className="hours-item closed">
                <span className="day">Vasárnap</span>
                <span className="time">Zárva</span>
              </div>
            </div>
          </div>

          {/* Linkek */}
          <div className="footer-column">
            <h4 className="footer-heading">Információk</h4>
            <div className="footer-links">
              <a
                href="/#szolgaltatasok"
                className="footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "instant" });
                  navigate("/");
                  setTimeout(() => {
                    const el = document.getElementById("szolgaltatasok");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Szolgáltatások
              </a>
              <a
                href="#idopont"
                className="footer-link"
                onClick={(e) => handleAnchorClick(e, "idopont")}
              >
                Időpontfoglalás
              </a>
              <a
                href="/adatvedelem"
                className="footer-link"
                onClick={(e) => handleRouteClick(e, "/adatvedelem")}
              >
                Adatvédelem
              </a>
              <a
                href="/aszf"
                className="footer-link"
                onClick={(e) => handleRouteClick(e, "/aszf")}
              >
                ÁSZF
              </a>
              <a
                href="/hazirend"
                className="footer-link"
                onClick={(e) => handleRouteClick(e, "/hazirend")}
              >
                Házirend
              </a>
            </div>
          </div>
        </div>

        {/* ── Footer bottom ── */}
        <div className="footer-bottom">
          <div className="footer-divider" />
          <p className="footer-copyright">
            © 2026 Colette Beauty. Minden jog fenntartva.
            <span className="heart-icon">💖</span>
          </p>
        </div>
      </footer>

      {/* ══════════ FULLSCREEN POPUP ══════════ */}
      {mapOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
            touchAction: "none",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "1100px",
              height: "min(85vh, 700px)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
            }}
          >
            {/* Fejléc */}
            <div
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e8e8e8",
                flexShrink: 0,
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "15px", color: "#333" }}>
                📍 Colette Beauty – Váncsodi u. 2, Nagykőrös
              </span>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                  }}
                >
                  <button
                    onClick={() => setViewMode("map")}
                    style={{
                      padding: "6px 12px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontWeight: 600,
                      fontSize: "13px",
                      transition: "all 0.2s",
                      background: viewMode === "map" ? "#1a73e8" : "#f8f8f8",
                      color: viewMode === "map" ? "#fff" : "#555",
                    }}
                  >
                    <MdMap size={16} /> Térkép
                  </button>
                  <button
                    onClick={() => setViewMode("street")}
                    style={{
                      padding: "6px 12px",
                      border: "none",
                      borderLeft: "1px solid #ddd",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontWeight: 600,
                      fontSize: "13px",
                      transition: "all 0.2s",
                      background: viewMode === "street" ? "#1a73e8" : "#f8f8f8",
                      color: viewMode === "street" ? "#fff" : "#555",
                    }}
                  >
                    <MdCameraAlt size={16} /> Utcakép
                  </button>
                </div>

                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#1a73e8",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontWeight: 600,
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  🗺️ Google Maps
                </a>

                <button
                  onClick={closeModal}
                  aria-label="Bezárás"
                  style={{
                    background: "#f1f1f1",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#555",
                  }}
                >
                  <MdClose size={22} />
                </button>
              </div>
            </div>

            <MapContainer>
              <iframe
                key={`popup-${viewMode}`}
                title={viewMode === "map" ? "Térkép" : "Utcakép"}
                src={viewMode === "map" ? MAP_EMBED_URL : STREETVIEW_EMBED_URL}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  display: "block",
                  flex: 1,
                  minHeight: "500px",
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </MapContainer>
          </div>
        </div>
      )}
    </>
  );
};