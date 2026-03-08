import React, { useEffect } from "react";
import "./kozmetika.css";

import arcmasszas from "../assets/arcmasszas.PNG";
import gyulladas from "../assets/gyulladas.PNG";
import melytaplalo from "../assets/melytaplalo.jpg";
import anti_acne from "../assets/kollagen.png";
import kollagen from "../assets/anti_acne.png";
import energetizalo from "../assets/energetizalo.png";
import vio from "../assets/vio.png";
import hydro from "../assets/hydro.jpeg";

import { useState } from "react";
import BookingCalendar from "../components/BookingCalendar";
import { SectionTitle } from "./Sectiontitle";

const treatments = [
  {
    title: "Kollagénszálas arckezelés + carboxy terápia",
    price: "18 000 Ft",
    description:
      "A Carboxy kezelés oxigénnel tölti fel a bőrt, beindítja a keringést és látványosan felfrissíti az arcbőrt. Visszaállítja a bőr rugalmasságát, feltölti a mélyebb ráncokat, stimulálja a vérkeringést. Tökéletes alap és erős kiegészítő a kollagénszálas kezeléshez, így az eredmény még látványosabb.",
    image: kollagen,
    id: "kollagen_szalas_carboxy_terapia",
  },
  {
    title: "Kollagénszálas arckezelés",
    price: "15 000 Ft",
    description:
      "A kezelés során felszívódó, 1000 ppm kollagént tartalmazó kollagénszálakat alkalmazok, amelyek a ráncokba simulva teljesen beépülnek a bőrbe, hatékonyan halványítva még a mélyebb ráncokat is. A maximális hatás érdekében kollagénben gazdag szérumokkal, maszkkal és krémmel egészítem ki a kezelést, így a bőr kisimultabbá, feltöltöttebbé és ragyogóan hidratálttá válik.",
    image: kollagen,
    id: "kollagen_szalas",
  },
  {
    title: "HYDRO-CELL kezelés",
    price: "15 000 Ft",
    description:
      "Ez a kezelés a bőröd mélyebb rétegeit is feltölti, regenerálja és feszesíti, így az arcbőröd sima, üde és egészséges megjelenésű lesz.",
    image: hydro,
    id: "hydro_cell",
  },
  {
    title: "Anti Acné kezelés",
    price: "15 000 Ft",
    description:
      "Gyengéd, mégis hatékony megoldás zsíros, tág pórusú és problémás bőrre. A faggyútermelést normalizáló, mattító hatóanyagok és az aktív szén mélytisztító ereje segít csökkenteni a fénylő bőrképet, megelőzni az eltömődött pórusokat és az aknék kialakulását – mindezt szárítás és irritáció nélkül.",
    image: anti_acne,
    id: "anti_acne",
  },
  {
    title: "Arctisztítás",
    price: "10 000 Ft",
    description:
      "A tiszta és nyugodt arcbőrért 🌿 Ha pattanásokkal, gyulladásokkal vagy mitesszerekkel küzdesz, akkor ez a kezelés neked szól! Kíméletesen tisztítom és nyugtatom a bőrt, hogy végre fellélegezhessen.",
    image: gyulladas,
    id: "borkimelo_nyugtato",
  },
  {
    title: "Mélyhidratáló kezelés",
    price: "10 000 Ft",
    description:
      "Ez a kezelés ideális választás, ha szeretnéd bőrödnek visszaadni az energiát, hidratáltságot és üdeséget – különösen vízhiányos vagy száraz bőr esetén.",
    image: melytaplalo,
    id: "melyhidratolo",
  },
  {
    title: "Energetizáló : ✨ Energetizáló arckezelés – hogy arcod újra üde és ragyogó legyen! ✨",
    price: "7 000 Ft",
    description:
      "Az energetizáló arckezelés során letisztítom és tonizálom az arcod, majd arcmasszázzsal serkentem a vérkeringést. Tápláló pakolást, hidratáló krémeket, szemránckrémet, valamint nyak- és dekoltázsápolást is alkalmazok. 🌿 A kezelést nappali krém zárja, hogy bőröd friss, üde és ápolt legyen. Ideális választás a bőr energiájának és hidratáltságának visszaállítására, különösen vízhiányos vagy száraz bőr esetén.",
    image: energetizalo,
    id: "energetizalo_arckezeles",
  },
  {
    title: "Vitaminos arcmasszázs",
    price: "4 000 Ft",
    description:
      "A különleges masszázstechnikám és a vitaminokban gazdag, tápláló krémem nemcsak relaxál, hanem segít feszesebbé tenni a bőrt, javítja a vérkeringést és enyhíti a finom ráncokat is. Ez nem csak egy kezelés – ez egy kikapcsolódás, ami kívül-belül feltölt.",
    image: arcmasszas,
    id: "vitaminos_arcmasszazs",
  },
  {
    title: "Vio",
    price: "2 000 Ft",
    description:
      "Hatékony megoldás pattanások, gyulladt bőr és herpesz kezelésére. A VIO mélyen fertőtlenít, segít csökkenteni a gyulladást és felgyorsítja a bőr regenerálódását, miközben tisztább, egészségesebb bőrképhez vezet.",
    image: vio,
    id: "vio",
  },
  {
    title: "Szemöldök kezelések",
    image: null,
    subServices: [
      { id: "szemoldok_szedes", label: "Szemöldök szedés", price: "2 000 Ft" },
      { id: "szemoldok_festes", label: "Szemöldök festés", price: "2 000 Ft" },
    ],
  },
];
const services = [
  { id: "kollagen_szalas_carboxy_terapia", name: "Kollagénszálas arckezelés + carboxy terápia", duration: 120 },
  { id: "hydro_cell",        name: "HYDRO-CELL kezelés",                      duration: 90 },
  { id: "kollagen_szalas",   name: "Kollagénszálas arckezelés",               duration: 90 },
  { id: "anti_acne",         name: "Anti Acné kezelés",                       duration: 90 },
  { id: "borkimelo_nyugtato",name: "Bőrnyugtató, gyulladáscsökkentő kezelés", duration: 90 },
  { id: "melyhidratolo",     name: "Mélyhidratáló kezelés",                   duration: 90 },
  { id: "energetizalo_arckezeles", name: "Energetizáló arckezelés",           duration: 90 },
  { id: "vitaminos_arcmasszazs",   name: "Vitaminos arcmasszázs",             duration: 30 },
  { id: "vio",               name: "Vio",                                     duration: 15 },
  { id: "szemoldok_szedes",  name: "Szemöldök szedés",                        duration: 15 },
  { id: "szemoldok_festes",  name: "Szemöldök festés",                        duration: 30 },
];

export const Kozmetika = () => {
  const [service, setService] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("luxury-bg");
    return () => {
      document.body.classList.remove("luxury-bg");
    };
  }, []);

  const handleBookingcalendar = (id) => {
    setOpen(true);
    setService(id);
  };

  return (
    <section className="luxury-wrapper">
      <SectionTitle
        badge="Arckezelések"
        title="Kozmetika"
        lead="A bőröd mesél – érdemes odafigyelni rá."
        sub="Minden arckezelés egy személyre szabott élmény: a bőröd állapotától és igényeitől függően választjuk ki a számodra leghatékonyabb kezelést. Célom, hogy ne csak szebb, hanem egészségesebb bőrrel menj haza."
      />

      <div className="treatment-grid">
        {treatments.map((item, index) => (
          <div
            className={`treatment-card${item.subServices ? " treatment-card--no-image" : ""}`}
            key={index}
          >
            {/* Kép csak ha van */}
            {item.image && (
              <div
                className="treatment-image"
                style={{ backgroundImage: `url(${item.image})` }}
              />
            )}

            <div className="treatment-content">
              <h3>{item.title}</h3>

              {item.description && (
                <p className="description">{item.description}</p>
              )}

              {item.subServices ? (
                // ── Kombinált kártya (szemöldök) ──
                <div className="sub-services">
                  {item.subServices.map((sub) => (
                    <div className="sub-service-row" key={sub.id}>
                      <span className="sub-label">{sub.label}</span>
                      <span className="price">{sub.price}</span>
                      <button
                        className="book-btn"
                        onClick={() => handleBookingcalendar(sub.id)}
                      >
                        Időpontfoglalás
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // ── Normál kártya ──
                <div className="card-footer">
                  <span className="price">{item.price}</span>
                  <button
                    className="book-btn"
                    onClick={() => handleBookingcalendar(item.id)}
                  >
                    Időpontfoglalás
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <BookingCalendar
        setOpen={setOpen}
        open={open}
        defaultService={service}
        services={services}
      />
    </section>
  );
};