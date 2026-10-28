
const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const statusText = document.getElementById("status");
const weatherResult = document.getElementById("weather-result");

// Weather descriptions
const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm"
};

// Weather icons
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if ([1, 2].includes(code)) return "🌤️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
    if ([71, 73, 75].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    return "🌦️";
}

// Search weather when the form is submitted
weatherForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusText.textContent = "Please enter a city name.";
        return;
    }

    statusText.textContent = "Loading weather...";
    weatherResult.hidden = true;

    try {
        // Step 1: Find the city
        const geoUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to search for this city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Check the spelling and try again.");
        }

        const place = geoData.results[0];

        // Step 2: Get current weather and five-day forecast
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to get weather data. Please try again.");
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        // Step 3: Display current weather
        document.getElementById("city-name").textContent =
            `${place.name}${place.country ? ", " + place.country : ""}`;

        document.getElementById("weather-icon").textContent =
            getWeatherIcon(current.weather_code);

        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature_2m)}°C`;

        document.getElementById("description").textContent =
            weatherDescriptions[current.weather_code] || "Weather information available";

        document.getElementById("humidity").textContent =
            `${current.relative_humidity_2m}%`;

        document.getElementById("wind-speed").textContent =
            `${current.wind_speed_10m} km/h`;

        // Step 4: Display five-day forecast
        const forecastList = document.getElementById("forecast-list");
        forecastList.innerHTML = "";

        const daily = weatherData.daily;

        daily.time.forEach(function (date, index) {
            const code = daily.weather_code[index];

            const day = new Date(date + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "short" }
            );

            const card = document.createElement("div");
            card.className = "forecast-card";

            const dayName = document.createElement("strong");
            dayName.textContent = day;

            const icon = document.createElement("span");
            icon.className = "forecast-icon";
            icon.textContent = getWeatherIcon(code);

            const temperatures = document.createElement("span");
            temperatures.textContent =
                `${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°C`;

            const description = document.createElement("small");
            description.textContent =
                weatherDescriptions[code] || "Weather";

            card.append(dayName, icon, temperatures, description);
            forecastList.appendChild(card);
        });

        statusText.textContent = "Weather updated successfully.";
        weatherResult.hidden = false;

    } catch (error) {
        statusText.textContent =
            error.message || "Something went wrong. Please try again.";
    }
});
