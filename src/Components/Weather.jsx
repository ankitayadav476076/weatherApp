import React, { useEffect, useRef, useState } from "react";
import "./Weather.css";
import search_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";
import wind_icon from "../assets/wind.png";
import humidity_icon from "../assets/humidity.png";

const Weather = () => {
  const inputRef = useRef();

  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bgClass, setBgClass] = useState("clear");
  const [isNight, setIsNight] = useState(false);

  const allIcon = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02n": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon,
  };

  // 🔹 Set weather info + background
  const setWeatherInfo = (data) => {
    if (!data || !data.weather) return;

    const icon = allIcon[data.weather[0].icon] || clear_icon;

    setWeatherData({
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      temperature: Math.floor(data.main.temp),
      location: data.name,
      icon: icon,
      description: data.weather[0].description,
      temp_min: Math.floor(data.main.temp_min),
      temp_max: Math.floor(data.main.temp_max),
    });

    // Weather background
    const main = data.weather[0].main.toLowerCase();
    if (main.includes("cloud")) setBgClass("clouds");
    else if (main.includes("rain")) setBgClass("rain");
    else if (main.includes("snow")) setBgClass("snow");
    else if (main.includes("drizzle")) setBgClass("drizzle");
    else setBgClass("clear");
  };

  // 🔹 Forecast
  const getForecast = async (lat, lon) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();
      const daily = data.list.filter((item) =>
        item.dt_txt.includes("12:00:00")
      );
      setForecastData(daily.slice(0, 5));
    } catch {
      console.log("Forecast error");
    }
  };

  // 🔍 Search by city
  const search = async (city) => {
    if (!city) return alert("Enter City Name");
    setLoading(true);
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      await new Promise((r) => setTimeout(r, 3000));
      const data = await response.json();
      if (!response.ok) {
        alert(data.message);
        setWeatherData(null);
        setLoading(false);
        return;
      }
      setWeatherInfo(data);
      if (data.coord) await getForecast(data.coord.lat, data.coord.lon);
      setLoading(false);
    } catch {
      setWeatherData(null);
      setLoading(false);
    }
  };

  // 📍 Search by location
  const searchByLocation = async (lat, lon) => {
    setLoading(true);
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      await new Promise((r) => setTimeout(r, 3000));
      const data = await response.json();
      setWeatherInfo(data);
      await getForecast(lat, lon);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  // 📌 Get location on start
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        searchByLocation(
          position.coords.latitude,
          position.coords.longitude
        );
      });
    } else {
      search("London");
    }

    // Auto day/night based on time
    const hour = new Date().getHours();
    setIsNight(hour >= 18 || hour < 6);
  }, []);

  return (
    <div className={`weather ${bgClass} ${isNight ? "night" : ""}`}>
      <div className="search-bar">
        {loading && <p>Loading...</p>}

        <input
          ref={inputRef}
          type="text"
          placeholder="Search"
          onKeyDown={(e) => {
            if (e.key === "Enter") search(inputRef.current.value);
          }}
        />

        <img
          src={search_icon}
          alt=""
          onClick={() => search(inputRef.current.value)}
        />

        {/* Manual toggle */}
        <button
          className="theme-toggle"
          onClick={() => setIsNight(!isNight)}
        >
          {isNight ? "Switch to Day" : "Switch to Night"}
        </button>
      </div>

      {weatherData && (
        <>
          <img src={weatherData.icon} alt="" className="weather-icon" />
          <p className="temperature">{weatherData.temperature}°C</p>
          <p className="description">{weatherData.description}</p>
          <p className="location">{weatherData.location}</p>
          <p className="temp-range">
            {weatherData.temp_min}°C / {weatherData.temp_max}°C
          </p>

          <div className="weather-data">
            <div className="col">
              <img src={humidity_icon} alt="" />
              <div>
                <p>{weatherData.humidity}%</p>
                <span>Humidity</span>
              </div>
            </div>

            <div className="col">
              <img src={wind_icon} alt="" />
              <div>
                <p>{weatherData.windSpeed} km/h</p>
                <span>Wind Speed</span>
              </div>
            </div>
          </div>

          <div className="forecast">
            {forecastData.map((item, index) => (
              <div key={index} className="forecast-card">
                <p>
                  {new Date(item.dt_txt).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </p>
                <img src={allIcon[item.weather[0].icon] || clear_icon} alt="" />
                <p>{Math.floor(item.main.temp)}°C</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Weather;