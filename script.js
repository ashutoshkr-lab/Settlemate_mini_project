/* =====================================================================
   SETTLEMATE – frontend demo. All data below is SAMPLE data.
   BACKEND-READY: replace DATA with a fetch() to your API, and replace the
   db.* calls (localStorage) with API requests. UI code can stay the same.
   ===================================================================== */
'use strict';

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const db = { // localStorage wrapper (swap for API calls later)
  get: (k, d) => { try { const v = localStorage.getItem('sm_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('sm_' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del: k => { try { localStorage.removeItem('sm_' + k); } catch { /* ignore */ } }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const toast = (msg, err) => {
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 3200);
};

/* ---------- Cities ---------- */
const CITIES = { 'Delhi': [28.6139, 77.209], 'Greater Noida': [28.4744, 77.504], 'Noida': [28.5355, 77.391], 'Gurugram': [28.4595, 77.0266], 'Bengaluru': [12.9716, 77.5946], 'Mumbai': [19.076, 72.8777], 'Pune': [18.5204, 73.8567], 'Hyderabad': [17.385, 78.4867], 'Jaipur': [26.9124, 75.7873], 'Lucknow': [26.8467, 80.9462] };
let city = db.get('city', 'Greater Noida');
const center = () => db.get('pos', null) || CITIES[city] || CITIES['Delhi'];
const km = ([a, b], [c, d]) => { // haversine distance
  const R = 6371, rad = x => x * Math.PI / 180, dl = rad(c - a), dg = rad(d - b);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* ---------- Sample data (Delhi NCR) ---------- */
// [section, type, name, address, price, unit, rating, reviews, verified, lat, lng, icon, details, extras]
const ROWS = [
  ['accommodation', 'PG', 'Sunrise Girls PG', 'Knowledge Park III, Greater Noida', 7500, '/month', 4.5, 128, 1, 28.4744, 77.504, 'fa-bed', 'WiFi, power backup, CCTV, 2 meals a day', 'Female|Double|AC|Food|Furnished'],
  ['accommodation', 'Hostel', 'Campus Nest Hostel', 'Sector 62, Noida', 9000, '/month', 4.3, 96, 1, 28.6208, 77.3639, 'fa-building-user', 'Gym, laundry, study hall, mess', 'Male|Single|AC|Food|Furnished'],
  ['accommodation', 'Flat', '2BHK Flat near Metro', 'Indirapuram, Ghaziabad', 18000, '/month', 4.1, 40, 0, 28.6460, 77.3715, 'fa-house', 'Balcony, parking, near metro, shared by 2–3', 'Co-ed|Double|Non-AC|No Food|Unfurnished'],
  ['accommodation', 'Roommate', 'Roommate wanted – 3BHK', 'Sector 50, Noida', 8000, '/month', 4.0, 22, 0, 28.5706, 77.3622, 'fa-people-roof', 'Furnished room, WiFi, working professionals', 'Co-ed|Double|AC|No Food|Furnished'],
  ['study', 'Library', 'Gyaan Study Library', 'Mukherjee Nagar, Delhi', 800, '/month', 4.6, 212, 1, 28.7055, 77.2023, 'fa-book-open', 'Open 6 AM – 11 PM · AC, silent zone, lockers'],
  ['study', 'Coaching', 'Delhi Civils Academy', 'Old Rajinder Nagar, Delhi', 45000, '/course', 4.4, 150, 1, 28.6406, 77.1857, 'fa-chalkboard-user', 'Courses: UPSC, SSC · Contact via demo number'],
  ['study', 'Job', 'Junior Data Analyst', 'Cyber City, Gurugram · Hybrid', 25000, '/month', 4.2, 18, 1, 28.4950, 77.0890, 'fa-briefcase', 'SQL, Python, Excel · Company: DataNest Pvt Ltd (sample)'],
  ['study', 'Co-working', 'HubSpace Cowork', 'Sector 62, Noida', 4500, '/month', 4.5, 64, 1, 28.6270, 77.3730, 'fa-laptop-code', 'Hot desks, WiFi, meeting rooms, coffee'],
  ['daily', 'Laundry', 'FreshFold Laundry', 'Alpha 1, Greater Noida', 60, '/kg', 4.4, 87, 1, 28.4700, 77.5100, 'fa-shirt', 'Pickup & drop · Available today'],
  ['daily', 'Salon', 'Style Studio Salon', 'Sector 18, Noida', 199, ' onwards', 4.2, 51, 0, 28.5700, 77.3210, 'fa-scissors', 'Haircut, grooming · Open till 9 PM'],
  ['daily', 'Electrician', 'SparkFix Electricians', 'Sector 15, Gurugram', 249, ' visit', 4.3, 70, 1, 28.4650, 77.0300, 'fa-bolt', 'Same-day visit · Available now'],
  ['daily', 'Plumber', 'QuickPipe Plumbing', 'Karol Bagh, Delhi', 299, ' visit', 4.1, 45, 0, 28.6519, 77.1909, 'fa-faucet-drip', 'Leaks, fittings · Available tomorrow'],
  ['daily', 'Cleaning', 'SparkleHome Cleaning', 'Sector 137, Noida', 899, ' onwards', 4.6, 133, 1, 28.5100, 77.4000, 'fa-broom', 'Room & kitchen deep cleaning · Available today'],
  ['daily', 'Grocery', 'DailyBasket Kirana', 'Pari Chowk, Greater Noida', 0, '', 4.3, 99, 1, 28.4650, 77.5160, 'fa-basket-shopping', 'Free delivery above ₹300 · Open 7 AM – 10 PM'],
  ['daily', 'Mobile Repair', 'FoneDoc Repairs', 'Lajpat Nagar, Delhi', 399, ' onwards', 4.0, 38, 0, 28.5677, 77.2433, 'fa-mobile-screen', 'Screen, battery · Walk-in'],
  ['daily', 'Appliance Repair', 'CoolCare Appliances', 'Sector 29, Gurugram', 499, ' visit', 4.2, 61, 1, 28.4690, 77.0680, 'fa-plug', 'AC, fridge, washing machine · Available tomorrow'],
  ['health', 'Hospital', 'CityCare Multispeciality Hospital', 'Sector 39, Noida', 0, '', 4.2, 310, 0, 28.5680, 77.3400, 'fa-hospital', '24x7 emergency, ICU, pharmacy · Open 24 hours'],
  ['health', 'Clinic', 'Dr. Mehta Family Clinic', 'Sector 12, Noida', 300, ' consult', 4.4, 120, 0, 28.5990, 77.3470, 'fa-stethoscope', 'General physician · 9 AM – 8 PM'],
  ['health', 'Pharmacy', 'HealthFirst Pharmacy', 'Alpha 2, Greater Noida', 0, '', 4.1, 54, 0, 28.4770, 77.5200, 'fa-prescription-bottle-medical', 'Medicines & health products · Open 24 hours'],
  ['health', 'Diagnostic Lab', 'Accura Diagnostics', 'Sector 18, Noida', 499, ' onwards', 4.3, 77, 0, 28.5690, 77.3260, 'fa-microscope', 'Blood tests, scans · 7 AM – 9 PM'],
  ['transport', 'Public Transport', 'Aqua Line Metro (Noida)', 'Sector 51 – Depot, Noida', 20, '/trip', 4.4, 400, 1, 28.5740, 77.3560, 'fa-train-subway', 'Metro card accepted · Check official timings'],
  ['transport', 'Cab', 'QuickRide Cabs', 'City-wide, Delhi NCR', 12, '/km', 4.1, 260, 1, 28.6139, 77.209, 'fa-taxi', 'Estimated fare · Available 24x7'],
  ['transport', 'Bike Rental', 'RideEasy Bike Rentals', 'Sector 62, Noida', 350, '/day', 4.0, 44, 0, 28.6250, 77.3700, 'fa-motorcycle', 'Helmet included · ID needed'],
  ['transport', 'Car Rental', 'DriveAway Car Rentals', 'Sector 29, Gurugram', 1800, '/day', 4.3, 58, 1, 28.4700, 77.0600, 'fa-car', 'Self-drive hatchbacks & sedans'],
  ['transport', 'Vehicle Repair', 'TurboFix Garage', 'Sector 63, Noida', 799, '/service', 4.2, 66, 1, 28.6270, 77.3790, 'fa-wrench', 'Bike & car servicing · Pickup available'],
  ['daily', 'Tiffin', 'HomeBox Tiffin Service', 'Sector 62, Noida', 3500, '/month', 4.2, 57, 0, 28.62, 77.365, 'fa-bowl-food', 'Veg meals, lunch & dinner · Monthly plan'],
  ['daily', 'Tiffin', 'Maa Ki Rasoi Meals', 'Alpha 1, Greater Noida', 3000, '/month', 4.0, 33, 0, 28.473, 77.508, 'fa-utensils', 'Home-style meals · Delivery to PGs'],
  ['accommodation', 'Rental Room', 'Single Room, Attached Bath', 'Sector 76, Noida', 7000, '/month', 4.1, 19, 0, 28.566, 77.387, 'fa-door-open', 'Separate entry, WiFi, near bus stop', 'Co-ed|Single|Non-AC|No Food|Unfurnished']
];
const X_KEYS = ['g', 'sh', 'ac', 'f', 'fu'];
const DATA = ROWS.map((r, i) => ({
  id: i + 1, s: r[0], c: r[1], n: r[2], a: r[3], p: r[4], u: r[5], r: r[6], rv: r[7], v: r[8], la: r[9], lo: r[10], i: r[11], d: r[12],
  x: r[13] ? Object.fromEntries(r[13].split('|').map((v, k) => [X_KEYS[k], v])) : {},
  ph: '+91 90000 ' + (10000 + i * 7) // demo number only
}));

/* ---------- Section config (drives pages + filters) ---------- */
const SEC = {
  accommodation: { t: 'Accommodation', s: 'PGs, hostels, flats and roommates near you', cats: ['PG', 'Hostel', 'Flat', 'Rental Room', 'Roommate'], price: [6000, 9000, 12000, 20000], act: 'Book Now', x: [['g', 'Gender', ['Male', 'Female', 'Co-ed']], ['sh', 'Sharing', ['Single', 'Double', 'Triple']], ['ac', 'Cooling', ['AC', 'Non-AC']], ['f', 'Food', ['Food', 'No Food']], ['fu', 'Furnishing', ['Furnished', 'Unfurnished']]] },
  study: { t: 'Study & Work', s: 'Libraries, coaching centres, jobs and co-working spaces', cats: ['Library', 'Coaching', 'Job', 'Co-working'], price: [1000, 10000, 25000, 50000], act: 'Book Now' },
  daily: { t: 'Daily Services', s: 'Laundry, tiffin, repairs, cleaning and groceries', cats: ['Laundry', 'Salon', 'Electrician', 'Plumber', 'Cleaning', 'Grocery', 'Mobile Repair', 'Appliance Repair', 'Tiffin'], price: [200, 500, 1000, 3500], act: 'Book Service' },
  health: { t: 'Healthcare', s: 'Hospitals, clinics, pharmacies and diagnostic labs', cats: ['Hospital', 'Clinic', 'Pharmacy', 'Diagnostic Lab'], act: 'Call Now', note: 'Sample listings only. They are not real-time verified medical providers. Confirm details by phone. In an emergency call 112.' },
  transport: { t: 'Transport', s: 'Metro, cabs, rentals and vehicle servicing', cats: ['Public Transport', 'Cab', 'Bike Rental', 'Car Rental', 'Vehicle Repair'], price: [50, 500, 1000, 2000], act: 'Book Now', note: 'Prices are indicative estimates. Check operators for live fares and timings.' }
};
const CAT_ICONS = { accommodation: 'fa-bed', study: 'fa-book-open', daily: 'fa-broom', health: 'fa-heart-pulse', transport: 'fa-bus', emergency: 'fa-triangle-exclamation' };
const CAT_TEXT = { accommodation: 'PGs, hostels, flats and roommates', study: 'Libraries, coaching, jobs, co-working', daily: 'Laundry, repairs, cleaning, grocery', health: 'Hospitals, clinics, pharmacies, labs', transport: 'Metro, cabs, rentals, servicing', emergency: 'Police, ambulance, fire, helpline' };
const actLabel = x => x.c === 'Job' ? 'Apply Now' : SEC[x.s].act;
const NOTES = [['Welcome to SETTLEMATE', 'Pick your city to see nearby services.'], ['Offer unlocked', '10% off on your first booking (demo).'], ['New listings', 'Sample PGs added near Greater Noida.']];

/* ---------- Cards ---------- */
const saved = () => db.get('saved', []);
const dist = x => '~' + km(center(), [x.la, x.lo]).toFixed(1) + ' km';
function card(x) {
  const on = saved().includes(x.id);
  const price = x.p ? `${inr(x.p)}<small>${esc(x.u)}</small>` : 'Free / on request';
  const dir = x.s === 'health' ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${x.la},${x.lo}">Get Directions</a>` : '';
  return `<article class="card"><div class="thumb t${x.id % 4}"><i class="fa-solid ${x.i}" aria-hidden="true"></i>${x.v ? '<span class="badge"><i class="fa-solid fa-circle-check"></i> Verified (demo)</span>' : ''}<button class="heart ${on ? 'on' : ''}" data-save="${x.id}" aria-label="Save ${esc(x.n)}"><i class="fa-solid fa-heart"></i></button></div>
  <div class="body"><small class="cat">${esc(x.c)} · Sample</small><h3>${esc(x.n)}</h3><p class="muted"><i class="fa-solid fa-location-dot"></i> ${esc(x.a)} · ${dist(x)}</p>
  <div class="row"><span class="rate"><i class="fa-solid fa-star"></i> ${x.r} <small>(${x.rv})</small></span><strong>${price}</strong></div>
  <div class="row"><button class="btn ghost sm" data-detail="${x.id}">View Details</button><button class="btn sm" data-act="${x.id}">${actLabel(x)}</button>${dir}</div></div></article>`;
}
const empty = (msg = 'No matching listings') => `<div class="empty"><i class="fa-regular fa-face-meh"></i><h3>${msg}</h3><p>Try a different search or clear a filter.</p></div>`;
const fill = (sel, list) => { $(sel).innerHTML = list.length ? list.map(card).join('') : empty(); };

/* ---------- Build listing pages + filters ---------- */
const AREAS = ['Noida', 'Greater Noida', 'Delhi', 'Gurugram', 'Ghaziabad'];
Object.entries(SEC).forEach(([k, c]) => {
  const sec = document.createElement('section');
  sec.className = 'page'; sec.id = k; sec.hidden = true;
  const sel = (f, label, opts) => `<select data-f="${f}" aria-label="${label}"><option value="">${label}</option>${opts.map(o => `<option>${o}</option>`).join('')}</select>`;
  sec.innerHTML = `<div class="wrap"><div class="phead"><h2>${c.t}</h2><p class="muted">${c.s}</p>${c.note ? `<div class="note"><i class="fa-solid fa-circle-info"></i> ${c.note}</div>` : ''}</div>
  <div class="toolbar" data-sec="${k}"><input type="search" data-f="q" placeholder="Search ${c.t.toLowerCase()}…" aria-label="Search ${c.t}">
  ${sel('c', 'All types', c.cats)}
  ${sel('a', 'All areas', AREAS)}
  ${c.price ? `<select data-f="p" aria-label="Budget"><option value="">Any budget</option>${c.price.map(p => `<option value="${p}">Up to ${inr(p)}</option>`).join('')}</select>` : ''}
  ${(c.x || []).map(([f, l, o]) => sel(f, l + ': any', o)).join('')}
  <button class="btn ghost sm" data-reset>Reset</button></div><div class="grid" id="grid-${k}"></div></div>`;
  $('#listingPages').append(sec);
});

function renderSec(k) {
  const f = {};
  $$('[data-f]', $(`.toolbar[data-sec="${k}"]`)).forEach(el => f[el.dataset.f] = el.value);
  let l = DATA.filter(x => x.s === k);
  if (f.q) l = l.filter(x => (x.n + x.a + x.c + x.d).toLowerCase().includes(f.q.toLowerCase()));
  if (f.c) l = l.filter(x => x.c === f.c);
  if (f.p) l = l.filter(x => x.p <= +f.p);
  if (f.a) l = l.filter(x => x.a.split(/, | · /).includes(f.a));
  Object.keys(f).filter(i => !['q', 'c', 'p', 'a'].includes(i) && f[i]).forEach(i => l = l.filter(x => x.x[i] === f[i]));
  fill('#grid-' + k, l);
}

/* ---------- Home content ---------- */
$('#catGrid').innerHTML = Object.keys(CAT_ICONS).map(k => `<button class="catcard" data-go="${k}"><i class="fa-solid ${CAT_ICONS[k]}"></i><h3>${k === 'study' ? 'Study & Work' : k === 'daily' ? 'Daily Services' : k === 'health' ? 'Healthcare' : k[0].toUpperCase() + k.slice(1)}</h3><p>${CAT_TEXT[k]}</p><b>Explore <i class="fa-solid fa-arrow-right" style="width:auto;height:auto;background:none;font-size:.8rem;margin:0"></i></b></button>`).join('');
const renderPop = () => fill('#popGrid', DATA.filter(x => x.v).sort((a, b) => b.r - a.r).slice(0, 6));
$('#heroCity').innerHTML = Object.keys(CITIES).map(c => `<option>${c}</option>`).join('');
const chipsHTML = () => Object.keys(CITIES).map(c => `<button data-city="${c}" class="${c === city ? 'on' : ''}">${c}</button>`).join('');

function setCity(name, pos, place) {
  city = name; db.set('city', name);
  if (pos) db.set('pos', pos); else db.del('pos');
  if (place) db.set('place', place); else db.del('place');
  $('#cityLabel').textContent = place || name; $('#heroCity').value = name;
  $('#cityChips').innerHTML = chipsHTML();
  renderPop(); Object.keys(SEC).forEach(renderSec); updateEmergency();
}

/* ---------- Geolocation (permission is asked by the browser) ---------- */
function locate() {
  if (!navigator.geolocation) return toast('Location is not supported. Please choose a city.', true);
  toast('Your browser will ask for permission to use your location.');
  navigator.geolocation.getCurrentPosition(async p => {
    const pos = [p.coords.latitude, p.coords.longitude];
    let place = `${pos[0].toFixed(3)}, ${pos[1].toFixed(3)}`;
    try { // reverse geocoding via OpenStreetMap Nominatim (needs internet; fine for demos)
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos[0]}&lon=${pos[1]}`);
      const j = await r.json(); const a = j.address || {};
      place = a.city || a.town || a.suburb || a.state_district || place;
    } catch { /* keep coordinates */ }
    const nearest = Object.entries(CITIES).sort((a, b) => km(pos, a[1]) - km(pos, b[1]))[0][0];
    setCity(nearest, pos, place); closeModal(); toast('Location set: ' + place);
  }, () => { toast('Location blocked. Please pick your city manually.', true); openCityModal(); }, { timeout: 10000 });
}
function updateEmergency() {
  const pos = db.get('pos', null), place = db.get('place', '');
  $('#locText').textContent = pos ? `${place} (lat ${pos[0].toFixed(4)}, lng ${pos[1].toFixed(4)})` : 'Location not shared. Using city: ' + city;
  const near = q => pos ? `https://www.google.com/maps/search/${q}/@${pos[0]},${pos[1]},14z` : `https://www.google.com/maps/search/?api=1&query=${q}+near+${encodeURIComponent(city)}`;
  $('#nearHosp').href = near('hospital'); $('#nearPolice').href = near('police+station');
}

/* ---------- Modal ---------- */
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }
function openCityModal() {
  openModal(`<h3>Choose your city</h3><p class="muted">Pick a city or detect your location.</p><div class="chips">${chipsHTML()}</div><p><button class="btn teal" data-geo><i class="fa-solid fa-crosshairs"></i> Use My Current Location</button></p>`);
}

/* ---------- Details + booking ---------- */
function openDetail(id) {
  const x = DATA.find(i => i.id === id);
  openModal(`<span class="badge" ${x.v ? '' : 'hidden'}><i class="fa-solid fa-circle-check"></i> Verified (demo)</span><h3>${esc(x.n)}</h3><p class="muted">${esc(x.c)} · ${esc(x.a)} · ${dist(x)}</p>
  <p><i class="fa-solid fa-star" style="color:var(--teal)"></i> ${x.r} (${x.rv} reviews) · <strong>${x.p ? inr(x.p) + esc(x.u) : 'Free / on request'}</strong></p><p>${esc(x.d)}</p>
  <p class="muted">Contact (demo): ${x.ph}</p><div class="note">Sample listing for demonstration. Not a real provider.</div>
  <div class="row"><button class="btn" data-act="${x.id}">${actLabel(x)}</button><button class="btn ghost" data-enq="${x.id}">Enquire</button><a class="btn ghost" href="tel:${x.ph.replace(/\s/g, '')}">Call Now</a><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${x.la},${x.lo}">Directions</a></div>`);
}
function openBooking(id) {
  const x = DATA.find(i => i.id === id), pr = db.get('profile', {}), u = db.get('user', {});
  if (x.s === 'health') { location.href = 'tel:' + x.ph.replace(/\s/g, ''); return; }
  const today = new Date().toISOString().split('T')[0];
  openModal(`<h3>${actLabel(x)}: ${esc(x.n)}</h3><p class="muted">Demo checkout. No payment is collected.</p>
  <form id="bookForm" class="form" data-id="${id}" novalidate>
  <label>Your name<input name="name" value="${esc(pr.name || u.name || '')}" required></label>
  <label>Phone (10 digits)<input name="phone" inputmode="numeric" value="${esc(pr.phone || '')}" required></label>
  <label>Date<input type="date" name="date" min="${today}" required></label>
  <label>Time<select name="time"><option>09:00 AM</option><option>12:00 PM</option><option>03:00 PM</option><option>06:00 PM</option></select></label>
  <label>Notes (optional)<textarea name="notes" rows="2"></textarea></label><div class="err" id="bookErr"></div>
  <button class="btn">Confirm</button></form>`);
}
function submitBooking(form) {
  const d = Object.fromEntries(new FormData(form)), x = DATA.find(i => i.id === +form.dataset.id);
  const err = m => { $('#bookErr').textContent = m; };
  if (d.name.trim().length < 2) return err('Enter your name.');
  if (!/^[6-9]\d{9}$/.test(d.phone.trim())) return err('Enter a valid 10-digit Indian mobile number.');
  if (!d.date) return err('Pick a date.');
  const ref = 'SM' + Date.now().toString().slice(-6), list = db.get('bookings', []);
  list.unshift({ ref, id: x.id, name: x.n, date: d.date, time: d.time, status: 'Confirmed (demo)' });
  db.set('bookings', list);
  openModal(`<div class="success"><i class="fa-solid fa-circle-check"></i><h3>Booking confirmed</h3><p><strong>${esc(x.n)}</strong><br>${esc(d.date)} at ${esc(d.time)}</p><p class="muted">Reference ${ref}. Demo only, saved in this browser.</p><button class="btn" data-go="profile" data-tab="bookings">View my bookings</button></div>`);
  toast('Booking saved');
}

/* ---------- Auth (frontend simulation only; password is never stored) ---------- */
function openAuth(mode = 'login') {
  const reg = mode === 'register';
  openModal(`<div class="authlogo"><img class="logomark" src="assets/icons/logo-mark.svg" alt="SETTLEMATE logo"> <b>SETTLE<span style="color:var(--blue)">MATE</span></b></div><div class="mtabs"><button class="${reg ? '' : 'on'}" data-auth="login">Login</button><button class="${reg ? 'on' : ''}" data-auth="register">Register</button></div>
  <form id="authForm" class="form" data-mode="${mode}" novalidate>
  ${reg ? '<label>Name<input name="name" autocomplete="name"></label>' : ''}
  <label>Email<input name="email" type="email" autocomplete="email"></label>
  <label>Password<input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"></label>
  <div class="err" id="authErr"></div><button class="btn">${reg ? 'Create account' : 'Login'}</button>
  <small class="muted">Demo only: no real account or server is used.</small></form>`);
}
function submitAuth(form) {
  const d = Object.fromEntries(new FormData(form)), reg = form.dataset.mode === 'register';
  const err = m => { $('#authErr').textContent = m; };
  if (reg && (d.name || '').trim().length < 2) return err('Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(d.email)) return err('Enter a valid email.');
  if ((d.password || '').length < 6) return err('Password needs at least 6 characters.');
  const old = db.get('user', null);
  const name = reg ? d.name.trim() : (old && old.email === d.email ? old.name : d.email.split('@')[0]);
  db.set('user', { name, email: d.email });
  closeModal(); updateAuth(); toast('Welcome, ' + name + '!');
}
function updateAuth() { const u = db.get('user', null); $('#authBtn').textContent = u ? u.name.split(' ')[0] : 'Login'; }

/* ---------- Profile dashboard ---------- */
let ptab = 'overview';
function renderProfile() {
  const u = db.get('user', null), root = $('#profileRoot');
  if (!u) { root.innerHTML = `<div class="empty"><i class="fa-regular fa-user"></i><h3>Log in to see your dashboard</h3><p>Demo login. No real account is created.</p><button class="btn" data-auth="login">Login / Register</button></div>`; return; }
  const p = db.get('profile', { name: u.name, email: u.email, phone: '', city, state: '', occ: 'Student' });
  const tabs = [['overview', 'Overview'], ['details', 'Personal Details'], ['saved', 'Saved Places'], ['bookings', 'My Bookings'], ['reviews', 'My Reviews'], ['notes', 'Notifications'], ['settings', 'Account Settings']];
  let b = '';
  if (ptab === 'overview') {
    const sv = DATA.filter(x => saved().includes(x.id)), rc = db.get('recent', []), pl = db.get('place', '') || city;
    b = `<div class="note"><strong>Welcome back, ${esc(p.name.split(' ')[0])}!</strong> Selected location: <strong>${esc(pl)}</strong> <button class="linkbtn" data-city-open>Change</button></div>
    <h3>Recommended categories</h3><div class="chips dark">${['accommodation', 'daily', 'health', 'study'].map(k => `<button data-go="${k}">${SEC[k].t}</button>`).join('')}</div>
    <h3 style="margin-top:22px">Recent searches</h3><div class="chips dark">${rc.length ? rc.map(r => `<button data-search="${esc(r)}">${esc(r)}</button>`).join('') : '<p class="muted">No searches yet. Try the search bar on the home page.</p>'}</div>
    <h3 style="margin:22px 0 12px">Saved services (${sv.length})</h3>${sv.length ? `<div class="grid">${sv.slice(0, 3).map(card).join('')}</div>` : empty('No saved services yet')}`;
  }
  if (ptab === 'details') b = `<form id="profForm" class="form" novalidate><label>Full name<input name="name" value="${esc(p.name)}"></label><label>Email<input name="email" type="email" value="${esc(p.email)}"></label><label>Phone<input name="phone" value="${esc(p.phone)}" placeholder="10-digit mobile"></label><label>Current city<input name="city" value="${esc(p.city)}"></label><label>Home state<input name="state" value="${esc(p.state)}"></label><label>Occupation<select name="occ"><option ${p.occ === 'Student' ? 'selected' : ''}>Student</option><option ${p.occ === 'Working Professional' ? 'selected' : ''}>Working Professional</option></select></label><div class="err" id="profErr"></div><button class="btn">Save changes</button></form>`;
  if (ptab === 'saved') { const l = DATA.filter(x => saved().includes(x.id)); b = l.length ? `<div class="grid">${l.map(card).join('')}</div>` : empty('No saved places yet'); }
  if (ptab === 'bookings') { const l = db.get('bookings', []); b = l.length ? `<div class="list">${l.map(x => `<div class="item"><div><strong>${esc(x.name)}</strong><br><small class="muted">${esc(x.date)} · ${esc(x.time)} · Ref ${x.ref}</small></div><span class="badge">${esc(x.status)}</span></div>`).join('')}</div>` : empty('No bookings yet'); }
  if (ptab === 'reviews') { const l = db.get('reviews', []); b = `<form id="revForm" class="form"><label>Write a review (demo)<textarea name="text" rows="3"></textarea></label><label>Rating<select name="r"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><button class="btn sm">Post review</button></form><div class="list" style="margin-top:20px">${l.length ? l.map(x => `<div class="item"><span>${esc(x.text)}</span><span class="rate"><i class="fa-solid fa-star"></i> ${esc(x.r)}</span></div>`).join('') : '<p class="muted">No reviews yet.</p>'}</div>`; }
  if (ptab === 'notes') b = `<div class="list">${NOTES.map(n => `<div class="item"><div><strong>${n[0]}</strong><br><small class="muted">${n[1]}</small></div></div>`).join('')}</div>`;
  if (ptab === 'settings') { const s = db.get('settings', { mail: true }); b = `<div class="list"><label class="item switch"><span>Email me offers (demo)</span><input type="checkbox" id="setMail" ${s.mail ? 'checked' : ''}></label><div class="item"><span>Clear saved places, bookings and reviews</span><button class="btn ghost sm" id="clearData">Clear data</button></div><div class="item"><span>Log out of this demo</span><button class="btn sm danger" id="logoutBtn">Log out</button></div></div>`; }
  root.innerHTML = `<div class="pcover"><div class="avatar">${esc(p.name.slice(0, 1).toUpperCase())}</div><div><h2>${esc(p.name)}</h2><p class="muted">${esc(p.email)} · ${esc(p.occ)}</p></div></div><div class="ptabs">${tabs.map(t => `<button data-tab="${t[0]}" class="${t[0] === ptab ? 'on' : ''}">${t[1]}</button>`).join('')}</div>${b}`;
}

/* ---------- Search ---------- */
function runSearch(q) {
  q = q.trim().toLowerCase();
  const l = q ? DATA.filter(x => (x.n + x.a + x.c + x.d + x.s).toLowerCase().includes(q)) : DATA;
  if (q) db.set('recent', [q, ...db.get('recent', []).filter(r => r !== q)].slice(0, 5));
  $('#searchTitle').textContent = q ? `Results for "${q}" (${l.length})` : 'All listings';
  fill('#grid-search', l); location.hash = '#search';
}

/* ---------- Routing (hash based) ---------- */
function show() {
  const id = (location.hash || '#home').slice(1);
  if (id === 'login' || id === 'register') { history.replaceState(null, '', '#home'); openAuth(id); }
  const pages = $$('.page').map(p => p.id), pid = pages.includes(id) ? id : 'home';
  $$('.page').forEach(p => p.hidden = p.id !== pid);
  $$('#menu a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + pid));
  $('#menu').classList.remove('open'); window.scrollTo(0, 0);
  if (SEC[pid]) renderSec(pid);
  if (pid === 'profile') renderProfile();
  if (pid === 'home' && window.leafMap) setTimeout(() => window.leafMap.invalidateSize(), 50);
}
const go = (page, tab) => { if (tab) ptab = tab; closeModal(); if (location.hash === '#' + page) show(); else location.hash = '#' + page; };
window.addEventListener('hashchange', show);

/* ---------- Map (Leaflet + OpenStreetMap, with fallback) ---------- */
function initMap() {
  if (typeof L === 'undefined') { $('#map').hidden = true; $('#mapNote').hidden = false; $('#mapNote').textContent = 'Map could not load (no internet). Listings still work below.'; return; }
  try {
    window.leafMap = L.map('map').setView(CITIES['Noida'], 10);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(window.leafMap);
    tiles.on('tileerror', () => { $('#mapNote').hidden = false; $('#mapNote').textContent = 'Some map tiles failed to load. Check your internet connection.'; });
    DATA.forEach(x => L.marker([x.la, x.lo]).addTo(window.leafMap).bindPopup(`<strong>${esc(x.n)}</strong><br>${esc(x.c)} · ★ ${x.r}<br><button class="btn sm" data-detail="${x.id}" style="margin-top:6px">View Details</button>`));
  } catch { $('#map').hidden = true; $('#mapNote').hidden = false; $('#mapNote').textContent = 'Map is unavailable right now.'; }
}

/* ---------- Event delegation: one listener handles all buttons ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button,a,[data-go]'); if (!t) { if (!e.target.closest('.bellwrap')) $('#bellMenu').hidden = true; return; }
  const d = t.dataset;
  if (d.close !== undefined || t === $('#modal')) return closeModal();
  if (d.go) return go(d.go, d.tab);
  if (d.city) { setCity(d.city); closeModal(); return toast('City set to ' + d.city); }
  if (d.geo !== undefined) return locate();
  if (d.detail) return openDetail(+d.detail);
  if (d.act) return openBooking(+d.act);
  if (d.save) { let s = saved(); const id = +d.save; s = s.includes(id) ? s.filter(i => i !== id) : [...s, id]; db.set('saved', s); t.classList.toggle('on'); return toast(s.includes(id) ? 'Saved to your profile' : 'Removed from saved'); }
  if (d.enq) return openEnquiry(+d.enq);
  if (d.scroll) return $('#' + d.scroll).scrollIntoView({ behavior: 'smooth' });
  if (d.cityOpen !== undefined) return openCityModal();
  if (d.search) return runSearch(d.search);
  if (d.auth) return openAuth(d.auth);
  if (d.tab && t.closest('.ptabs')) { ptab = d.tab; return renderProfile(); }
  if (d.reset !== undefined) { const tb = t.closest('.toolbar'); $$('[data-f]', tb).forEach(i => i.value = ''); return renderSec(tb.dataset.sec); }
  if (d.offer !== undefined) return toast('Offer FIRST10 added (demo)');
  if (d.info) { const T = { about: ['About SETTLEMATE', 'SETTLEMATE helps students and professionals settle into a new city. This is a student prototype.'], contact: ['Contact Us', 'Email: hello@settlemate.example (demo address)'], privacy: ['Privacy Policy', 'Demo data stays in your browser (localStorage). Nothing is sent to a server.'], terms: ['Terms & Conditions', 'Prototype for learning. Listings are sample data and no real services are provided.'], help: ['Help & Support', 'Use the search bar, pick a city, then book a sample listing. For emergencies call 112.'], social: ['Social links', 'Social pages are not set up for this demo.'] }[d.info]; return openModal(`<h3>${T[0]}</h3><p>${T[1]}</p>`); }
  if (t.id === 'cityBtn') return openCityModal();
  if (t.id === 'searchBtn') { go('home'); setTimeout(() => $('#q').focus(), 100); return; }
  if (t.id === 'burger') return $('#menu').classList.toggle('open');
  if (t.id === 'authBtn') return db.get('user', null) ? go('profile') : openAuth('login');
  if (t.id === 'bellBtn') { const m = $('#bellMenu'); m.hidden = !m.hidden; m.innerHTML = '<h4>Notifications</h4>' + NOTES.map(n => `<p><strong>${n[0]}</strong><small>${n[1]}</small></p>`).join(''); $('#bellCount').hidden = true; return; }
  if (t.id === 'clearData') { ['saved', 'bookings', 'reviews'].forEach(db.del); toast('Demo data cleared'); return renderProfile(); }
  if (t.id === 'logoutBtn') { db.del('user'); updateAuth(); toast('Logged out'); return renderProfile(); }
});
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const tb = e.target.closest('.toolbar'); if (tb) renderSec(tb.dataset.sec);
  if (e.target.id === 'heroCity') setCity(e.target.value);
  if (e.target.id === 'setMail') db.set('settings', { mail: e.target.checked });
}));
document.addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  if (f.classList.contains('demoform')) return demoForm(f);
  if (f.id === 'heroForm') return runSearch($('#q').value);
  if (f.id === 'bookForm') return submitBooking(f);
  if (f.id === 'authForm') return submitAuth(f);
  if (f.id === 'profForm') {
    const d = Object.fromEntries(new FormData(f));
    if (d.name.trim().length < 2) return $('#profErr').textContent = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return $('#profErr').textContent = 'Enter a valid email.';
    if (d.phone && !/^[6-9]\d{9}$/.test(d.phone)) return $('#profErr').textContent = 'Phone must be 10 digits.';
    db.set('profile', d); const u = db.get('user', {}); db.set('user', { ...u, name: d.name, email: d.email }); updateAuth(); toast('Profile saved'); return renderProfile();
  }
  if (f.id === 'revForm') { const d = Object.fromEntries(new FormData(f)); if (!d.text.trim()) return toast('Write something first', true); const l = db.get('reviews', []); l.unshift(d); db.set('reviews', l); toast('Review posted'); return renderProfile(); }
});

/* ---------- Enquiry + contact (demo: nothing is sent or stored) ---------- */
function demoForm(f) {
  const d = Object.fromEntries(new FormData(f)), err = $('.err', f);
  if ((d.name || '').trim().length < 2) return err.textContent = 'Enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(d.email || '')) return err.textContent = 'Enter a valid email.';
  if ((d.message || '').trim().length < 10) return err.textContent = 'Write at least 10 characters.';
  f.reset(); err.textContent = ''; closeModal();
  toast('Thanks! Demo only: your message was not sent or stored.');
}
function openEnquiry(id) {
  const x = DATA.find(i => i.id === id);
  openModal(`<h3>Enquire: ${esc(x.n)}</h3><p class="muted">Demo form. Nothing is sent or saved.</p><form class="form demoform" novalidate><label>Your name<input name="name"></label><label>Email<input name="email" type="email"></label><label>Message<textarea name="message" rows="3"></textarea></label><div class="err"></div><button class="btn">Send enquiry</button></form>`);
}

/* ---------- Start ---------- */
$('#bellCount').hidden = false;
setCity(city, db.get('pos', null), db.get('place', ''));
updateAuth(); initMap(); show();
