import { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firabse/FireBaseConfig";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // console.log("🔄 Auth state changed:", currentUser?.email);

      if (currentUser) {
        // ============================================================
        // Email verifikáció ellenőrzése
        // ============================================================
        if (!currentUser.emailVerified) {
          // console.log("⚠️ Email nincs verifikálva - KIJELENTKEZÉS");

          await firebaseSignOut(auth);

          setUser(null);
          setUserData(null);
          setAuthLoading(false);

          // console.log("🚫 Verifikálatlan user elutasítva");
          return;
        }

        // ============================================================
        // 2FA ellenőrzés – Firestore fetch ELŐRE kerül
        // ============================================================
        let data = null;
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          data = userDoc.exists() ? userDoc.data() : null;
        } catch (error) {
          console.error("❌ Error fetching user data for 2FA check:", error);
        }

        if (data?.role === "admin" && data?.twoFactorEnabled) {
          const twoFAVerified = sessionStorage.getItem("2fa_verified");

          if (!twoFAVerified) {
            // console.log("🔐 2FA szükséges, de nincs igazolva ebben a sessionben – kijelentkezés");
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
            setAuthLoading(false);
            return;
          }

          // console.log("✅ 2FA igazolva ebben a sessionben");
        }

        // ============================================================
        // Auth kész – az app azonnal renderelhet
        // ============================================================
        // console.log("✅ Email verifikálva, user beállítva");
        setUser(currentUser);
        setAuthLoading(false);

        // Firestore adat beállítása (már megvan fentről)
        setDataLoading(true);
        try {
          if (data) {
            // console.log("📄 User data loaded:", data);
            setUserData(data);
          } else {
            // console.log("⚠️ User document not found in Firestore");
            setUserData({
              email: currentUser.email,
              name: currentUser.displayName || "",
              uid: currentUser.uid,
            });
          }
        } catch (error) {
          console.error("❌ Error setting user data:", error);
          setUserData({
            email: currentUser.email,
            name: currentUser.displayName || "",
            uid: currentUser.uid,
          });
        } finally {
          setDataLoading(false);
        }

      } else {
        // console.log("👤 No user logged in");
        setUser(null);
        setUserData(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // console.log("🚪 Signing out...");
      sessionStorage.removeItem("2fa_verified"); // 2FA flag törlése kijelentkezéskor
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
      // console.log("✅ Signed out successfully");
    } catch (error) {
      console.error("❌ Kijelentkezési hiba:", error);
      throw error;
    }
  };

  const reloadUserData = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setUserData(userDoc.data());
        // console.log("🔄 User data reloaded");
      }
    } catch (error) {
      console.error("❌ Error reloading user data:", error);
    }
  };

  const value = {
    user,
    userData,
    loading: authLoading,
    dataLoading,
    signOut,
    reloadUserData,
    // CSAK akkor authenticated, ha user létezik ÉS verified
    isAuthenticated: !!user && user.emailVerified,
    isVerified: user?.emailVerified || false,
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        <div>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(102, 126, 234, 0.3)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};