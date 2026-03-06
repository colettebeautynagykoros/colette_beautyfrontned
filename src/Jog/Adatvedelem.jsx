import React from 'react';
import './legal.css';

export const Adatvedelem = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">Adatvédelmi és Cookie tájékoztató</h1>
        <p className="legal-updated">Hatályos: 2025. január 1-től</p>

        <section className="legal-section">
          <h2>1. Az adatkezelő adatai</h2>
          <p>
            <strong>Név:</strong> Colette Beauty (egyéni vállalkozó)<br />
            <strong>Székhely:</strong> 2750 Nagykőrös, Szabadság tér 3.<br />
            <strong>Telefon:</strong> +36 30 412 5132<br />
            <strong>E-mail:</strong> colettebeautynagykoros@gmail.com
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Kezelt adatok és adatkezelés célja</h2>
          <p>
            A Colette Beauty kizárólag a szolgáltatás nyújtásához szükséges
            személyes adatokat kezeli (név, telefonszám, e-mail cím, foglalt időpont).
          </p>
          <p>
            <strong>Jogalap:</strong> Az érintett önkéntes hozzájárulása (GDPR 6. cikk
            (1) bek. a) pont) és a szerződés teljesítése (GDPR 6. cikk (1) bek. b) pont).
          </p>
          <p>
            <strong>Megőrzési idő:</strong> Az adatokat a cél megvalósulásáig,
            illetve a jogszabályi kötelezettségek teljesítéséig tároljuk.
            Az adatok törlését az Ügyfél bármikor kérheti, kivéve ha a megőrzést
            jogszabály kötelezővé teszi.
          </p>
          <p>
            Az Ügyfél által e-mailben önkéntesen megküldött egészségügyi jellegű
            információkat (pl. allergia, bőrérzékenység) kizárólag a kezelés
            biztonságos elvégzése céljából kezeljük, és azokat a szükséges ideig
            tároljuk. Kérjük, ilyen adatokat csak akkor osszon meg, ha azt
            feltétlenül szükségesnek tartja.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Adattovábbítás</h2>
          <p>
            Személyes adatokat harmadik félnek nem továbbítunk, kivéve ha azt
            jogszabály előírja. Az e-mailes kommunikációhoz Google LLC (Gmail)
            szolgáltatását vesszük igénybe; a Google adatvédelmi tájékoztatója:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              policies.google.com/privacy
            </a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Az érintett jogai</h2>
          <p>
            Az Ügyfél jogosult adataihoz hozzáférni, azok helyesbítését vagy
            törlését kérni, az adatkezelést korlátozni, illetve hozzájárulását
            bármikor visszavonni. Jogai gyakorlásához írjon a colettebeautynagykoros@gmail.com
            címre; kérelmét lehetőségeinkhez mérten kezeljük.
          </p>
          <p>
            Jogsérelem esetén az Ügyfél a Nemzeti Adatvédelmi és Információszabadság
            Hatósághoz fordulhat:{' '}
            <a href="https://www.naih.hu" target="_blank" rel="noopener noreferrer">
              www.naih.hu
            </a>
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Adatbiztonság</h2>
          <p>
            Az adatokat az adott körülmények között elvárható biztonsági intézkedésekkel
            védjük. Adatbiztonsági incidens esetén a jogszabályban előírt módon járunk el.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Cookie (süti) tájékoztató</h2>

          <div className="cookie-banner-info">
            <span className="cookie-icon">🍪</span>
            <p>
              Weboldalunk kizárólag <strong>technikailag szükséges sütiket</strong> használ.
              Marketing- vagy analitikai célú, harmadik fél által elhelyezett sütit
              <strong> nem alkalmazunk</strong>.
            </p>
          </div>

          <p>
            A technikailag szükséges sütik az oldal alapfunkcióihoz elengedhetetlenek
            (munkamenet-kezelés, bejelentkezési állapot megőrzése). Ezek letiltása
            az oldal működését befolyásolhatja. A sütik böngészőből törölhetők;
            útmutatók:{' '}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{' '}
            <a href="https://support.mozilla.org/hu/kb/sutik-informacio-amelyet-weboldalak-tarolnak" target="_blank" rel="noopener noreferrer">Firefox</a>,{' '}
            <a href="https://support.apple.com/hu-hu/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. A tájékoztató módosítása</h2>
          <p>
            A Colette Beauty fenntartja a jogot jelen tájékoztató előzetes értesítés
            nélküli módosítására. A hatályos verzió mindig elérhető a weboldalon.
          </p>
        </section>

        <p className="legal-disclaimer">
          ⚠️ Jelen dokumentum tájékoztató jellegű, jogi tanácsadást nem helyettesít.
        </p>
      </div>
    </div>
  );
};