import React from "react";
import { Szolgaltatasaim } from "./Szolgaltatasaim";

export const Fooldal = () => {
  return (
    <div className="fooldal-container">
        <section className="hero-section">
            <div className="hero-content">
                <div className="h1" style={{position:'relative'}}>Ragyogj kívűl belül

                  <div className="h1 szoveg-shadow" >Ragyogj kívűl belül</div>
                </div>
                
                <p  style={{ textShadow: "2px 2px 3px #5b675781" }}>Professzionális kozmetikai kezelések, személyre szabott törődéssel.
              </p>
            </div>
        </section>
        <Szolgaltatasaim/>
    </div>
  );
};

export default Fooldal;