import React from 'react';
import './legal.css';

export const Hazirend = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">Szalon Házirend</h1>
        <p className="legal-updated">
          Kedves Vendégeim! Azért, hogy mindenki számára nyugodt, kellemes és magas
          színvonalú szolgáltatást tudjak biztosítani, kérlek az alábbi szabályok
          betartásával segítsd a munkámat.
        </p>

        <section className="legal-section">
          <h2>🕐 Időpontfoglalás és érkezés</h2>
          <ul className="legal-list">
            <li>Kérlek, pontosan érkezz az időpontodra.</li>
            <li>
              Korai érkezés esetén előfordulhat, hogy még vendéggel dolgozom,
              ezért várakozásra lehet szükség.
            </li>
            <li>
              15 percnél nagyobb késés esetén a kezelés ideje rövidülhet, vagy
              az időpont lemondásra kerülhet.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>📅 Lemondás és módosítás</h2>
          <ul className="legal-list">
            <li>
              Időpont lemondása vagy módosítása minimum{' '}
              <strong>24 órával korábban</strong> lehetséges.
            </li>
            <li>
              Amennyiben a 24 órán belüli lemondások, illetve le nem mondott
              időpontok száma meghaladja a három alkalmat, a továbbiakban nem
              áll módomban új időpontot biztosítani.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>👥 Kísérők</h2>
          <ul className="legal-list">
            <li>A nyugodt munkavégzés érdekében kísérőt sajnos nem tudok fogadni.</li>
            <li>Gyermekfelügyeletet nem áll módomban biztosítani.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>🤒 Betegség esetén</h2>
          <ul className="legal-list">
            <li>
              Kérlek, előre jelezd, ha bármilyen allergiád, bőrbetegséged,
              fertőző betegséged vagy egyéb egészségügyi problémád van.
            </li>
            <li>
              Láz, megfázás, köhögés vagy fertőző betegség esetén kérlek
              halasszuk az időpontot – mindkettőnk és a többi vendég egészsége
              érdekében.
            </li>
            <li>
              Ilyen esetben a lehető legnagyobb rugalmassággal igyekszem új
              időpontot biztosítani.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>✨ Szempillaépítés esetén</h2>
          <ul className="legal-list">
            <li>Smink nélkül érkezz.</li>
            <li>Kontaktlencsét a kezelés előtt kérlek távolítsd el.</li>
            <li>
              Más stylist által készített szettet nem töltök. Ebben az esetben
              a meglévő szett eltávolítása szükséges, melynek díja{' '}
              <strong>2 000 Ft</strong>. Új szett építésére külön, következő
              időpontban kerül sor.
            </li>
          </ul>
        </section>

        <p className="legal-disclaimer">
          💖 Köszönöm a megértésedet és a együttműködésedet!
        </p>
      </div>
    </div>
  );
};