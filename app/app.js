// Leonida Trophy Guide: a tracker over the 55 official GTA VI trophies with a guide
// in our own words for each, a roadmap, filters, search, a spoiler setting and
// export/import. Progress is saved in localStorage; the app makes no network
// requests beyond loading its own data file.
const KEY = 'gta6-trophy-checklist';
const list = document.getElementById('list');
const grade = document.getElementById('grade');
const kind = document.getElementById('kind');
const q = document.getElementById('q');
const spoiler = document.getElementById('spoiler');
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
const doc = await (await fetch('data/trophies.json')).json();

// Preset filters from the URL, so a link can open one view (used by screenshots).
const params = new URLSearchParams(location.search);
if (params.get('kind')) kind.value = params.get('kind');
if (params.get('grade')) grade.value = params.get('grade');
if (params.get('spoiler') === '1') spoiler.checked = true;
if (params.get('q')) q.value = params.get('q');

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function render() {
  list.replaceChildren();
  const needle = q.value.trim().toLowerCase();
  let shown = 0;
  for (const t of doc.trophies) {
    if (grade.value !== 'all' && t.grade !== grade.value) continue;
    if (kind.value !== 'all' && t.kind !== kind.value) continue;
    if (needle && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(needle)) continue;
    shown++;
    const got = earned.has(t.name);
    const hidden = spoiler.checked && t.hidden && !got;
    const card = document.createElement('article');
    card.className = 'card' + (got ? ' earned' : '');
    card.dataset.name = t.name;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = got;
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      render();
    });
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = hidden ? 'Hidden trophy' : t.name;
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = hidden ? 'Hidden — earn it to reveal its name and description.' : t.description;
    const badges = document.createElement('p');
    badges.className = 'badges';
    badges.innerHTML = '';
    for (const [cls, txt] of [['g-' + t.grade, t.grade], ['k-' + t.kind, t.kind], ...(t.kind === 'missable' ? [['miss', 'MISSABLE']] : []), ...(t.hidden ? [['hid', 'hidden']] : [])]) {
      const b = document.createElement('span');
      b.className = 'badge ' + cls;
      b.textContent = txt;
      badges.append(b);
    }
    body.append(title, badges, desc);
    if (!hidden) {
      const g = document.createElement('p');
      g.className = 'guide';
      g.textContent = 'Guide: ' + t.guide;
      const s = document.createElement('p');
      s.className = 'sources';
      s.textContent = 'Sources: ' + t.sources.join(', ');
      body.append(g, s);
    }
    card.append(box, body);
    list.append(card);
  }
  document.getElementById('progress').textContent = `${earned.size} of ${doc.trophies.length} earned`;
  document.getElementById('barfill').style.width = (100 * earned.size / doc.trophies.length) + '%';
  document.getElementById('count').textContent = `Showing ${shown} of ${doc.trophies.length} trophies`;
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  earned = new Set(JSON.parse(await file.text()));
  save();
  render();
});
for (const el of [grade, kind, spoiler]) el.addEventListener('change', render);
q.addEventListener('input', render);
render();
