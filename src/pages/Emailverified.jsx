import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firabse/FireBaseConfig";
import "./emailverified.css";

export const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const actionCode = searchParams.get("oobCode");

      if (!actionCode) {
        console.error("❌ Hiányzó action code");
        setStatus("error");
        setErrorMessage("Érvénytelen vagy lejárt link.");
        return;
      }

      try {
        // console.log("✅ Email verifikáció folyamatban...");
        
        // Firebase email verification
        await applyActionCode(auth, actionCode);
        
        // console.log("✅ Email sikeresen verifikálva!");
        setStatus("success");

        // 3 másodperc után átirányítjuk a login oldalra
        setTimeout(() => {
          navigate("/bejelentkezes");
        }, 3000);

      } catch (error) {
        console.error("❌ Email verifikációs hiba:", error);
        
        let message = "Hiba történt az email megerősítése során.";
        
        if (error.code === "auth/invalid-action-code") {
          message = "A link érvénytelen vagy már felhasználásra került.";
        } else if (error.code === "auth/expired-action-code") {
          message = "A link lejárt. Kérj új megerősítő emailt!";
        }
        
        setErrorMessage(message);
        setStatus("error");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (status === "verifying") {
    return (
      <div className="auth-action-container">
        <div className="auth-action-card">
          <div className="auth-action-icon loading-icon">
            <div className="spinner-large" />
          </div>
          <h1 className="auth-action-title">Email megerősítése...</h1>
          <p className="auth-action-message">
            Kérjük, várj, amíg ellenőrizzük az email címedet.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="auth-action-container">
        <div className="auth-action-card success">
          <div className="auth-action-icon success-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-action-title">Email sikeresen megerősítve! 🎉</h1>
          <p className="auth-action-message">
            Köszönjük! Az email címed megerősítésre került.
          </p>
          <p className="auth-action-submessage">
            Átirányítunk a bejelentkezési oldalra...
          </p>
          <button 
            onClick={() => navigate("/bejelentkezes")} 
            className="auth-action-btn"
          >
            Bejelentkezés
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="auth-action-container">
        <div className="auth-action-card error">
          <div className="auth-action-icon error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-action-title">Hiba történt</h1>
          <p className="auth-action-message error-message">
            {errorMessage}
          </p>
          <div className="auth-action-buttons">
            <button 
              onClick={() => navigate("/bejelentkezes")} 
              className="auth-action-btn"
            >
              Vissza a bejelentkezéshez
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};