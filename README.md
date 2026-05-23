# Weather App

Simple Weather App using the JavaScript Fetch API and OpenWeather Current Weather API.

Features
- Search city weather
- Shows temperature, humidity, wind, description and icon

Setup
1. Get a free API key from OpenWeather: https://openweathermap.org/api
2. Open `script.js` and replace `REPLACE_WITH_YOUR_API_KEY` with your API key.
3. Open `index.html` in a browser (double-click or serve with a static server).

Alternative (easier): open `index.html` in your browser and paste your OpenWeather API key into the input at the top of the page, then click `Save Key`.
Server (recommended for using `.env`)

- Create a `.env` file in the `weather-app` folder containing:

	OPENWEATHER_API_KEY=YOUR_API_KEY

- Install dependencies and start the local server which serves the site and exposes the key at `/api/key`:

	```bash
	cd weather-app
	npm install
	npm start
	```

- Open `http://localhost:3000` in your browser. The site will fetch the API key from the server automatically.

Note: Serving the key still exposes it to clients. For production, keep the API key server-side and proxy weather requests so the key is never sent to browsers.

Files
- `index.html` — minimal UI and form
- `style.css` — simple styles
- `script.js` — fetch logic and rendering

Notes
- Uses metric units (°C). To change units, update the `units` query param in `script.js`.
- Icons come from OpenWeather's icon endpoint.

Forecast
- This version adds a simple 5-day forecast (one entry per day) using the OpenWeather `forecast` endpoint.
- The forecast selects a single 3-hour entry per day (prefers 12:00 if available) and displays an icon and temperature.

Want enhancements? I can add autocomplete, forecast, or localStorage for last search.