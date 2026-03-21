// SEO.jsx – Láthatatlan, per-page meta tag kezelő
// Használat: <SEO title="..." description="..." canonical="..." />
// Semmit nem renderel vizuálisan – csak a <head>-et módosítja.

import { useEffect } from "react";

const BASE_URL = "https://colettebeauty.hu";
const SITE_NAME = "Colette Beauty";
const DEFAULT_DESCRIPTION =
  "Colette Beauty szépségszalon Kecskeméten. Professzionális kozmetikai kezelések, műszempilla, smink és gyantázás. Online időpontfoglalás.";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogType = "website",
  noindex = false,
  jsonLd = null,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Szépségszalon Kecskeméten`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper: set or create <meta>
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [key, val] = attr;
        el.setAttribute(key, val);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    // Helper: set or create <link>
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Primary meta
    setMeta('meta[name="description"]', ["name", "description"], description);
    setMeta('meta[name="robots"]', ["name", "robots"], noindex ? "noindex, nofollow" : "index, follow");

    // Canonical
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', ["property", "og:title"], fullTitle);
    setMeta('meta[property="og:description"]', ["property", "og:description"], description);
    setMeta('meta[property="og:url"]', ["property", "og:url"], canonicalUrl);
    setMeta('meta[property="og:type"]', ["property", "og:type"], ogType);

    // Twitter
    setMeta('meta[name="twitter:title"]', ["name", "twitter:title"], fullTitle);
    setMeta('meta[name="twitter:description"]', ["name", "twitter:description"], description);

    // JSON-LD (per-page structured data)
    const LD_ID = "seo-jsonld-page";
    let ldEl = document.getElementById(LD_ID);
    if (jsonLd) {
      if (!ldEl) {
        ldEl = document.createElement("script");
        ldEl.type = "application/ld+json";
        ldEl.id = LD_ID;
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }
  }, [fullTitle, description, canonicalUrl, noindex, jsonLd]);

  return null; // Semmit nem renderel
};

export default SEO;
