import React, { useEffect, useRef, useState } from "react";
import "./smink.css";
import BookingCalendar from "../components/BookingCalendar";
import { SectionTitle } from "./Sectiontitle";

import sminkPhoto0 from "../assets/smincuccok.jpg";
import sminkPhoto1 from "../assets/alkalmismink.jpg";
import sminkPhoto2 from "../assets/smink3.png";
import { IoClose } from "react-icons/io5";

const Smink = () => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { src, alt }

  const openLightbox = (src, alt) => setLightbox({ src, alt });
  const closeLightbox = () => setLightbox(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const services = [
    {
      id: "alkalmi",
      name: "Alkalmi Smink",
      icon: "💄",
      description:
        "Professzionális alkalmi smink, amely harmonizál az egyéniségeddel és az elképzeléseiddel. Szalagavatóra, bálra, vagy bármilyen különleges alkalomra.",
      price: "8.000 Ft",
      duration: "60–90 perc",
      features: [],
      featured: false,
    },
    {
      id: "menyasszonyi",
      name: "Menyasszonyi Smink",
      icon: "👰",
      description:
        "A nagy napodra megérdemled a legjobbat. A csomag tartalmaz egy próbasminket is, hogy az esküvő napján biztosan tökéletes legyen az eredmény.",
      price: "20.000 Ft",
      duration: "90–120 perc",
      priceNote: "Próbasmink is benne van",
      features: [],
      featured: true,
    },
  ];

  const calendarServices = [
    { id: "alkalmi", name: "Alkalmi smink", duration: 90 },
    { id: "menyasszonyi_eskuvo", name: "Menyasszonyi smink – Esküvő", duration: 120 },
  ];

  const handleBooking = (serviceId) => {
    setSelectedServiceId(serviceId);
    setCalendarOpen(true);
  };

  return (
    <>
      <BookingCalendar
        services={calendarServices}
        defaultService={selectedServiceId}
        open={calendarOpen}
        setOpen={setCalendarOpen}
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Kép nagyítva"
        >
          <button
            className="close-btn"
            onClick={closeLightbox}
            aria-label="Bezárás"
          >
            <IoClose/>
          </button>
          <img
            className="lightbox-img"
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="smink-page">
        {/* Hero / Title */}
        <SectionTitle
          badge="Professzionális Smink"
          title="Smink"
          lead="Ragyogj a különleges pillanataidban."
          sub="2025-ben végeztem el a Professional Makeup Artist Basic képzést Trifont Évánál. Prémium termékekkel, személyre szabott stílussal varázslom szépnek a vendégeimet – legyen szó alkalmi vagy menyasszonyi sminkről."
        />

        {/* About Section */}
        <section className="smink-about reveal">
          <div className="about-inner">
            <div className="about-image-wrap">
              <img
                src={sminkPhoto0}
                alt="Professzionális smink eredmény"
              />
              <div className="about-image-overlay" />
            </div>

            <div className="about-text-wrap">
              <span className="about-badge">✨ Rólam</span>
              <h2 className="about-title">
                Szenvedélyem a szépség művészete
              </h2>
              <p className="about-text">
                A sminkelés régóta a szenvedélyem – számomra nincs is annál szebb
                pillanat, mint amikor a vendég belenéz a tükörbe, és felragyog a
                tekintete. Munkám során professzionális minőségű termékekkel
                dolgozom, és mindig arra törekszem, hogy a smink harmonizáljon az
                egyéniségeddel és az elképzeléseiddel.
              </p>
              <p className="about-text">
                Legyen szó visszafogott, természetes megjelenésről vagy
                hangsúlyosabb, alkalmi sminkről, a célom az, hogy magabiztosan és
                ragyogva érezd magad.
              </p>
              <div className="about-cert">
                <span className="cert-icon">🎓</span>
                <span>
                  Professional Makeup Artist Basic – Trifont Éva Make Up School,
                  2025
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="smink-gallery reveal">
          <h2 className="section-title">Munkáim</h2>
          <p className="section-subtitle">Néhány elkészült smink az utóbbi időből</p>
          <div className="gallery-wrapper">
            <div className="gallery-grid">
              <div
                className="gallery-item"
                onClick={() => openLightbox(sminkPhoto1, "Alkalmi smink")}
              >
                <img src={sminkPhoto1} alt="Alkalmi smink" />
                <div className="gallery-overlay" />
                <span className="gallery-tag">💄 Alkalmi</span>
                <span className="gallery-label">Alkalmi smink</span>
                <span className="gallery-zoom-hint">🔍</span>
              </div>
              {/* <div
                className="gallery-item"
                onClick={() => openLightbox(sminkPhoto2, "Menyasszonyi smink")}
                style={{ cursor: "zoom-in" }}
              >
                <img src={sminkPhoto2} alt="Menyasszonyi smink" />
                <div className="gallery-overlay" />
                <span className="gallery-tag">👰 Esküvői</span>
                <span className="gallery-label">Menyasszonyi smink</span>
                <span className="gallery-zoom-hint">🔍</span>
              </div> */}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="smink-services">
          <h2 className="section-title">Szolgáltatások & Árak</h2>
          <p className="section-subtitle">
            2026-os bevezető árak – foglalj most kedvező feltételekkel
          </p>

          <div className="services-grid">
            {services.map((service) => (
              <div
                key={service.id}
                className={`smink-card reveal${service.featured ? " featured" : ""}`}
              >
                {service.badge && (
                  <span className="card-badge">{service.badge}</span>
                )}

                <div className="card-icon">{service.icon}</div>
                <h3 className="card-name">{service.name}</h3>
                <p className="card-description">{service.description}</p>

                <div className="card-features">
                  {service.features.map((f, i) => (
                    <div className="feature-item" key={i}>
                      <span className="feature-check">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="card-pricing">
                  <span className="price-main">{service.price}</span>
                  {service.priceNote && (
                    <span className="price-note">✦ {service.priceNote}</span>
                  )}
                  <div className="card-duration">⏱️ {service.duration}</div>
                </div>

                <button
                  className="booking-button"
                  onClick={() => handleBooking(service.id)}
                >
                  Időpontfoglalás
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Guarantee */}
        <section className="smink-guarantee reveal">
          <div className="guarantee-content">
            <div className="guarantee-icon">💫</div>
            <h2>Prémium Termékek</h2>
            <p>
              Kizárólag professzionális, prémium minőségű kozmetikumokkal
              dolgozom. A smink fotóálló, tartós és kíméli a bőrt – hogy a
              különleges pillanataid valóban tökéletesek legyenek.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="smink-faq">
          <h2 className="section-title">Gyakran Ismételt Kérdések</h2>

          <div className="faq-grid">
            <div className="faq-card reveal">
              <h4>🌸 Kell-e valami különlegeset hoznom a sminkhez?</h4>
              <p>
                Nem szükséges semmit hoznod, mindennel rendelkezem. Ha van
                kedvenc terméked amit szívesen viselsz (pl. rúzs), azt természetesen
                felhasználhatjuk. A smink előtt ajánlott hidratált, smink nélküli
                bőrrel érkezni.
              </p>
            </div>

            <div className="faq-card reveal">
              <h4>🎨 Hogyan válasszam ki a stílust?</h4>
              <p>
                Foglalás előtt szívesen segítek meghatározni a számodra legjobban
                illő stílust. Hozz inspirációs képeket, vagy írj nekem az
                elképzeléseidről – közösen kitaláljuk a tökéletes megjelenést az
                alkalomhoz.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Smink;