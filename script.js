// ============================
// API CONFIGURATION
// ============================
const apiKey = "ff0c2d8c3eaa51acf4ab760404a14598";
const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric`;
const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=metric`;

// ============================
// DOM ELEMENTS
// ============================
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weatherIcon");
const unitToggle = document.getElementById("unitToggle");

let currentUnit = "metric"; // Can be "metric" or "imperial"

// ============================
// UTILITY FUNCTIONS
// ============================

// Convert temperature based on unit
function convertTemp(temp, unit) {
  return unit === "imperial"
    ? Math.round((temp * 9) / 5 + 32)
    : Math.round(temp);
}

// Format time (used for hourly forecast)
function formatTime(dtTxt) {
  const date = new Date(dtTxt);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Map weather condition code to icon
function setWeatherIcon(code) {
  const iconMap = {
    "01d": "clear.png",
    "01n": "night.png",
    "02d": "clouds.png",
    "02n": "clouds-night.png",
    "03d": "clouds.png",
    "03n": "clouds.png",
    "04d": "clouds.png",
    "04n": "clouds.png",
    "09d": "rain.png",
    "09n": "rain.png",
    "10d": "rain.png",
    "10n": "rain.png",
    "11d": "rain.png",
    "11n": "rain.png",
    "13d": "snow.png",
    "13n": "snow.png",
    "50d": "mist.png",
    "50n": "mist.png",
  };
  return `images/${iconMap[code] || "clear.png"}`;
}

// ============================
// MAIN FUNCTION - Fetch and Display Weather
// ============================
async function checkWeather(city) {
  try {
    const response = await fetch(
      `${currentWeatherUrl}&q=${city}&appid=${apiKey}`
    );
    const forecastRes = await fetch(`${forecastUrl}&q=${city}&appid=${apiKey}`);

    if (!response.ok || !forecastRes.ok) throw new Error("Invalid city");

    const data = await response.json();
    const forecastData = await forecastRes.json();

    const isF = currentUnit === "imperial";

    // Update weather data in UI
    document.querySelector(".city").textContent = data.name;
    document.querySelector(".temp").textContent =
      convertTemp(data.main.temp, currentUnit) + (isF ? "°F" : "°C");
    document.querySelector(".humidity").textContent = data.main.humidity + "%";
    document.querySelector(".wind").textContent = data.wind.speed + " km/h";
    weatherIcon.src = setWeatherIcon(data.weather[0].icon);

    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";

    // Show next 4 forecast slots (3-hour intervals = ~12 hours)
    renderHourlyForecast(forecastData.list.slice(0, 4), isF);
  } catch (err) {
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
  }
}

// ============================
// RENDER HOURLY FORECAST CARDS
// ============================
function renderHourlyForecast(data, isF) {
  const forecastContainer = document.querySelector(".hourly-forecast");
  forecastContainer.innerHTML = "";

  data.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("hourly-card");

    const icon = setWeatherIcon(item.weather[0].icon);
    const temp = convertTemp(item.main.temp, isF);
    const time = formatTime(item.dt_txt);

    card.innerHTML = `
      <p>${time}</p>
      <img src="${icon}" alt="icon">
      <p>${temp}°${isF ? "F" : "C"}</p>
    `;
    forecastContainer.appendChild(card);
  });
}

// ============================
// EVENT LISTENERS
// ============================

// Search button click handler
searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value);
});

// Toggle between Celsius and Fahrenheit
unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggle.textContent =
    currentUnit === "metric" ? "Switch to °F" : "Switch to °C";
  checkWeather(searchBox.value || "New York"); // Fallback if empty
});

// ============================
// GEOLOCATION - Load Weather on Page Load
// ============================
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const res = await fetch(
            `${currentWeatherUrl}&lat=${lat}&lon=${lon}&appid=${apiKey}`
          );
          const forecastRes = await fetch(
            `${forecastUrl}&lat=${lat}&lon=${lon}&appid=${apiKey}`
          );

          const data = await res.json();
          const forecastData = await forecastRes.json();

          const isF = currentUnit === "imperial";

          // Update UI with geolocation-based data
          document.querySelector(".city").textContent = data.name;
          document.querySelector(".temp").textContent =
            convertTemp(data.main.temp, currentUnit) + (isF ? "°F" : "°C");
          document.querySelector(".humidity").textContent =
            data.main.humidity + "%";
          document.querySelector(".wind").textContent =
            data.wind.speed + " km/h";
          weatherIcon.src = setWeatherIcon(data.weather[0].icon);

          document.querySelector(".weather").style.display = "block";
          document.querySelector(".error").style.display = "none";

          renderHourlyForecast(forecastData.list.slice(0, 4), isF);
        } catch (err) {
          alert("Failed to load location weather.");
        }
      },
      () => {
        checkWeather("New York"); // If permission denied
      }
    );
  } else {
    checkWeather("New York"); // Fallback if geolocation not supported
  }
});
