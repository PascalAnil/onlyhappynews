// Only Happy News – lädt die Tagesausgabe aus data/archive/ und stellt sie dar.
// Ausgabe wählen: index.html?d=2026-09-17  (ohne Parameter = neueste Ausgabe)
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const fmtLang = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${tage[d.getDay()]}, ${d.getDate()}. ${monate[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtKurz = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${tage[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`; };
  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '#');

  function link(a) {
    return `<a class="more" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">Zum Artikel →</a>`;
  }
  function meta(a) {
    return `${esc(a.quelle)}${a.lesezeit ? ' · ' + esc(a.lesezeit) + ' Min. Lesezeit' : ''}`;
  }

  function render(ausgabe) {
    $('datum').textContent = fmtLang(ausgabe.datum);
    $('ausgabe').textContent = `Ausgabe Nr. ${ausgabe.ausgabe} · ${ausgabe.artikel.length} gute Nachrichten`;
    document.title = `Only Happy News – ${fmtLang(ausgabe.datum)}`;

    const artikel = ausgabe.artikel.slice();
    const topIdx = Math.max(0, artikel.findIndex((a) => a.top));
    const top = artikel.splice(topIdx, 1)[0];

    const lead = $('lead');
    lead.dataset.kat = top.kategorie;
    lead.innerHTML = `
      <div class="panel"><span>${esc(top.kategorie)}</span></div>
      <div>
        <div class="kicker">Artikel des Tages · ${esc(top.kategorie)}</div>
        <h1>${esc(top.titel)}</h1>
        <p>${esc(top.zusammenfassung)}</p>
        <div class="row"><span class="src">${meta(top)}</span>${link(top)}</div>
      </div>`;
    lead.classList.remove('hidden');

    $('grid').innerHTML = artikel.map((a) => `
      <article class="item" data-kat="${esc(a.kategorie)}">
        <div class="kicker">${esc(a.kategorie)}</div>
        <h2>${esc(a.titel)}</h2>
        <p>${esc(a.zusammenfassung)}</p>
        <div class="row"><span class="src">${meta(a)}</span>${link(a)}</div>
      </article>`).join('');

    // Kategorien-Filter
    const kats = ['Alle', ...new Set(ausgabe.artikel.map((a) => a.kategorie))];
    $('cats').innerHTML = kats.map((k, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-k="${esc(k)}">${esc(k)}</button>`).join('');
    $('cats').onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $('cats').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      const k = b.dataset.k;
      document.querySelectorAll('[data-kat]').forEach((el) => el.classList.toggle('hidden', k !== 'Alle' && el.dataset.kat !== k));
    };
  }

  function renderArchiv(index, aktuell) {
    $('archive').innerHTML = index.slice(0, 30).map((e) => `
      <li class="${e.datum === aktuell ? 'current' : ''}"><a href="?d=${esc(e.datum)}">${fmtKurz(e.datum)}</a><span>Ausgabe ${esc(e.ausgabe)} · ${esc(e.anzahl)} Artikel</span></li>`).join('');
  }

  function fehler(msg) { const n = $('notice'); n.textContent = msg; n.classList.remove('hidden'); }

  async function start() {
    $('jahr').textContent = new Date().getFullYear();
    try {
      const index = await (await fetch('data/archive/index.json', { cache: 'no-store' })).json();
      if (!index.length) return fehler('Noch keine Ausgabe vorhanden.');
      const wunsch = new URLSearchParams(location.search).get('d');
      const datum = index.some((e) => e.datum === wunsch) ? wunsch : index[0].datum;
      const ausgabe = await (await fetch(`data/archive/${datum}.json`, { cache: 'no-store' })).json();
      render(ausgabe);
      renderArchiv(index, datum);
    } catch (e) {
      fehler('Die heutige Ausgabe konnte nicht geladen werden. Bitte später nochmals versuchen.');
      console.error(e);
    }
  }
  start();
})();
