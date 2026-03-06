import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./mynav.css";
import "./mynav2.css";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { useUser } from "../context/Usercontext";

export const MyNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const lastScroll = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const dropdownRef = useRef(null);
  const avatarBtnRef = useRef(null);

  const { user, isAuthenticated, signOut } = useUser();

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserDropdownOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Kijelentkezési hiba:", error);
    }
  };

  // Dropdown pozíció kiszámítása az avatar gomb alapján
  const openDropdown = (e) => {
    e.stopPropagation();
    if (!userDropdownOpen && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Scroll effekt
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 30);
      if (current > lastScroll.current && current > 250) setHidden(true);
      if (current < lastScroll.current) setHidden(false);
      lastScroll.current = current;

      // Dropdown bezárása scrollkor
      if (userDropdownOpen) setUserDropdownOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [userDropdownOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
      if (userDropdownOpen) setUserDropdownOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [userDropdownOpen]);

  // Kívülre kattintásra bezárás
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        userDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen, userDropdownOpen]);

  // Scroll lock mobilon
  const scrollRef = useRef(0);
  useEffect(() => {
    if (menuOpen) {
      scrollRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo({ top: scrollRef.current, behavior: "instant" });
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
    };
  }, [menuOpen]);

  const navItems = [
    { path: "/", label: "Főoldal", icon: "🏠" },
    { path: "/foglalasaim", label: "Foglalásaim", icon: "💝" },
   ];const Logo = ({ onClick }) => (
    <span
      className="cb-logo"
      onClick={onClick}
      role="button"
      aria-label="Colette Beauty – főoldal"
    >
      <span className="cb-logo__monogram" aria-hidden="true">
        <span className="cb-logo__monogram-ring cb-logo__monogram-ring--outer" />
        <span className="cb-logo__monogram-ring" />
        <span className="cb-logo__monogram-letter">C</span>
      </span>
      <span className="cb-logo__text">
        <span className="cb-logo__name">Colette</span>
        <span className="cb-logo__ornament" aria-hidden="true">
          <span className="cb-logo__ornament-line" />
          <span className="cb-logo__ornament-gem">✦ ✦</span>
        </span>
        <span className="cb-logo__sub">beauty</span>
      </span>
    </span>
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`nav-header ${!isMobile && hidden ? "hidden" : ""} ${!isMobile && scrolled ? "scrolled" : ""}`}
      >
  {!isMobile && (
          <div className="nav-container" style={{ position: "relative" }}>

            {/* Logo – flex:1 tartja a helyét bal oldalon */}
            <div style={{ flex: 1 }}>
              <Logo onClick={() => handleNav("/")} />
            </div>

            {/* Navigáció – középen */}
            <nav className="nav-links-desktop" style={{ flex: 1 }}>
              {navItems.map((item) => (
                <span
                  key={item.path}
                  className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                  onClick={() => handleNav(item.path)}
                >
                  {item.label}
                </span>
              ))}
            </nav>

            {/* User – jobb oldalon */}
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem" }}>
              {isAuthenticated ? (
                <div className="user-dropdown-wrapper">
                  <button ref={avatarBtnRef} className="user-avatar-btn" onClick={openDropdown}>
                    <div className="user-avatar">
                      {user?.photoURL ? <img src={user.photoURL} alt="Profil" /> : <FiUser />}
                    </div>
                    <span className="user-name">
                      {user?.displayName || user?.email?.split("@")[0]}
                    </span>
                    <svg
                      className={`dropdown-arrow ${userDropdownOpen ? "openn" : ""}`}
                      width="12" height="8" viewBox="0 0 12 8" fill="none"
                    >
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="user-dropdown"
                      style={{ position: "fixed", top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                    >
                      <div className="user-dropdown-header">
                        <div className="user-avatar-large">
                          {user?.photoURL ? <img src={user.photoURL} alt="Profil" /> : <FiUser />}
                        </div>
                        <div className="user-info">
                          <p className="user-display-name">{user?.displayName || "Felhasználó"}</p>
                          <p className="user-email">{user?.email}</p>
                        </div>
                      </div>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); handleNav("/beallitasok"); }}>
                        <FiSettings /><span>Beállítások</span>
                      </button>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item logout" onClick={handleSignOut}>
                        <FiLogOut /><span>Kijelentkezés</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="nav-cta" onClick={() => handleNav("/bejelentkezes")}>
                  Bejelentkezés
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobile && (
          <nav className="top-navbar-v2">
            <div className="navbar-container-v2">
              <span className="navbar-logo" style={{ flex: 1, position: "relative" }}>
  <span
    className={`cb-logo`}
    onClick={() => handleNav("/")}
    role="button"
    aria-label="Colette Beauty – főoldal"
  >
    {/* Monogram karika */}
    <span className="cb-logo__monogram" aria-hidden="true">
      <span className="cb-logo__monogram-ring cb-logo__monogram-ring--outer" />
      <span className="cb-logo__monogram-ring" />
      <span className="cb-logo__monogram-letter">C</span>
    </span>

    {/* Szöveg */}
    <span className="cb-logo__text">
      <span className="cb-logo__name">Colette</span>
      <span className="cb-logo__ornament" aria-hidden="true">
        <span className="cb-logo__ornament-line" />
        <span className="cb-logo__ornament-gem">✦ ✦</span>
      </span>
      <span className="cb-logo__sub">beauty</span>
    </span>
  </span>
                <button
                  style={{ position: "absolute", right: 0, bottom: 0, top: 0, margin: "auto" }}
                  className={`nav-toggle ${menuOpen ? "openn" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  aria-label="Menu"
                >
                  {!menuOpen ? <RxHamburgerMenu /> : <IoMdClose />}
                </button>
              </span>

              <div className={`navbar-menu-v2 ${menuOpen ? "open-v2" : "closed-v2"}`}>
                {navItems.map((item) => (
                  <span
                    key={item.path}
                    className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                    onClick={() => handleNav(item.path)}
                  >
                    {item.label}
                  </span>
                ))}

                {/* Mobile User Section */}
                <div className="mobile-user-section">
                  {isAuthenticated ? (
                    <>
                      <div className="mobile-user-info">
                        <div className="user-avatar-large">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profil" />
                          ) : (
                            <FiUser />
                          )}
                        </div>
                        <div className="user-info">
                          <p className="user-display-name">
                            {user?.displayName || "Felhasználó"}
                          </p>
                          <p className="user-email">{user?.email}</p>
                        </div>
                      </div>

                      <button
                        className="mobile-menu-btn"
                        onClick={() => { setMenuOpen(false); handleNav("/beallitasok"); }}
                      >
                        <FiSettings />
                        <span>Beállítások</span>
                      </button>

                      <button className="mobile-menu-btn logout" onClick={handleSignOut}>
                        <FiLogOut />
                        <span>Kijelentkezés</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="nav-cta-mobile"
                      onClick={() => { setMenuOpen(false); handleNav("/bejelentkezes"); }}
                    >
                      Bejelentkezés
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};