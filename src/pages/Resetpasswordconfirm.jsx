import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firabse/FireBaseConfig";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "./resetPasswordConfirm.css";

/**
 * ResetPasswordConfirm komponens
 * 
 * Ez az oldal kezeli a jelszó visszaállítását, amikor a user rákattint
 * az emailben kapott linkre.
 * 
 * URL formátum: /reset-password-confirm?mode=resetPassword&oobCode=ABC123
 * 
 * A Firebase automatikusan generálja ezt az URL-t az emailben
 */
export const ResetPasswordConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // URL paraméterek kinyerése
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    // Ellenőrizzük, hogy érvényes-e a reset link
    const verifyResetCode = async () => {
      if (!oobCode || mode !== "resetPassword") {
        setError("Érvénytelen vagy lejárt link. Kérj új jelszó visszaállítási linket!");
        setVerifying(false);
        return;
      }

      try {
        // Ellenőrizzük a reset kódot és lekérjük az email címet
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
        setVerifying(false);
        // console.log("✅ Reset kód érvényes:", email);
      } catch (error) {
        console.error("❌ Reset kód ellenőrzési hiba:", error);
        
        let errorMessage = "Érvénytelen vagy lejárt link";
        
        if (error.code === "auth/invalid-action-code") {
          errorMessage = "Ez a link már felhasználásra került vagy lejárt. Kérj új jelszó visszaállítási linket!";
        } else if (error.code === "auth/expired-action-code") {
          errorMessage = "Ez a link lejárt. Kérj új jelszó visszaállítási linket!";
        }
        
        setError(errorMessage);
        setVerifying(false);
      }
    };

    verifyResetCode();
  }, [oobCode, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validáció
    if (!newPassword || newPassword.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A jelszavak nem egyeznek");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Jelszó visszaállítása
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // console.log("✅ Jelszó sikeresen visszaállítva");
      setSuccess(true);

      // 3 másodperc múlva átirányítjuk a login oldalra
      setTimeout(() => {
        navigate("bvejelentkezes");
      }, 3000);

    } catch (error) {
      console.error("❌ Jelszó visszaállítási hiba:", error);
      
      let errorMessage = "Hiba történt a jelszó visszaállítása során";
      
      if (error.code === "auth/invalid-action-code") {
        errorMessage = "Ez a link már felhasználásra került vagy érvénytelen";
      } else if (error.code === "auth/expired-action-code") {
        errorMessage = "Ez a link lejárt";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A jelszó túl gyenge";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading állapot
  if (verifying) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="loading-spinner" />
          <p>Link ellenőrzése...</p>
        </div>
      </div>
    );
  }

  // Érvénytelen link
  if (error && !userEmail) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="error-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="40" cy="40" r="38" stroke="#EF4444" strokeWidth="4" />
              <path
                d="M30 30L50 50M50 30L30 50"
                stroke="#EF4444"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          <h1 className="error-title">Érvénytelen link</h1>
          <p className="error-message">{error}</p>
          
          <button
            onClick={() => navigate("/bejelentkezes")}
            className="back-to-login-btn"
          >
            Vissza a bejelentkezéshez
          </button>
        </div>
      </div>
    );
  }

  // Sikeres jelszó visszaállítás
  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="success-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="40" cy="40" r="38" stroke="#10B981" strokeWidth="4" />
              <path
                d="M25 40L35 50L55 30"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="success-title">Jelszó visszaállítva!</h1>
          
          <p className="success-message">
            A jelszavad sikeresen megváltozott.
            <br />
            Most már bejelentkezhetsz az új jelszavaddal.
          </p>

          <button
            onClick={() => navigate("/bejelentkezes")}
            className="login-redirect-btn"
          >
            Ugrás a bejelentkezéshez
          </button>

          <p className="auto-redirect-text">
            Automatikusan átirányítunk 3 másodpercen belül...
          </p>
        </div>
      </div>
    );
  }

  // Jelszó visszaállítási form
  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1 className="reset-password-title">Új jelszó beállítása</h1>
          <p className="reset-password-subtitle">
            Állítsd be az új jelszavadat a(z) <strong>{userEmail}</strong> fiókhoz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">Új jelszó *</label>
            <div className="password-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Legalább 6 karakter"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="password-toggle"
                aria-label="Jelszó mutatása/elrejtése"
              >
                {showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Jelszó megerősítése *</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Írd be újra az új jelszót"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
                aria-label="Jelszó mutatása/elrejtése"
              >
                {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-spinner" />
            ) : (
              "Jelszó megváltoztatása"
            )}
          </button>
        </form>

        <div className="reset-password-footer">
          <button
            type="button"
            onClick={() => navigate("/bejelentkezes")}
            className="back-btn"
            disabled={loading}
          >
            ← Vissza a bejelentkezéshez
          </button>
        </div>
      </div>
    </div>
  );
};