import BookingCalendar from "../components/BookingCalendar";
import InfoCard from "../components/InfoCard";
import { SectionTitle } from "./Sectiontitle";
import "./WaxingServices.css";
import SEO from "../components/SEO";

const waxingServices = [
  { name: "Bajusz",            price: 2000, icon: "💋" },
  { name: "Szemöldök",         price: 2000, icon: "✨" },
  { name: "Teljes arc",        price: 3000, icon: "🌸" },
  { name: "Hónalj",            price: 2000, icon: "🌺" },
  { name: "Kar",               price: 3500, icon: "💫" },
  { name: "Lábszár",           price: 4000, icon: "🌷" },
  { name: "Teljes láb",        price: 5000, icon: "🌹" },
  { name: "Hónalj és lábszár", price: 5000, icon: "💐" },
  { name: "Has",               price: 2000, icon: "🌼" },
];

const waxingBookingServices = [
  { id: "bajusz",         name: "Bajusz",            duration: 20 },
  { id: "szemoldok",      name: "Szemöldök",         duration: 20 },
  { id: "honalj",         name: "Hónalj",            duration: 20 },
  { id: "teljes_arc",     name: "Teljes arc",        duration: 30 },
  { id: "kar",            name: "Kar",               duration: 30 },
  { id: "labszar",        name: "Lábszár",           duration: 30 },
  { id: "honalj_labszar", name: "Hónalj és lábszár", duration: 50 },
  { id: "has",            name: "Has",               duration: 30 },
  { id: "teljes_lab",     name: "Teljes láb",        duration: 50 },
];
const WaxingServices = () => {
  return (
    <section className="waxing-section">
      <SEO
        title="Gyantázás – Szőrtelenítés"
        description="Professzionális gyantázás Kecskeméten. Bajusz, szemöldök, hónalj, kar, lábszár, teljes láb kezelések kedvező árakon. Online időpontfoglalás."
        canonical="/gyanta-foglalas"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Gyantázás – szőrtelenítés",
          "provider": { "@type": "BeautySalon", "name": "Colette Beauty" },
          "areaServed": "Kecskemét",
          "url": "https://colettebeauty.hu/gyanta-foglalas"
        }}
      />
      <div className="waxing-container">

        <SectionTitle
          badge="Szőrtelenítés"
          title="Gyantázás"
          lead="Sima bőr, tartós eredmény – minden alkalommal."
          sub="Kíméletes gyantázási módszerekkel dolgozom, amelyek a legérzékenyebb bőrtípusokra is megfelelők. Gyors, hatékony kezelés – hogy ne az előkészületek, hanem az eredmény maradjon meg benned."
        />

        <div className="waxing-content-wrapper">

          {/* ── Árlista ── */}
          <div className="waxing-pricelist-wrapper">
            <div className="waxing-pricelist-bg" />

            <div className="waxing-pricelist-outer">
              <div className="waxing-pricelist-inner">

                {/* Card inner header */}
                <div className="waxing-list-header">
                  <span className="waxing-list-header-ornament">— Szolgáltatások & Árak —</span>
                  <span className="waxing-list-header-title">Árlista</span>
                  <span className="waxing-list-header-sub">2026-os bevezető árak</span>
                </div>

                {/* Decorative separator */}
                <div className="waxing-sep">
                  <span className="waxing-sep-diamond">✦</span>
                </div>

                <ul className="waxing-list">
                  {waxingServices.map((service) => (
                    <li key={service.name} className="waxing-item">
                      <div className="waxing-item-content">

                        <div className="waxing-name-wrapper">
                          {service.icon && (
                            <span className="waxing-icon">{service.icon}</span>
                          )}
                          <span className="waxing-name">{service.name}</span>
                        </div>

                        {/* Dotted leader line */}
                        <span className="waxing-dots" />

                        <div className="waxing-price-wrapper">
                          <span className="waxing-price">
                            {service.price.toLocaleString("hu-HU")}
                          </span>
                          <span className="waxing-currency">Ft</span>
                        </div>

                      </div>
                    </li>
                  ))}
                </ul>

                {/* <p className="waxing-footer">
                  Az árak a kezelés időtartamát és a kezelt területet is befolyásolhatják.
                </p> */}

              </div>
            </div>
          </div>

          {/* ── Foglalási naptár ── */}
          <div className="waxing-booking-wrapper">
            <BookingCalendar services={waxingBookingServices} />
            <InfoCard />
          </div>

        </div>
      </div>
    </section>
  );
};

export default WaxingServices;