// App.jsx – JAVÍTOTT VERZIÓ
// Változások:
//   1. AdminRoute import hozzáadva
//   2. /admin route AdminRoute-ba csomagolva
//   3. Az "NYOMJMEG" admin gomb is role-check mögé kerül (már megvolt, de most AdminRoute védi az oldalt is)
//   4. PublicRoute hozzáadva – ha be van jelentkezve, /bejelentkezes -> /
//   5. ScrollToTop hozzáadva – navigáláskor mindig az oldal tetejére ugrik

import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Szolgaltatasaim } from "./pages/Szolgaltatasaim";
import { Rolam } from "./pages/Rolam";
import { Fooldal } from "./pages/Fooldal";
import { MyNav } from "./components/MyNav";
import "./App.css";
import { MyFooter } from "./components/MyFooter";
import { Foglalas } from "./pages/Foglalas";
import WaxingServices from "./pages/WaxingServices";
import { Kozmetika } from "./pages/Kozmetika";
import Szempilla from "./pages/Szempilla";
import { ProtectedRoute, ProtectedRouteWithMessage } from "./context/Protectedroute";
import { Beallitasok } from "./Beallitasok";
import { Login } from "./pages/Login";
import AdminDashboard from "./pages/Admindashboard";
import { Aszf } from "./Jog/Aszf";
import { Adatvedelem } from "./Jog/Adatvedelem";
import Smink from "./pages/Smink";
import Foglalasaim from "./pages/Foglalasaim";
import { Hazirend } from "./Jog/Hazirend";
import { EmailVerified } from "./pages/Emailverified";
import { ResetPasswordConfirm } from "./pages/Resetpasswordconfirm";
import { useUser } from "./context/UserContext";

// 🔝 ScrollToTop – navigáláskor mindig az oldal tetejére ugrik
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" }); // ← "instant" nem animál
  }, [pathname]);

  
  return null;

};

// 🔓 PublicRoute – ha már be van jelentkezve, visszadobja a főoldalra
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useUser();

  // Ha van pending 2FA, ne redirect-elj
  const hasPending2FA = !!sessionStorage.getItem("twofa_pending");

  if (isAuthenticated && !hasPending2FA) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { userData } = useUser();
  const navigate = useNavigate();

  return (
    <>
      <ScrollToTop />
      <MyNav />
      <Routes>
        <Route path="/" element={<Fooldal />} />
        <Route path="/szolgaltatasok" element={<Szolgaltatasaim />} />
        <Route path="/foglalas" element={<Foglalas />} />
        <Route path="/szempilla" element={<Szempilla />} />
        <Route path="/gyanta-foglalas" element={<WaxingServices />} />
        <Route path="/kozmetika" element={<Kozmetika />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
        <Route path="/aszf" element={<Aszf />} />
        <Route path="/adatvedelem" element={<Adatvedelem />} />
        <Route path="/foglalasaim" element={<Foglalasaim />} />
        <Route path="/smink" element={<Smink />} />
        <Route path="/hazirend" element={<Hazirend />} />

        {/* 🔓 Bejelentkezés – bejelentkezett user visszakerül a főoldalra */}
        <Route
          path="/bejelentkezes"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* 🔒 Admin oldal – csak bejelentkezett admin láthatja */}
        <Route
          path="/admin"
          element={
            <ProtectedRouteWithMessage requiredRole="admin">
              <AdminDashboard />
            </ProtectedRouteWithMessage>
          }
        />

        {/* 🔒 Beállítások – csak bejelentkezett user */}
        <Route
          path="/beallitasok"
          element={
            <ProtectedRoute>
              <Beallitasok />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Admin gomb – csak adminoknak jelenik meg */}
      {userData?.role === "admin" && (
        <button className="admingomb" onClick={() => navigate("/admin")}>
          NYOMJMEG
        </button>
      )}

      <MyFooter />
    </>
  );
};

export default App;