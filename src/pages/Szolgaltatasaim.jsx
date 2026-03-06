import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Szolgaltatasaim.css";

import skincareImg from "../assets/kozmetika1.PNG";
import szempillaImg from "../assets/szempilla.png";
import sminkImg from "../assets/smink2.PNG";
import gynataImg from "../assets/wax3.PNG";
import { SectionTitle } from "./Sectiontitle";

export const Szolgaltatasaim = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      title: "Kozmetika",
      text: "Prémium arckezelések, hidratálás, anti-aging és személyre szabott bőrápolás.",
      img: skincareImg,
      navigate: "/kozmetika",
    },
    {
      title: "Szempilla",
      text: "Tartós lifting, dúsítás és természetes vagy extra megjelenés.",
      img: szempillaImg,
      navigate: "/szempilla",
    },
    {
      title: "Smink",
      text: "Profi nappali, alkalmi vagy esküvői smink prémium termékekkel.",
      img: sminkImg,
      navigate: "/smink",
    },
    {
      title: "Gyanta",
      text: "Kíméletes és hatékony szőrtelenítés, sima és hosszan tartó eredménnyel.",
      img: gynataImg,
      navigate: "/gyanta-foglalas",
    },
  ];

  return (
    <section ref={sectionRef} className="tartalom-section ferde-szolgaltatasok">

<SectionTitle badge="Kezelések" title="Szolgáltatások"   
      lead="Minden kezelés mögött egy cél áll: hogy a legjobb formádat hozd ki magadból."
      sub=" Válaszd ki a számodra tökéletes szolgáltatást, és foglalj időpontot néhány kattintással.
          Kérdés esetén szívesen segítek személyesen vagy telefonon."
     />



      {/* ── Kártyák ── */}
      <div className={`ferde-wrapper ${visible ? "animate-cards" : ""}`}>
        {cards.map((c, i) => {
          const delayClass = `a${i + 1}`;
          return (
            <div
              key={i}
              className={`ferde-kartya ${delayClass}`}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(214,62,120,0.4)), url(${c.img})`,
                "--skew": i % 2 === 0 ? "-3deg" : "3deg",
              }}
              ref={(el) => {
                if (el && visible) {
                  setTimeout(
                    () => el.classList.remove(delayClass),
                    (i + 1) * 150 + 800
                  );
                }
              }}
            >
              <div
                className="kartya-content"
                style={{ transform: i % 2 === 0 ? "skewY(3deg)" : "skewY(-3deg)" }}
              >
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
              <button
                onClick={() => navigate(c.navigate)}
                className="foglalas-btn"
                style={{ transform: i % 2 === 0 ? "skewY(3deg)" : "skewY(-3deg)" }}
              >
                Foglalj időpontot
              </button>
            </div>
          );
        })}
      </div>

    </section>
  );
};