import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

import "./login.css";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { auth, db } from "../firabse/FireBaseConfig";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  saveGoogleUser,
} from "../utils";

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  // 2FA states
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingUid, setPendingUid] = useState(null);
  // Tároljuk a credentials-t az újra-bejelentkezéshez
  const [pendingCredentials, setPendingCredentials] = useState(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});

  const toastConfig = {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (strength <= 2) return "weak";
    if (strength <= 3) return "medium";
    return "strong";
  };

  const passwordStrength = !isLogin
    ? calculatePasswordStrength(formData.password)
    : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = "Az email cím kötelező";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Érvénytelen email cím";
    }

    if (!formData.password) {
      newErrors.password = "A jelszó kötelező";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "A jelszónak legalább 6 karakter hosszúnak kell lennie";
    }

    if (!isLogin) {
      if (!formData.name || formData.name.trim().length === 0) {
        newErrors.name = "A név kötelező";
      }
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!formData.phone) {
        newErrors.phone = "A telefonszám kötelező";
      } else if (
        !phoneRegex.test(formData.phone) ||
        formData.phone.replace(/\D/g, "").length < 9
      ) {
        newErrors.phone = "Érvénytelen telefonszám";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "A jelszó megerősítése kötelező";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "A jelszavak nem egyeznek";
      }
      if (!acceptedTerms) {
        newErrors.terms =
          "Az ÁSZF és Adatvédelmi tájékoztató elfogadása kötelező";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── 2FA VERIFY ──────────────────────────────────────────────────
  const handleTwoFAVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = useBackup
        ? `${import.meta.env.VITE_API_URL}/api/2fa/verify-backup`
        : `${import.meta.env.VITE_API_URL}/api/2fa/verify`;

      const body = useBackup
        ? { uid: pendingUid, backupCode: twoFACode }
        : { uid: pendingUid, token: twoFACode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Hibás kód", toastConfig);
        return;
      }

      // Újra bejelentkezés
      if (pendingCredentials && !pendingCredentials.isGoogle) {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence,
        );
        await signInWithEmailAndPassword(
          auth,
          pendingCredentials.email,
          pendingCredentials.password,
        );
      } else if (pendingCredentials?.isGoogle) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
      sessionStorage.setItem("2fa_verified", "true"); // ← EZT ADD HOZZÁ

      clearTwoFAPending();
      setPendingUid(null);
      setPendingCredentials(null);
      setTwoFARequired(false);
      setUseBackup(false);

      toast.success("Sikeres bejelentkezés! 🎉", {
        ...toastConfig,
        autoClose: 2000,
      });
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      toast.error("Hiba az ellenőrzés során", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL AUTH ───────────────────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        // ── BEJELENTKEZÉS ────────────────────────────────────────
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence,
        );

        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const loggedInUser = userCredential.user;
        const uid = loggedInUser.uid;

        if (!loggedInUser.emailVerified) {
          await firebaseSignOut(auth);
          toast.error(
            "Kérjük, először erősítsd meg az email címedet! Nézd meg a postafiókod (spam mappát is!).",
            toastConfig,
          );
          return;
        }

        // 2FA ellenőrzés
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data();

        if (userData?.role === "admin" && userData?.twoFactorEnabled) {
          // ⚠️ ELŐSZÖR state, AZTÁN signOut
          setPendingUid(uid);
          setPendingCredentials({
            email: formData.email,
            password: formData.password,
          });
          setTwoFARequired(true); // ← EZ ELŐRE KERÜL

          await firebaseSignOut(auth); // ← EZ UTÁNRA
          return;
        }

        toast.success("Sikeres bejelentkezés! 🎉", {
          ...toastConfig,
          autoClose: 2000,
        });
        setTimeout(() => navigate("/"), 1000);
      } else {
        // ── REGISZTRÁCIÓ ─────────────────────────────────────────
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: formData.name });

        try {
          await sendVerificationEmail(
            newUser.email,
            formData.name,
            formData.phone,
            newUser.uid,
          );
        } catch (emailError) {
          await newUser.delete();
          toast.error(
            "Hiba történt a regisztráció során. Kérjük, próbáld újra!",
            toastConfig,
          );
          return;
        }

        await firebaseSignOut(auth);

        toast.success(
          `✅ Sikeres regisztráció! Elküldtük a megerősítő emailt a ${formData.email} címre. Nézd meg a postafiókod!`,
          { ...toastConfig, autoClose: 8000 },
        );

        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
          phone: "",
        });
        setAcceptedTerms(false);
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (error) {
      let errorMessage = "Hiba történt";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Ez az email cím már használatban van";
          setErrors({ email: errorMessage });
          break;
        case "auth/invalid-email":
          errorMessage = "Érvénytelen email cím";
          setErrors({ email: errorMessage });
          break;
        case "auth/weak-password":
          errorMessage = "A jelszó túl gyenge";
          setErrors({ password: errorMessage });
          break;
        case "auth/user-not-found":
          errorMessage = "Nincs ilyen felhasználó";
          setErrors({ email: errorMessage });
          break;
        case "auth/wrong-password":
          errorMessage = "Hibás jelszó";
          setErrors({ password: errorMessage });
          break;
        case "auth/invalid-credential":
          errorMessage = "Hibás email vagy jelszó";
          setErrors({ email: errorMessage, password: errorMessage });
          break;
        case "auth/network-request-failed":
          errorMessage = "Hálózati hiba. Ellenőrizd az internetkapcsolatot!";
          setErrors({ general: errorMessage });
          break;
        case "auth/too-many-requests":
          errorMessage = "Túl sok próbálkozás. Kérjük, próbáld újra később!";
          setErrors({ general: errorMessage });
          break;
        default:
          errorMessage = `Hiba: ${error.message}`;
          setErrors({ general: errorMessage });
      }
      toast.error(errorMessage, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE SIGN IN ───────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});
    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userRef = doc(db, "users", googleUser.uid);
      const userSnap = await getDoc(userRef);

      let phone = "";

      if (!userSnap.exists() || !userSnap.data().phone) {
        phone = prompt("Kérjük, add meg a telefonszámodat (kötelező):");

        if (!phone || phone.trim().length === 0) {
          await firebaseSignOut(auth);
          toast.error(
            "A telefonszám megadása kötelező a Google bejelentkezéshez",
            toastConfig,
          );
          return;
        }

        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone) || phone.replace(/\D/g, "").length < 9) {
          await firebaseSignOut(auth);
          toast.error("Érvénytelen telefonszám formátum", toastConfig);
          return;
        }

        phone = phone.trim();
      }

      try {
        await saveGoogleUser(
          googleUser.uid,
          googleUser.email,
          googleUser.displayName,
          phone,
        );
      } catch (saveError) {
        await firebaseSignOut(auth);
        toast.error(
          "Hiba történt a bejelentkezés során. Próbáld újra!",
          toastConfig,
        );
        return;
      }

      // 2FA ellenőrzés
      const freshSnap = await getDoc(doc(db, "users", googleUser.uid));
      const freshData = freshSnap.data();

      if (freshData?.role === "admin" && freshData?.twoFactorEnabled) {
        // Google esetén nem tudunk újra sign in-olni jelszóval,
        // ezért a uid-t és egy google-flag-et tárolunk
        await firebaseSignOut(auth);
        setPendingUid(googleUser.uid);
        setPendingCredentials({ isGoogle: true });
        setTwoFARequired(true);
        return;
      }

      toast.success("Sikeres Google bejelentkezés! 🎉", {
        ...toastConfig,
        autoClose: 2000,
      });
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      let errorMessage = "Hiba történt a Google bejelentkezés során";
      if (error.code === "auth/popup-blocked") {
        errorMessage =
          "A böngésző blokkolta a popup ablakot. Engedélyezd a popup ablakokat!";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "A bejelentkezés megszakítva";
      }
      toast.error(errorMessage, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail || !resetEmail.trim()) {
      toast.error("Kérjük, add meg az email címedet!", toastConfig);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error("Érvénytelen email cím", toastConfig);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await sendPasswordResetEmail(resetEmail);
      toast.success(
        `✅ Jelszó visszaállítási emailt küldtünk a ${resetEmail} címre. Nézd meg a postafiókod!`,
        { ...toastConfig, autoClose: 6000 },
      );
      setResetEmail("");
      setTimeout(() => setShowForgotPassword(false), 2000);
    } catch (error) {
      toast.error(
        error.message || "Hiba történt a jelszó visszaállítás során",
        toastConfig,
      );
    } finally {
      setLoading(false);
    }
  };

  // ── 2FA KÉPERNYŐ ─────────────────────────────────────────────────
  if (twoFARequired) {
    return (
      <>
        <div className="login-container">
          <div className="login-wrapper">
            <div className="login-card">
              <div className="login-header">
                <h1 className="login-title">Kétlépéses azonosítás</h1>
                <p className="login-subtitle">
                  {useBackup
                    ? "Add meg a 2FA setup során kapott backup kódot"
                    : "Nyisd meg a Google Authenticator appot és add meg a 6 jegyű kódot"}
                </p>
              </div>

              <form onSubmit={handleTwoFAVerify} className="login-form">
                <div className="form-group">
                  <label htmlFor="twoFACode">
                    {useBackup ? "Backup kód *" : "Authenticator kód *"}
                  </label>
                  <input
                    type="text"
                    id="twoFACode"
                    value={twoFACode}
                    onChange={(e) =>
                      setTwoFACode(
                        useBackup
                          ? e.target.value.toUpperCase()
                          : e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder={useBackup ? "NNQTM5DT..." : "000000"}
                    maxLength={useBackup ? 64 : 6}
                    autoComplete="one-time-code"
                    inputMode={useBackup ? "text" : "numeric"}
                    disabled={loading}
                    style={{
                      letterSpacing: useBackup ? "0.1em" : "0.3em",
                      textAlign: "center",
                      fontSize: useBackup ? "1rem" : "1.4rem",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={
                    loading ||
                    (!useBackup && twoFACode.length !== 6) ||
                    (useBackup && twoFACode.length < 8)
                  }
                >
                  {loading ? <span className="loading-spinner" /> : "Belépés"}
                </button>
              </form>

              <div
                className="login-footer"
                style={{ flexDirection: "column", gap: "8px" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup(!useBackup);
                    setTwoFACode("");
                  }}
                  className="link-btn"
                  disabled={loading}
                >
                  {useBackup
                    ? "← Vissza az Authenticator kódhoz"
                    : "Nincs kód? Backup kód használata"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearTwoFAPending();
                    setPendingUid(null);
                    setPendingCredentials(null);
                    setTwoFARequired(false);
                    setTwoFACode("");
                    setUseBackup(false);
                  }}
                  className="toggle-btn"
                  disabled={loading}
                >
                  ← Vissza a bejelentkezéshez
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── ELFELEJTETT JELSZÓ NÉZET ─────────────────────────────────────
  if (showForgotPassword) {
    return (
      <>
        <div className="login-container">
          <div className="login-wrapper">
            <div className="login-card">
              <div className="login-header">
                <h1 className="login-title">Jelszó visszaállítása</h1>
                <p className="login-subtitle">
                  Add meg az email címedet és küldünk egy linket
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <label htmlFor="resetEmail">Email cím *</label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="pelda@email.com"
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="loading-spinner" />
                  ) : (
                    "Jelszó visszaállítása"
                  )}
                </button>
              </form>

              <div className="login-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setErrors({});
                  }}
                  className="toggle-btn"
                  disabled={loading}
                >
                  ← Vissza a bejelentkezéshez
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── FŐ NÉZET ─────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`login-container ${!isLogin ? "login-container--register" : ""}`}
      >
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">
                {isLogin ? "Bejelentkezés" : "Regisztráció"}
              </h1>
              <p className="login-subtitle">
                {isLogin ? "Üdvözlünk vissza!" : "Csatlakozz hozzánk!"}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="login-form">
              {errors.general && (
                <div className="error-message general">{errors.general}</div>
              )}

              {/* Név – csak regisztráció */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Név *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error" : ""}
                    placeholder="Teljes neved"
                    disabled={loading}
                  />
                  {errors.name && (
                    <span className="error-message">{errors.name}</span>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email cím *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                  placeholder="pelda@email.com"
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              {/* Telefon – csak regisztráció */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="phone">Telefonszám *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "error" : ""}
                    placeholder="+36 30 123 4567"
                    autoComplete="tel"
                    disabled={loading}
                  />
                  {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>
              )}

              {/* Jelszó */}
              <div className="form-group">
                <label htmlFor="password">Jelszó *</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error" : ""}
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label="Jelszó mutatása/elrejtése"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}

                {!isLogin && formData.password && passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${passwordStrength}`} />
                    </div>
                    <div className={`strength-text ${passwordStrength}`}>
                      {passwordStrength === "weak" && "Gyenge jelszó"}
                      {passwordStrength === "medium" && "Közepes jelszó"}
                      {passwordStrength === "strong" && "Erős jelszó"}
                    </div>
                  </div>
                )}
              </div>

              {/* Jelszó megerősítése – csak regisztráció */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Jelszó megerősítése *</label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? "error" : ""}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="password-toggle"
                      aria-label="Jelszó megerősítés mutatása/elrejtése"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <AiOutlineEyeInvisible />
                      ) : (
                        <AiOutlineEye />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              )}

              {/* Maradjak bejelentkezve – csak login */}
              {isLogin && (
                <div className="remember-me">
                  <label className="remember-me__label">
                    <input
                      type="checkbox"
                      className="remember-me__checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span className="remember-me__custom" aria-hidden="true" />
                    <span className="remember-me__text">
                      Maradjak bejelentkezve
                    </span>
                  </label>
                </div>
              )}

              {/* Elfelejtett jelszó – csak login */}
              {isLogin && (
                <div className="forgot-password-link">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="link-btn"
                    disabled={loading}
                  >
                    Elfelejtetted a jelszavad?
                  </button>
                </div>
              )}

              {/* ÁSZF elfogadása – csak regisztráció */}
              {!isLogin && (
                <div className="terms-accept">
                  <label
                    className={`terms-accept__label ${
                      errors.terms ? "terms-accept__label--error" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="remember-me__checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (errors.terms)
                          setErrors((prev) => ({ ...prev, terms: "" }));
                      }}
                      disabled={loading}
                    />
                    <span className="remember-me__custom" aria-hidden="true" />
                    <span className="terms-accept__text">
                      Elolvastam és elfogadom az{" "}
                      <Link to="/aszf" target="_blank" className="terms-link">
                        Általános Szerződési Feltételeket
                      </Link>
                      , az{" "}
                      <Link
                        to="/adatvedelem"
                        target="_blank"
                        className="terms-link"
                      >
                        Adatvédelmi tájékoztatót
                      </Link>{" "}
                      és a{" "}
                      <Link
                        to="/hazirend"
                        target="_blank"
                        className="terms-link"
                      >
                        Házirendet
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.terms && (
                    <span
                      className="error-message"
                      style={{ marginTop: "0.25rem", display: "block" }}
                    >
                      {errors.terms}
                    </span>
                  )}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="loading-spinner" />
                ) : isLogin ? (
                  "Bejelentkezés"
                ) : (
                  "Regisztráció"
                )}
              </button>
            </form>

            {/* Google bejelentkezés
            {isLogin && (
              <div className="social-login">
                <div className="divider">
                  <span>vagy</span>
                </div>
                <button
                  type="button"
                  className="google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <FcGoogle size={20} />
                  Bejelentkezés Google-lel
                </button>
              </div>
            )} */}

            <div className="login-footer">
              <p>
                {isLogin ? "Még nincs fiókod?" : "Van már fiókod?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      name: "",
                      phone: "",
                    });
                    setErrors({});
                    setAcceptedTerms(false);
                    setRememberMe(false);
                  }}
                  className="toggle-btn"
                  disabled={loading}
                >
                  {isLogin ? "Regisztráció" : "Bejelentkezés"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
