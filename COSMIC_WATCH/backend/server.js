import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Serve frontend
const FRONTEND_PATH = path.join(__dirname, "public");
app.use(express.static(FRONTEND_PATH));

// 🚀 Cache setup
let asteroidCache = null;
let cacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Fetch asteroids from NASA
async function fetchAsteroids() {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + 6);

  const startDate = today.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${process.env.NASA_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const asteroids = [];
  for (const date in data.near_earth_objects) {
    data.near_earth_objects[date].forEach(a => {
      asteroids.push({
        id: a.id,
        name: a.name,
        hazardous: a.is_potentially_hazardous_asteroid,
        diameter: a.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2),
        velocity: a.close_approach_data[0].relative_velocity.kilometers_per_hour,
        missDistance: a.close_approach_data[0].miss_distance.kilometers,
        approachDate: date,
        orbitingBody: a.close_approach_data[0].orbiting_body,
        closeApproachData: a.close_approach_data
      });
    });
  }
  return asteroids;
}

// API routes
app.get("/api/asteroids", async (req, res) => {
  try {
    if (asteroidCache && Date.now() - cacheTime < CACHE_DURATION) {
      return res.json(asteroidCache);
    }
    const data = await fetchAsteroids();
    asteroidCache = data;
    cacheTime = Date.now();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/asteroids/:id", async (req, res) => {
  try {
    if (!asteroidCache) {
      asteroidCache = await fetchAsteroids();
      cacheTime = Date.now();
    }
    const asteroid = asteroidCache.find(a => a.id === req.params.id);
    if (!asteroid) return res.status(404).json({ error: "Asteroid not found" });
    res.json(asteroid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
