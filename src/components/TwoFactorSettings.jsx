import { useState } from "react";
import { useUser } from "../context/UserContext";
import { auth } from "../firabse/FireBaseConfig";

const TwoFactorSettings = () => {
  const { user, userData, reloadUserData } = useUser();
  const [qrCode, setQrCode] = useState(null);
  const [backupSecret, setBackupSecret] = useState(null);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const getAuthHeader = async () => {
    const token = await auth.currentUser.getIdToken();
    return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const handleSetup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/2fa/setup`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setBackupSecret(data.secret);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Hiba a setup során" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/2fa/enable`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token: setupCode }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "2FA sikeresen aktiválva! ✅" });
        setQrCode(null);
        setBackupSecret(null);
        setSetupCode("");
        await reloadUserData();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Hiba az aktiválás során" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/2fa/disable`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token: disableCode }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "2FA kikapcsolva" });
        setDisableCode("");
        await reloadUserData();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "Hiba a kikapcsolás során" });
    } finally {
      setLoading(false);
    }
  };

  const is2FAEnabled = userData?.twoFactorEnabled;

  return (
    <div className="two-factor-settings">
      <h3>Kétlépéses azonosítás (2FA)</h3>
      <p className="two-factor-status">
        Állapot:{" "}
        <strong style={{ color: is2FAEnabled ? "#16a34a" : "#dc2626" }}>
          {is2FAEnabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}
        </strong>
      </p>

      {message && (
        <div className={`two-factor-message two-factor-message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 2FA nincs bekapcsolva → setup flow */}
      {!is2FAEnabled && !qrCode && (
        <button className="submit-btn" onClick={handleSetup} disabled={loading}>
          {loading ? "Betöltés..." : "2FA bekapcsolása"}
        </button>
      )}

      {!is2FAEnabled && qrCode && (
        <div className="two-factor-setup">
          <p>
            <strong>1.</strong> Töltsd le a{" "}
            <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noreferrer">
              Google Authenticator
            </a>{" "}
            appot.
          </p>
          <p><strong>2.</strong> Olvasd be az alábbi QR kódot:</p>

          <div className="two-factor-qr">
            <img src={qrCode} alt="2FA QR kód" />
          </div>

          {backupSecret && (
            <div className="two-factor-backup">
              <p><strong>Backup kód (mentsd el!):</strong></p>
              <code>{backupSecret}</code>
            </div>
          )}

          <p><strong>3.</strong> Add meg az appban megjelenő 6 jegyű kódot:</p>

          <form onSubmit={handleEnable} className="login-form">
            <div className="form-group">
              <input
                type="text"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                style={{ letterSpacing: "0.3em", textAlign: "center", fontSize: "1.4rem" }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || setupCode.length !== 6}
            >
              {loading ? "Ellenőrzés..." : "Aktiválás megerősítése"}
            </button>
          </form>
        </div>
      )}

      {/* 2FA be van kapcsolva → kikapcsolás */}
      {is2FAEnabled && (
        <form onSubmit={handleDisable} className="login-form">
          <p>A kikapcsoláshoz add meg a jelenlegi Authenticator kódot:</p>
          <div className="form-group">
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              style={{ letterSpacing: "0.3em", textAlign: "center", fontSize: "1.4rem" }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="submit-btn"
            style={{ background: "#dc2626" }}
            disabled={loading || disableCode.length !== 6}
          >
            {loading ? "Ellenőrzés..." : "2FA kikapcsolása"}
          </button>
        </form>
      )}
    </div>
  );
};

export default TwoFactorSettings;