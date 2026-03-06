import { Navigate } from "react-router-dom";
import { useUser } from "./UserContext";

/**
 * ProtectedRoute komponens
 * 
 * Használat:
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading, isVerified } = useUser();

  // Loading state - még nem tudjuk, hogy be van-e jelentkezve
  if (loading) {
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

  // Ha nincs user VAGY az email nincs verifikálva
  // → Irányítsd át a login oldalra
  if (!user || !isVerified) {
// console.log("🚫 Access denied - redirecting to login");
    return <Navigate to="/bejelentkezes" replace />;
  }

  // Ha minden rendben → jelenítsd meg a protected content-et
  return children;
};

/**
 * Alternatív ProtectedRoute egyedi üzenettel
 * 
 * Használat:
 * <Route path="/admin" element={
 *   <ProtectedRouteWithMessage 
 *     requiredRole="admin"
 *     message="Csak admin felhasználók férhetnek hozzá"
 *   >
 *     <AdminPanel />
 *   </ProtectedRouteWithMessage>
 * } />
 */
export const ProtectedRouteWithMessage = ({ 
  children, 
  requiredRole = null,
  message = "Jelentkezz be a folytatáshoz"
}) => {
  const { user, loading, isVerified, userData } = useUser();

  if (loading) {
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

  // Ha nincs user vagy nincs verifikálva
  if (!user || !isVerified) {
    return <Navigate to="/bejelentkezes" state={{ message }} replace />;
  }

  // Ha role check is szükséges
  if (requiredRole && userData?.role !== requiredRole) {
    return <Navigate to="/" state={{ 
      message: "Nincs jogosultságod ehhez az oldalhoz" 
    }} replace />;
  }

  return children;
};