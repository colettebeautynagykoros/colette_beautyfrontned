import React, { useState } from "react";

import skincare from "../assets/skin-care.png";
import { useNavigate } from "react-router-dom";
export const Szolgaltatasaim = () => {
  const [active, setActive] = useState(null);
  const navigate = useNavigate();

  
  return (
<section className="tartalom-section ferde-szolgaltatasok">
  <div className="card">
    <div className="card-border">
      <div className="corner top left"></div>
      <div className="corner top right"></div>
      <div className="corner bottom left"></div>
      <div className="corner bottom right"></div>
      <h2 className="szolgaltatasok-cim ">Szolgáltatások</h2>
    </div>
  </div>
  <div className="ferde-wrapper">

      <div
      className="ferde-kartya"
      
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.67), rgba(214, 62, 120, 0.32)), url(${skincare})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      
      <div className="kartya-content">
        <h3>Skin Cares</h3>
        <p>
          Prémium arckezelések, hidratálás, anti-aging és személyre szabott bőrápolás.
        </p>
      </div>
      
        <button onClick={()=>navigate("/foglalas")} className="foglalas-btn">Foglalj időpontot</button>
    </div>


    <div className="ferde-kartya">
      <div className="kartya-content">
        <h3>Szempilla</h3>
        <p>
          Tartós lifting, dúsítás és természetes vagy extra megjelenés.
        </p>
      </div>
      
        <button onClick={()=>navigate("/foglalas")} className="foglalas-btn">Foglalj időpontot</button>
    </div>

    <div className="ferde-kartya">
      <div className="kartya-content">
        <h3>Sminkelés</h3>
        <p>
          Profi nappali, alkalmi vagy esküvői smink prémium termékekkel.
        </p>
      </div>
      
        <button onClick={()=>navigate("/foglalas")} className="foglalas-btn utolso">Foglalj időpontot</button>
    </div>

  </div>
</section>

  );
};
