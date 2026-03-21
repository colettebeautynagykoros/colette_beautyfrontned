import React from "react";
import { Szolgaltatasaim } from "./Szolgaltatasaim";
import "./Fooldal.css";
import heroBg from "../assets/hero-bg.jpg";
import SEO from "../components/SEO";

export const Fooldal = () => {
  return (
    <div className="fooldal-container">
      <SEO
        canonical="/"
        description="Colette Beauty szépségszalon Kecskeméten. Professzionális kozmetikai kezelések, műszempilla, smink és gyantázás. Online időpontfoglalás."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Colette Beauty – Főoldal",
          "url": "https://colettebeauty.hu/",
          "description": "Professzionális szépségszalon Kecskeméten."
        }}
      />
      <section className="hero-section" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-content">
          <div className="hero-title-wrapper">
            <h1 className="hero-title">Ragyogj kívül belül</h1>
            <h1 className="hero-title hero-title-shadow">Ragyogj kívül belül</h1>
          </div>
          <p className="hero-subtitle">
            Professzionális kozmetikai kezelések, személyre szabott törődéssel.
          </p>
          <a href="#szolgaltatasok" className="hero-cta">
            Fedezd fel szolgáltatásainkat
          </a>
        </div>
        <div className="hero-scroll-indicator">
          <span></span>
        </div>
      </section>
      <div id="szolgaltatasok">
        <Szolgaltatasaim />
      </div>
    </div>
  );
};

export default Fooldal;
