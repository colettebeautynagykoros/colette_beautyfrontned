import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const MyNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const lastScroll = useRef(0);  // <-- REF, NEM STATE
  const navigate = useNavigate();

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      // háttér változás
      setScrolled(current > 30);

      // scroll down -> eltűnik
      if (current > lastScroll.current && current > 150) {
        setHidden(true);
      }

      // scroll up -> visszajön
      if (current < lastScroll.current) {
        setHidden(false);
      }

      // update the ref (instant)
      lastScroll.current = current;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`nav-header ${hidden ? "hidden" : ""} ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <span className="navbar-logo" onClick={() => handleNav("/")}><span className="logo-text">Colette</span><span className="logo-accent">Beauty</span></span>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <span onClick={() => handleNav("/")}>Főoldal</span>
          <span onClick={() => handleNav("/szolgaltatasaim")}>Szolgáltatások</span>
          <span onClick={() => handleNav("/rolam")}>Rólunk</span>
          <span onClick={() => handleNav("/kapcsolat")}>Kapcsolat</span>
        </nav>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>
    </header>
  );
};
