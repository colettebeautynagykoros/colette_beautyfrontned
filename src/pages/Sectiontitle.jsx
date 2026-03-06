// src/components/SectionTitle.jsx
// Használat:
//   <SectionTitle badge="..." title="..." lead="..." sub="..." />

import React from "react";
import "./SectionTitle.css";

export const SectionTitle = ({ badge, title, lead, sub }) => {
  return (
    <div className="cim-wrap">

      {/* Háttér virág / petal SVG */}
      <svg
        className="cim-wrap__petals"
        viewBox="0 0 380 160"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <ellipse key={i} cx="190" cy="80" rx="52" ry="20"
            fill="hsl(340, 70%, 60%)"
            transform={`rotate(${deg}, 190, 80)`} />
        ))}
        <circle cx="190" cy="80" r="14" fill="hsl(340, 60%, 75%)" />

        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse key={`l${i}`} cx="68" cy="78" rx="30" ry="11"
            fill="hsl(340, 65%, 65%)"
            transform={`rotate(${deg}, 68, 78)`} />
        ))}
        <circle cx="68" cy="78" r="8" fill="hsl(340, 55%, 80%)" />

        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse key={`r${i}`} cx="312" cy="78" rx="30" ry="11"
            fill="hsl(340, 65%, 65%)"
            transform={`rotate(${deg}, 312, 78)`} />
        ))}
        <circle cx="312" cy="78" r="8" fill="hsl(340, 55%, 80%)" />

        <ellipse cx="128" cy="48" rx="14" ry="5" fill="hsl(340, 55%, 70%)" transform="rotate(-30, 128, 48)" />
        <ellipse cx="252" cy="48" rx="14" ry="5" fill="hsl(340, 55%, 70%)" transform="rotate(30, 252, 48)" />
        <ellipse cx="128" cy="112" rx="14" ry="5" fill="hsl(340, 55%, 70%)" transform="rotate(30, 128, 112)" />
        <ellipse cx="252" cy="112" rx="14" ry="5" fill="hsl(340, 55%, 70%)" transform="rotate(-30, 252, 112)" />
      </svg>

      {/* Pill badge */}
      {badge && <div className="cim-wrap__badge">{badge}</div>}

      {/* Főcím */}
      <h2 className="cim-wrap__title">{title}</h2>

      {/* Dekorációs vonal */}
      <div className="cim-wrap__line">
        <span></span>
        <span className="cim-wrap__line-gem"></span>
        <span></span>
      </div>

      {/* Bevezető szöveg blokk */}
      {(lead || sub) && (
        <div className="cim-wrap__intro">
          {lead && <p className="cim-wrap__lead">{lead}</p>}
          {sub && <p className="cim-wrap__sub">{sub}</p>}
          <div className="cim-wrap__divider">
            <span></span>
            <span className="cim-wrap__diamond">✦</span>
            <span></span>
          </div>
        </div>
      )}

    </div>
  );
};