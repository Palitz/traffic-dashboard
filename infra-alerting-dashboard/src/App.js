import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// Add a global style to ensure map container is visible
const mapStyle = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{
    id: 'osm',
    type: 'raster',
    source: 'osm',
    minzoom: 0,
    maxzoom: 19
  }]
};

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [route, setRoute] = useState(null);
  const [trafficPrediction, setTrafficPrediction] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [endCoordinates, setEndCoordinates] = useState(null);
  const [theme, setTheme] = useState('light');
  const [departureTime, setDepartureTime] = useState(new Date().toISOString().slice(0, 16));
  const [weather, setWeather] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [80.2707, 13.0827], // Chennai coordinates
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl());

    map.current.on('load', () => {
      setMapInstance(map.current);
      map.current.resize();
    });

    return () => {
      map.current.remove();
    };
  }, []);

  const mockPlaceSearch = (query) => {
    // Mock locations in Chennai
    const locations = [
      { name: 'T Nagar', coordinates: [80.2278, 13.0478] },
      { name: 'Anna Nagar', coordinates: [80.0897, 13.0827] },
      { name: 'Adyar', coordinates: [80.2539, 13.0067] },
      { name: 'Mylapore', coordinates: [80.2707, 13.0341] },
      { name: 'Guindy', coordinates: [80.2189, 13.0067] }
    ];

    return locations.filter(loc => 
      loc.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    map.current.flyTo({
      center: place.coordinates,
      zoom: 14
    });
  };

  const fetchWeather = async (location) => {
    // Mock weather data
    setWeather({
      temperature: 32,
      condition: 'Sunny',
      humidity: 65,
      windSpeed: 12
    });
  };

  const fetchHistoricalData = async (route) => {
    try {
      // In a real app, you would fetch actual historical data
      // For demo purposes, we'll simulate historical traffic patterns
      const now = new Date();
      
      // Simulate historical data based on time of day
      let trafficPattern = [];
      for (let i = 0; i < 24; i++) {
        let level = 'Moderate';
        let factor = 1.2;
        
        if (i >= 7 && i <= 9) {
          level = 'Heavy';
          factor = 1.5;
        } else if (i >= 17 && i <= 19) {
          level = 'Heavy';
          factor = 1.5;
        } else if (i >= 23 || i <= 5) {
          level = 'Light';
          factor = 1.1;
        }
        
        trafficPattern.push({
          hour: i,
          level,
          factor,
          time: `${i}:00`
        });
      }
      
      setHistoricalData(trafficPattern);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const predictTraffic = async () => {
    if (!startLocation || !endLocation || !departureTime) return;

    // Mock traffic prediction
    const prediction = {
      route: [
        [80.2278, 13.0478], // T Nagar
        [80.2539, 13.0067], // Adyar
        [80.2707, 13.0341]  // Mylapore
      ],
      trafficLevels: [
        { segment: 0, level: 'high' },
        { segment: 1, level: 'medium' }
      ],
      estimatedTime: 45,
      confidence: 0.85
    };

    setTrafficPrediction(prediction);
    visualizeRoute(prediction);
  };

  const visualizeRoute = (prediction) => {
    if (!map.current) return;

    // Remove existing route layer if any
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add new route layer
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: prediction.route
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#0080ff',
        'line-width': 4
      }
    });

    // Fit map to route bounds
    const bounds = new maplibregl.LngLatBounds();
    prediction.route.forEach(coord => bounds.extend(coord));
    map.current.fitBounds(bounds, { padding: 50 });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getTrafficColor = (level) => {
    switch (level) {
      case 'Heavy': return '#ff4444';
      case 'Moderate': return '#ffbb33';
      case 'Light': return '#00C851';
      default: return '#0080ff';
    }
  };

  return (
    <div className="App" data-theme={theme}>
      <header className="app-header">
        <h1>Chennai Traffic Predictor</h1>
        <button className="theme-switch" onClick={toggleTheme}>
          <span className="theme-icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <div className="search-section">
        <div className="input-group">
          <label>Start Location</label>
          <div className="search-box">
            <input
              type="text"
              value={startLocation}
              onChange={(e) => {
                setStartLocation(e.target.value);
                setSuggestions(mockPlaceSearch(e.target.value));
              }}
              placeholder="Enter start location"
            />
            {suggestions.length > 0 && (
              <div className="search-results">
                {suggestions.map((place, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    {place.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label>End Location</label>
          <div className="search-box">
            <input
              type="text"
              value={endLocation}
              onChange={(e) => {
                setEndLocation(e.target.value);
                setSuggestions(mockPlaceSearch(e.target.value));
              }}
              placeholder="Enter end location"
            />
            {suggestions.length > 0 && (
              <div className="search-results">
                {suggestions.map((place, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    {place.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label>Time of Departure</label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="datetime-input"
          />
        </div>

        <button 
          className="predict-button" 
          onClick={predictTraffic}
          disabled={loading || !startCoordinates || !endCoordinates}
        >
          {loading ? 'Predicting...' : 'Predict Traffic'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="map-container" ref={mapContainer}>
        {!mapInstance && <div className="map-loading">Loading map...</div>}
      </div>

      {weather && (
        <div className="weather-info">
          <h2>Weather Information</h2>
          <p>Temperature: {weather.temperature}°C</p>
          <p>Condition: {weather.condition}</p>
          <p>Humidity: {weather.humidity}%</p>
          <p>Wind Speed: {weather.windSpeed} km/h</p>
        </div>
      )}
      
      {trafficPrediction && (
        <div className="prediction-results">
          <h2>Traffic Prediction Results</h2>
          <p>Estimated Travel Time: {trafficPrediction.estimatedTime} minutes</p>
          <p>Confidence: {(trafficPrediction.confidence * 100).toFixed(1)}%</p>
        </div>
      )}

      {historicalData && (
        <div className="route-info-card">
          <h3>Historical Traffic Patterns</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Current Hour</span>
              <span className="value">{new Date().getHours()}:00</span>
            </div>
            <div className="info-item">
              <span className="label">Departure Hour</span>
              <span className="value">{new Date(departureTime).getHours()}:00</span>
            </div>
            <div className="info-item">
              <span className="label">Best Time to Leave</span>
              <span className="value">
                {historicalData
                  .filter(d => d.level === 'Light')
                  .sort((a, b) => a.hour - b.hour)[0]?.time || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Worst Time to Leave</span>
              <span className="value">
                {historicalData
                  .filter(d => d.level === 'Heavy')
                  .sort((a, b) => b.factor - a.factor)[0]?.time || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 