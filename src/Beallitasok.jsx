import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./beallitasok.css";
import { FiUser, FiMail, FiPhone, FiSave, FiShield } from "react-icons/fi";
import { db, auth } from "./firabse/FireBaseConfig";
import { useUser } from "./context/UserContext";

export const Beallitasok = () => {
  const { user, userData, reloadUserData } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // 2FA states
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState({ type: "", text: "" });
  const [twoFASetupData, setTwoFASetupData] = useState(null); // { qrCode, secret }
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const is2FAEnabled = userData?.twoFactorEnabled;
  const isAdmin = userData?.role === "admin";

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setFormData({
              name: data.name || user.displayName || "",
              phone: data.phone || "",
            });
          }
        } catch (error) {
          console.error("Hiba a felhasználói adatok betöltésekor:", error);
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (formData.name !== user.displayName) {
        await updateProfile(user, { displayName: formData.name });
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date().toISOString(),
      });

      setMessage({ type: "success", text: "A beállítások sikeresen mentve!" });
    } catch (error) {
      console.error("Hiba a mentés során:", error);
      setMessage({
        type: "error",
        text: "Hiba történt a mentés során. Kérjük, próbáld újra!",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── 2FA HELPERS ──────────────────────────────────────────────────
  const getAuthHeader = async () => {
    const token = await auth.currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const handle2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/2fa/setup`,
        { method: "POST", headers }
      );
      const data = await res.json();
      if (data.success) {
        setTwoFASetupData({ qrCode: data.qrCode, secret: data.secret });
      } else {
        setTwoFAMessage({ type: "error", text: data.message });
      }
    } catch {
      setTwoFAMessage({ type: "error", text: "Hiba a 2FA setup során" });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAEnable = async (e) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/2fa/enable`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ token: setupCode }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTwoFAMessage({
          type: "success",
          text: "2FA sikeresen aktiválva! ✅",
        });
        setTwoFASetupData(null);
        setSetupCode("");
        await reloadUserData();
      } else {
        setTwoFAMessage({ type: "error", text: data.message });
      }
    } catch {
      setTwoFAMessage({ type: "error", text: "Hiba az aktiválás során" });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async (e) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAMessage({ type: "", text: "" });
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/2fa/disable`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ token: disableCode }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTwoFAMessage({ type: "success", text: "2FA sikeresen kikapcsolva" });
        setDisableCode("");
        await reloadUserData();
      } else {
        setTwoFAMessage({ type: "error", text: data.message });
      }
    } catch {
      setTwoFAMessage({ type: "error", text: "Hiba a kikapcsolás során" });
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="beallitasok-container">
      <div className="beallitasok-wrapper">
        <div className="beallitasok-header">
          <h1>Beállítások</h1>
          <p>Kezeld a fiókod adatait</p>
        </div>

        {/* ── PROFIL ADATOK ─────────────────────────────────────── */}
        <div className="beallitasok-card">
          {/* Email (read-only) */}
          <div className="info-section">
            <div className="info-item">
              <FiMail className="info-icon" />
              <div>
                <label className="info-label">Email cím</label>
                <p className="info-value">{user?.email}</p>
                <span className="info-hint">Az email cím nem módosítható</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="beallitasok-form">
            {message.text && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="form-group">
              <label htmlFor="name">
                <FiUser className="label-icon" />
                Név
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Teljes neved"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <FiPhone className="label-icon" />
                Telefonszám
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+36 30 123 4567"
                required
              />
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <FiSave />
                  <span>Mentés</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── 2FA SZEKCIÓ – csak adminoknak ─────────────────────── */}
        {isAdmin && (
          <div className="beallitasok-card twofa-card">
            <div className="twofa-header">
              <FiShield className="twofa-shield-icon" />
              <div>
                <h2>Kétlépéses azonosítás (2FA)</h2>
                <p>Google Authenticator alapú belépési védelem</p>
              </div>
              <span
                className={`twofa-badge ${
                  is2FAEnabled ? "twofa-badge--on" : "twofa-badge--off"
                }`}
              >
                {is2FAEnabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}
              </span>
            </div>

            {twoFAMessage.text && (
              <div className={`message ${twoFAMessage.type}`}>
                {twoFAMessage.text}
              </div>
            )}

            {/* ── 2FA NINCS BEKAPCSOLVA ── */}
            {!is2FAEnabled && !twoFASetupData && (
              <div className="twofa-section">
                <p className="twofa-desc">
                  A kétlépéses azonosítás extra védelmet nyújt a fiókod
                  számára. Bejelentkezéskor a jelszó mellett egy 6 jegyű
                  időalapú kódot is kér a rendszer a Google Authenticator
                  appból.
                </p>
                <button
                  className="save-btn"
                  onClick={handle2FASetup}
                  disabled={twoFALoading}
                >
                  {twoFALoading ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <FiShield />
                      <span>2FA bekapcsolása</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── SETUP FOLYAMAT ── */}
            {!is2FAEnabled && twoFASetupData && (
              <div className="twofa-setup">
                <div className="twofa-steps">
                  <div className="twofa-step">
                    <span className="twofa-step-num">1</span>
                    <p>
                      Töltsd le a{" "}
                      <a
                        href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                        target="_blank"
                        rel="noreferrer"
                        className="twofa-link"
                      >
                        Google Authenticator
                      </a>{" "}
                      appot (Android / iOS).
                    </p>
                  </div>
                  <div className="twofa-step">
                    <span className="twofa-step-num">2</span>
                    <p>Olvasd be az alábbi QR kódot az appban:</p>
                  </div>
                </div>

                <div className="twofa-qr-wrapper">
                  <img
                    src={twoFASetupData.qrCode}
                    alt="2FA QR kód"
                    className="twofa-qr"
                  />
                </div>

                {twoFASetupData.secret && (
                  <div className="twofa-backup">
                    <p>
                      <strong>📋 Backup kód</strong> – mentsd el biztonságos
                      helyre, ha elveszíted a telefonod:
                    </p>
                    <code className="twofa-secret">{twoFASetupData.secret}</code>
                  </div>
                )}

                <div className="twofa-step">
                  <span className="twofa-step-num">3</span>
                  <p>Add meg az appban megjelenő 6 jegyű kódot:</p>
                </div>

                <form onSubmit={handle2FAEnable} className="twofa-form">
                  <input
                    type="text"
                    value={setupCode}
                    onChange={(e) =>
                      setSetupCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={twoFALoading}
                    className="twofa-input"
                  />
                  <div className="twofa-btn-row">
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={twoFALoading || setupCode.length !== 6}
                    >
                      {twoFALoading ? (
                        <span className="loading-spinner" />
                      ) : (
                        "Aktiválás megerősítése"
                      )}
                    </button>
                    <button
                      type="button"
                      className="save-btn save-btn--ghost"
                      onClick={() => {
                        setTwoFASetupData(null);
                        setSetupCode("");
                        setTwoFAMessage({ type: "", text: "" });
                      }}
                      disabled={twoFALoading}
                    >
                      Mégse
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── 2FA BE VAN KAPCSOLVA – kikapcsolás ── */}
            {is2FAEnabled && (
              <div className="twofa-section">
                <p className="twofa-desc">
                  A kétlépéses azonosítás aktív. A kikapcsoláshoz add meg a
                  jelenlegi Google Authenticator kódot:
                </p>
                <form onSubmit={handle2FADisable} className="twofa-form">
                  <input
                    type="text"
                    value={disableCode}
                    onChange={(e) =>
                      setDisableCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={twoFALoading}
                    className="twofa-input"
                  />
                  <button
                    type="submit"
                    className="save-btn save-btn--danger"
                    disabled={twoFALoading || disableCode.length !== 6}
                  >
                    {twoFALoading ? (
                      <span className="loading-spinner" />
                    ) : (
                      "2FA kikapcsolása"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── FIÓK INFORMÁCIÓK ──────────────────────────────────── */}
        <div className="account-info">
          <h3>Fiók információk</h3>
          <div className="info-grid">
            <div className="info-box">
              <span className="info-box-label">Regisztráció dátuma</span>
              <span className="info-box-value">
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(
                      "hu-HU"
                    )
                  : "N/A"}
              </span>
            </div>
            <div className="info-box">
              <span className="info-box-label">Utolsó bejelentkezés</span>
              <span className="info-box-value">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                      "hu-HU"
                    )
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};