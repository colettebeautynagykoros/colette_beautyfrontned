import React, { useState } from "react";
import "./szempilla.css";
import BookingCalendar from "../components/BookingCalendar";
import SEO from "../components/SEO";
import { SectionTitle } from "./Sectiontitle";

const Szempilla = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const services = [
    {
      id: "1d",
      name: "1D Műszempilla",
      description:
        "Természetes megjelenés egy szál műszempilla applikációval. Tökéletes a diszkrét szépséghez.",
      price: "8000 Ft",
      refillPrice: "7000 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Természetes hatás",
        "Hétköznapi viselet",
        "Könnyű, kényelmes",
        "Ideális kezdőknek",
      ],
    },
    {
      id: "2d",
      name: "2D Műszempilla",
      description:
        "Elegáns térhatás két műszempilla szállal. Kifejezőbb tekintet természetes stílusban.",
      price: "9000 Ft",
      refillPrice: "7500 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Természetes dúsítás",
        "Kiemelt női tekintet",
        "Univerzális választás",
        "Tartós elegancia",
      ],
    },
    {
      id: "3d",
      name: "3D Műszempilla",
      description:
        "Látványos térhatás három szál applikálásával. Telt, dús szempillák bármilyen alkalomra.",
      price: "10.000 Ft",
      refillPrice: "8000 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Látványos dúsítás",
        "Glamour megjelenés",
        "Esküvők, rendezvények",
        "Kifejező pillantás",
      ],
    },
    {
      id: "4d",
      name: "4D Műszempilla",
      description:
        "Luxus kategória négy szállal az igazi drámai hatásért. Kiemelkedő dússág és térhatás.",
      price: "11.000 Ft",
      refillPrice: "9000 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Drámai megjelenés",
        "Extra dúsítás",
        "Fotózásokhoz ideális",
        "Luxus élmény",
      ],
    },
    {
      id: "5d",
      name: "5D Műszempilla",
      description:
        "Professzionális szint öt szál műszempillával. Maximális dússág és volumen.",
      price: "12.000 Ft",
      refillPrice: "10.000 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Maximális volumen",
        "Show-stopper hatás",
        "Prémium minőség",
        "Egyedi megjelenés",
      ],
    },
    {
      id: "6d",
      name: "6D Műszempilla",
      description:
        "A legkifinomultabb technika hat szállal. Hihetetlen dússág és luxus a csúcson.",
      price: "13.000 Ft",
      refillPrice: "11.000 Ft",
      durationNew: "180 perc",
      durationRefill: "120 perc",
      icon: "",
      features: [
        "Abszolút luxus",
        "Maximális látványosság",
        "VIP élmény",
        "Egyedi művészet",
      ],
    },
  ];
  const calendarServices = [
    // 1D
    { id: "1d_new", name: "1D Műszempilla – Új szett", duration: 180 },
    { id: "1d_refill", name: "1D Műszempilla – Töltés", duration: 120 },

    // 2D
    { id: "2d_new", name: "2D Műszempilla – Új szett", duration: 180 },
    { id: "2d_refill", name: "2D Műszempilla – Töltés", duration: 120 },

    // 3D
    { id: "3d_new", name: "3D Műszempilla – Új szett", duration: 180 },
    { id: "3d_refill", name: "3D Műszempilla – Töltés", duration: 120 },

    // 4D
    { id: "4d_new", name: "4D Műszempilla – Új szett", duration: 180 },
    { id: "4d_refill", name: "4D Műszempilla – Töltés", duration: 120 },

    // 5D
    { id: "5d_new", name: "5D Műszempilla – Új szett", duration: 180 },
    { id: "5d_refill", name: "5D Műszempilla – Töltés", duration: 120 },

    // 6D
    { id: "6d_new", name: "6D Műszempilla – Új szett", duration: 180 },
    { id: "6d_refill", name: "6D Műszempilla – Töltés", duration: 120 },

    // Leoldás
    { id: "leoldas", name: "Műszempilla leoldás", duration: 30 },
  ];

  const handleBooking = (service, type) => {
    setSelectedServiceId(`${service.id}_${type}`);
    setCalendarOpen(true);
  };

  return (
    <>
      <SEO
        title="Műszempilla felrakás"
        description="Professzionális műszempilla felrakás Kecskeméten. 1D, 2D, 3D, 4D és Mega Volume szempilla kezelések. Online időpontfoglalás."
        canonical="/szempilla"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Műszempilla felrakás",
          "provider": { "@type": "BeautySalon", "name": "Colette Beauty" },
          "areaServed": "Kecskemét",
          "url": "https://colettebeauty.hu/szempilla"
        }}
      />
      {" "}
      <BookingCalendar
        services={calendarServices}
        defaultService={selectedServiceId}
        open={calendarOpen}
        setOpen={setCalendarOpen}
      />
      <div className="szempilla-page">
        {/* Hero Section */}
        <SectionTitle
          badge="UV Technológia"
          title="Műszempilla"
          lead="Egy pillantás, ami magáért beszél."
          sub="UV technológiával épített műszempillák – azonnal vízállóak, tartósak és kíméletesek. Akár természetes, akár látványos megjelenést szeretnél, 1D-től 6D-ig segítek megtalálni a számodra tökéletes stílust."
        />

        {/* UV Technology Info */}
        <section className="uv-technology">
          <div className="technology-card">
            <div className="tech-icon">🔬</div>
            <h2>UV Technológia Előnyei</h2>
            <p className="tech-description">
              UV technológiával dolgozom, melynek köszönhetően a szempillák
              azonnal víz- és hőállóak, így rögtön mehetsz szaunába vagy
              fürdeni. A ragasztó kevésbé allergizál, tartós és kíméletes, az
              építés pedig 1D-től egészen 6D-ig elérhető, a természetestől a
              látványos hatásig.
            </p>
            <div className="tech-benefits">
<div className="benefit-item">
  <span className="benefit-icon"></span>
  <div>
    <h4>Azonnal víz- és hőálló</h4>
    <p>Rögtön fürdhetsz, szaunázhatsz – bármilyen körülmények között</p>
  </div>
</div>
              <div className="benefit-item">
                <span className="benefit-icon"></span>
                <div>
                  <h4>Kíméletes</h4>
                  <p>Kevésbé allergizáló ragasztó</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"></span>
                <div>
                  <h4>Tartós</h4>
                  <p>Hosszan élvezhető eredmény</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="services-section">
          <h2 className="section-title">Válaszd Ki az Ideális Stílust</h2>
          <p className="section-subtitle">
            A természetestől a látványosig – minden stílus elérhető
          </p>

          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <h3 className="service-name">{service.name}</h3>

                <div className="service-pricing">
                  <div className="price-row">
                    <span className="price-label">Új szett:</span>
                    <span className="price-value">{service.price}</span>
                  </div>
                  <div className="price-row refill">
                    <span className="price-label">Töltés:</span>
                    <span className="price-value">{service.refillPrice}</span>
                  </div>

                  <div className="duration">
                    <div>Új szett: {service.durationNew} ⏱️</div>
                  </div>
                  <div className="duration">
                    <div>Töltés: {service.durationRefill} ⏱️</div>
                  </div>
                </div>

                <div className="booking_button_div">
                  <button
                    className="booking-button2"
                    onClick={() => handleBooking(service, "refill")}
                  >
                    Töltés foglalás
                  </button>
                  <button
                    className="booking-button2"
                    onClick={() => handleBooking(service, "new")}
                  >
                    Új szett foglalás
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Offer */}
        <section className="special-offer">
          <div className="offer-card">
            <div className="offer-badge">Frissítsd fel a pilláid</div>
            <h2>Leoldás Szolgáltatás</h2>
            <p className="offer-description">
              Kíméletes leoldás speciális oldószerrel, a természetes pillák
              maximális védelméért.
            </p>
            <div className="offer-price">
              <span className="price-amount">2000 Ft</span>
            </div>
            <button
              className="booking-button offer-btn"
              onClick={() => {
                setSelectedServiceId("leoldas");
                setCalendarOpen(true);
              }}
            >
              Időpontfoglalás
            </button>
          </div>
        </section>

        {/* Guarantee Section */}
        <section className="guarantee-section">
          <div className="guarantee-content">
            <div className="guarantee-icon">✨</div>
            <h2>2 Hét Garancia</h2>
            <p>
              Minden egyes szettre 2 hét garanciát vállalok! Nyugodtan
              választhatsz, biztos kezekben vagy.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">Gyakran Ismételt Kérdések</h2>

          <div className="faq-grid">
            <div className="faq-card">
              <h4>
                ❓ Mit jelentenek a „D” jelölések a műszempilla-építésnél?
              </h4>
              <p>
                A „D” jelölés azt mutatja meg, hogy egy darab saját pillára hány
                műszempilla kerül felhelyezésre. Például: 2D → egy saját pillára
                2 műszempilla. Minél nagyobb a D szám, annál dúsabb,
                látványosabb lesz az elkészült szett. Fontos azonban, hogy a
                megfelelő D szám kiválasztásánál mindig figyelembe vesszük a
                vendég saját pilláinak állapotát. A túl nagy terhelés hosszú
                távon károsíthatja a pillákat, ezért a cél nemcsak a szép, hanem
                az egészséges és tartós végeredmény is.
              </p>
            </div>
            <div className="faq-card">
              <h4>⏱️ Mennyire tartós egy szett?</h4>
              <p>
                Egy műszempilla szett átlagosan 3–4 hétig tartós, azonban ez
                egyénenként eltérhet. Fontos tudni, hogy a műszempillák a saját
                pillákkal együtt hullanak ki, ami teljesen természetes folyamat.
                Ezért ajánlott a töltés 3 hetente elvégezni. Amennyiben a vendég
                az 5. hét környékén érkezik vissza, és a pillák több mint 50%-a
                már kihullott, azt a szettet új építésnek tekintjük, mivel
                ilyenkor már nem töltésről beszélünk. A rendszeres töltés
                nemcsak esztétikusabb, hanem a saját pillák egészségét is segít
                megőrizni.
              </p>
            </div>
            <div className="faq-card">
              <h4>💧 Mikor érheti víz a pillámat az építés után?</h4>
              <p>
                UV technikával épített műszempilla esetén a szettet szinte
                azonnal érheti víz. Ennek oka, hogy az UV ragasztó fény hatására
                azonnal megköt, így nincs szükség hosszú száradási időre.
              </p>
            </div>

            <div className="faq-card">
              <h4>🌿 Mennyire allergizál az UV ragasztó?</h4>
              <p>
                Az UV ragasztó kevésbé allergizál, mint a hagyományos ragasztó.
                Gyors kötése miatt kevesebb ragasztógőz éri a szemet, így
                kíméletesebb és komfortosabb viseletet biztosít.
              </p>
            </div>

            <div className="faq-card">
              <h4>
                💄 Továbbra is használhatok sminket a műszempilla mellett?
              </h4>
              <p>
                Igen, műszempilla mellett is használható smink, azonban olajos
                smink lemosók nem használhatók, mert gyengítik a ragasztást. Ez
                érvényes az arcápolási termékekre is.
              </p>
            </div>

            <div className="faq-card">
              <h4>🎨 Melyik stílust válasszam?</h4>
              <p>
                A legegyszerűbb válasz: amelyik igazán tetszik neked. Szempilla
                stylistként természetesen segítek kiválasztani a szemformádhoz
                legjobban illő stílust, valamint a saját pilláidhoz megfelelő
                dússágot és hosszúságot. Ugyanakkor a legfontosabb szempont
                mindig az, hogy jól érezd magad a választott szettben.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className="cta-section">
        <div className="cta-content">
          <h2>Készen Állsz a Gyönyörű Pillantásra?</h2>
          <p>
            Foglalj időpontot most és tapasztald meg az UV technológia előnyeit!
          </p>
          <button className="cta-button">Időpontfoglalás Most</button>
        </div>
      </section> */}
      </div>
    </>
  );
};

export default Szempilla;
