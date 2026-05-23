// API key will be loaded from server endpoint (/api/key) which reads .env
// If you don't run the server, set the key manually here or use localStorage.
let API_KEY = '377cbedd0be4b2ce5e424f922a468c33';

let form, cityInput, weatherDiv;

function initDOM() {
  form = document.getElementById('searchForm');
  cityInput = document.getElementById('cityInput');
  weatherDiv = document.getElementById('weather');
  const themeSelect = document.getElementById('themeSelect');

  // theme select handling
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const t = e.target.value || 'default';
      applyTheme(t);
      localStorage.setItem('theme', t);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = cityInput.value.trim();
      if (city) getWeather(city);
    });
  } else {
    console.warn('Search form not found in DOM');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDOM);
} else {
  initDOM();
}

// Try to load API key from server (/api/key). This requires running the
// Node server (see README) which reads .env.
async function loadServerKey() {
  try {
    const res = await fetch('/api/key');
    if (!res.ok) return;
    const j = await res.json();
    if (j && j.key) {
      API_KEY = j.key;
      console.log('Loaded API key from server');
    }
  } catch (e) {
    console.warn('Could not load API key from server', e);
  }
}

loadServerKey();

// load persisted theme
function applyTheme(theme) {
  // Remove existing theme classes
  document.documentElement.classList.remove('neubrutal', 'dark', 'glass');
  if (!theme || theme === 'default') return;
  if (theme === 'neubrutal' || theme === 'dark' || theme === 'glass') {
    document.documentElement.classList.add(theme);
  }
}

function loadTheme() {
  const t = localStorage.getItem('theme') || 'default';
  applyTheme(t);
}

loadTheme();
// set select value after DOM init if present
document.addEventListener('DOMContentLoaded', () => {
  const s = document.getElementById('themeSelect');
  const t = localStorage.getItem('theme') || 'default';
  if (s) s.value = t;
});

// Background image support removed — using gradient backgrounds only.
document.documentElement.style.setProperty('--bg-image', 'none');

async function getWeather(city) {
  if (!weatherDiv) {
    // try to find or create the container so we don't crash
    weatherDiv = document.getElementById('weather') || document.createElement('section');
    if (!weatherDiv.id) {
      weatherDiv.id = 'weather';
      weatherDiv.className = 'weather-card';
      const main = document.querySelector('main');
      if (main) main.appendChild(weatherDiv);
      else document.body.appendChild(weatherDiv);
    }
  }
  weatherDiv.innerHTML = '<p class="hint">Loading…</p>';
  try {
    if (!API_KEY || API_KEY.length < 10 || API_KEY.includes('REPLACE')) {
      throw new Error('Missing or invalid API key. Open `script.js` and set your OpenWeather API key.');
    }
    const currUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const fcastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

    const [currRes, fcastRes] = await Promise.all([
      fetch(currUrl),
      fetch(fcastUrl)
    ]);

    if (!currRes.ok) {
      // try to read API error message
      let msg = `HTTP ${currRes.status} ${currRes.statusText}`;
      try {
        const j = await currRes.json();
        if (j && j.message) msg += ` — ${j.message}`;
      } catch (e) {
        // ignore JSON parse errors
      }
      if (currRes.status === 401) msg = 'Unauthorized — invalid API key.';
      if (currRes.status === 404) msg = 'City not found.';
      throw new Error(msg);
    }
    const curr = await currRes.json();

    let forecast = null;
    if (fcastRes.ok) {
      try {
        const fdata = await fcastRes.json();
        forecast = parseForecast(fdata);
      } catch (e) {
        // ignore forecast parse errors and continue with current weather
        console.warn('Failed to parse forecast response', e);
      }
    } else {
      // non-fatal: forecast endpoint failed
      console.warn('Forecast request failed', fcastRes.status, fcastRes.statusText);
    }

    renderWeather(curr, forecast);
  } catch (err) {
    if (!weatherDiv) {
      const main = document.querySelector('main') || document.body;
      const e = document.createElement('p');
      e.className = 'error';
      e.textContent = err.message;
      main.appendChild(e);
    } else {
      weatherDiv.innerHTML = `<p class="error">${err.message}</p>`;
    }
  }
}

function renderWeather(data) {
  const { name } = data;
  const { temp, humidity } = data.main;
  const { speed } = data.wind;
  const { description, icon } = data.weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const currentHtml = `
    <div class="weather-grid">
      <img class="icon" src="${iconUrl}" alt="${description}" />
      <div class="details">
        <div class="temp">${Math.round(temp)}°C</div>
        <div class="sub">${description}</div>
        <div class="sub">Humidity: ${humidity}%</div>
        <div class="sub">Wind: ${speed} m/s</div>
        <div class="sub">Location: ${name}</div>
      </div>
    </div>`;

  const forecastDiv = document.getElementById('forecast');
  let currentDiv = document.getElementById('current');
  let fDiv = forecastDiv;
  if (!currentDiv) {
    currentDiv = document.createElement('div');
    currentDiv.id = 'current';
    currentDiv.className = 'current-placeholder';
    if (weatherDiv) weatherDiv.insertBefore(currentDiv, weatherDiv.firstChild);
    else document.body.appendChild(currentDiv);
  }
  currentDiv.innerHTML = currentHtml;
  if (!fDiv) {
    fDiv = document.createElement('div');
    fDiv.id = 'forecast';
    fDiv.className = 'forecast-container';
    if (weatherDiv) weatherDiv.appendChild(fDiv);
    else document.body.appendChild(fDiv);
  }
  if (arguments.length > 1 && arguments[1]) {
    renderForecast(arguments[1], fDiv);
  } else {
    fDiv.innerHTML = '';
  }
}

function parseForecast(fdata) {
  // fdata.list contains 3-hour entries. We'll pick one entry per day (prefer 12:00)
  const byDate = {};
  fdata.list.forEach(item => {
    const dt = new Date(item.dt * 1000);
    const dateKey = dt.toISOString().slice(0,10);
    if (!byDate[dateKey]) {
      byDate[dateKey] = [];
    }
    byDate[dateKey].push(item);
  });

  const days = Object.keys(byDate).slice(0,5).map(dateKey => {
    const items = byDate[dateKey];
    // try to find 12:00 entry
    let choice = items.find(it => new Date(it.dt * 1000).getUTCHours() === 12);
    if (!choice) choice = items[Math.floor(items.length/2)];
    return choice;
  });
  return days;
}

function renderForecast(days, container) {
  if (!container) container = document.getElementById('forecast');
  const html = `
    <div class="forecast-list">
      ${days.map(d => {
        const dt = new Date(d.dt * 1000);
        const day = dt.toLocaleDateString(undefined, { weekday: 'short' });
        const icon = d.weather[0].icon;
        const desc = d.weather[0].description;
        const temp = Math.round(d.main.temp);
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        return `
          <div class="forecast-item">
            <div class="day">${day}</div>
            <img src="${iconUrl}" alt="${desc}" width="48" height="48" />
            <div class="f-temp">${temp}°C</div>
            <div class="sub">${desc}</div>
          </div>`;
      }).join('')}
    </div>`;
  container.innerHTML = html;
}

// Optional: load a sample city on first open
// getWeather('New York');