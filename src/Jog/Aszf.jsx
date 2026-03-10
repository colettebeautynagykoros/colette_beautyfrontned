import React from 'react';
import './legal.css';

export const Aszf = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1 className="legal-title">Általános Szerződési Feltételek</h1>
        <p className="legal-updated">Hatályos: 2025. január 1-től</p>

        <section className="legal-section">
          <h2>1. A szolgáltató adatai</h2>
          <p>
            <strong>Név:</strong> Colette Beauty (egyéni vállalkozó)<br />
            <strong>Székhely:</strong> 2750 Nagykőrös, Szabadság tér 3.<br />
            <strong>Telefon:</strong> +36 30 412 5132<br />
            <strong>E-mail:</strong> colettebeautynagykoros@gmail.com
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Az ÁSZF hatálya és elfogadása</h2>
          <p>
            Jelen Általános Szerződési Feltételek (ÁSZF) a Colette Beauty (Szolgáltató)
            és a szolgáltatásait igénybe vevő személyek (Ügyfél) közötti jogviszonyt
            szabályozzák. Az időpontfoglalással vagy a szolgáltatás igénybevételével az
            Ügyfél jelen ÁSZF-et elfogadja.
          </p>
          <p>
            A Szolgáltató fenntartja a jogot az ÁSZF előzetes értesítés nélküli,
            egyoldalú módosítására. A mindenkori hatályos ÁSZF a weboldalon érhető el.
            A módosítás a közzétételkor lép hatályba.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. A szolgáltatások köre</h2>
          <p>
            A Szolgáltató kozmetikai kezeléseket nyújt. Az aktuálisan elérhető
            szolgáltatások és árak a weboldalon, illetve telefonon kérhetők.
            A Szolgáltató fenntartja a jogot a szolgáltatások körének és árainak
            bármikor, előzetes értesítés nélküli megváltoztatására.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Időpontfoglalás és visszaigazolás</h2>
          <p>
            Az időpontfoglalás online, telefonon (+36 30 412 5132) vagy e-mailben
            (colettebeautynagykoros@gmail.com) lehetséges.
          </p>

          <h3 className="legal-subsection-title">A foglalás menete</h3>
          <p>
            Az online időpontfoglalás <strong>foglalási kérelemnek</strong> minősül, nem
            azonnali, végleges foglalásnak. A folyamat két lépésből áll:
          </p>
          <ol className="legal-list">
            <li>
              <strong>Kérelem beérkezése:</strong> A foglalás elküldésekor az Ügyfél
              visszaigazoló e-mailt kap arról, hogy a kérelmet feljegyeztük.
              Az időpont ebben a szakaszban <em>jóváhagyásra vár</em>, és
              más Ügyfél számára már nem foglalható.
            </li>
            <li>
              <strong>Visszaigazolás vagy elutasítás:</strong> A Szolgáltató az igényt
              áttekinti, majd e-mailben értesíti az Ügyfelet arról, hogy a foglalást
              <strong> visszaigazolta</strong> (az időpont végleges), vagy
              <strong> elutasította</strong> (az időpont felszabadul).
            </li>
          </ol>
          <p>
            A foglalás kizárólag a Szolgáltató visszaigazoló e-mailjével válik véglegessé.
            A kérelem beérkezéséről szóló automatikus értesítő <strong>nem minősül
            visszaigazolásnak.</strong>
          </p>

          <h3 className="legal-subsection-title">Kérelem visszavonása</h3>
          <p>
            A jóváhagyásra váró kérelmet az Ügyfél a „Foglalásaim" oldalon bármikor
            visszavonhatja, amíg a Szolgáltató nem igazolta vissza.
            Visszaigazolás után az általános lemondási feltételek (5. pont) érvényesek.
          </p>

          <p>
            A kezelések díja a helyszínen, a kezelés elvégzése után esedékes.
            Az Ügyfél a foglalással tudomásul veszi, hogy az időpontfoglalás
            önmagában nem jelent árlekötést.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Lemondás, módosítás</h2>
          <p>
            Az Ügyfél köteles a visszaigazolt foglalt időpontot legalább{" "}
            <strong>24 órával korábban</strong> lemondani. Késedelmes lemondás vagy
            meg nem jelenés esetén a Szolgáltató jogosult a jövőbeli foglalásokat
            előfeltételekhez kötni, vagy megtagadni.
          </p>
          <p>
            A Szolgáltató fenntartja a jogot az időpont egyoldalú módosítására vagy
            törlésére, melyről az Ügyfelet lehetőség szerint előre értesíti.
            Törölt időpontért a Szolgáltató felelősséget nem vállal.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. A kezelések elvégzésének feltételei</h2>
          <p>
            Az Ügyfél köteles a kezelés előtt minden, a kezelést befolyásoló
            egészségügyi körülményről (allergia, bőrérzékenység, terhesség,
            bőrbetegség stb.) a Szolgáltatót tájékoztatni. Az elmulasztott
            vagy valótlan tájékoztatásból eredő következményekért kizárólag
            az Ügyfél felel.
          </p>
          <p>
            A Szolgáltató bármely okból, indokolás nélkül jogosult a kezelést
            megtagadni vagy megszakítani. Megkezdett kezelés megszakítása esetén
            a Szolgáltató az elvégzett munkával arányos díjra tarthat igényt,
            de nem köteles azt felszámítani.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Fizetési feltételek</h2>
          <p>
            A kezelések ellenértéke készpénzben fizetendő a helyszínen, a
            kezelés elvégzése után. A Szolgáltató fenntartja a jogot az
            elfogadott fizetési módok megváltoztatására. Reklamáció esetén
            a Szolgáltató dönt a panasz megalapozottságáról.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Felelősségkorlátozás</h2>
          <p>
            A Szolgáltató a szakmai elvárásoknak megfelelően végzi tevékenységét,
            azonban egyéni bőrreakciókért, előre nem látható mellékhatásokért,
            illetve az Ügyfél által elhallgatott vagy tévesen közölt körülményekből
            eredő következményekért felelősséget nem vállal.
          </p>
          <p>
            A Szolgáltató nem vállal felelősséget a weboldal esetleges technikai
            hibáiból, elérhetetlenségéből vagy az adatvesztésből eredő károkért.
            A weboldal tartalma tájékoztató jellegű, és bármikor megváltozhat.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Panaszkezelés</h2>
          <p>
            Panasz esetén az Ügyfél a Szolgáltatóhoz fordulhat telefonon vagy
            e-mailben. A Szolgáltató a panaszokat lehetőségei szerint vizsgálja ki,
            de meghatározott válaszidőre nem vállal kötelezettséget.
          </p>
          <p>
            Fogyasztóvédelmi jogvita esetén az Ügyfél a Pest Vármegyei Békéltető
            Testülethez (1055 Budapest, Balassi Bálint u. 25. IV/2.), illetve a
            Nemzeti Fogyasztóvédelmi Hatósághoz fordulhat.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Vegyes rendelkezések</h2>
          <p>
            Jelen ÁSZF-re a magyar jog az irányadó. A weboldal tartalma
            szerzői jogi védelem alatt áll; engedély nélküli felhasználása tilos.
            Az ÁSZF egyes rendelkezéseinek esetleges érvénytelensége a többi
            rendelkezés érvényességét nem érinti.
          </p>
        </section>

        <p className="legal-disclaimer">
          ⚠️ Jelen dokumentum tájékoztató jellegű, jogi tanácsadást nem helyettesít.
        </p>
      </div>
    </div>
  );
};