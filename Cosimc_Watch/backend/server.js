import express from "express";
import dotenv from "dotenv";
import compression from "compression";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 SPEED MIDDLEWARE
app.use(compression());
app.use(express.json());
app.use(express.static("public"));

// 🚀 CACHE (acts like Redis for now)
let asteroidCache = null;
let cacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 min

// 🛰️ FETCH ASTEROIDS (NASA)
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
        diameter:
          a.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2),
        velocity:
          a.close_approach_data[0].relative_velocity.kilometers_per_hour,
        missDistance:
          a.close_approach_data[0].miss_distance.kilometers,
        approachDate: date
      });
    });
  }
  return asteroids;
}

// 📌 LIST API
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

// 📌 DETAIL API
app.get("/api/asteroids/:id", (req, res) => {
  const asteroid = asteroidCache?.find(a => a.id === req.params.id);
  if (!asteroid) return res.status(404).json({ error: "Not found" });
  res.json(asteroid);
});

// 🌐 FRONTEND ROUTES
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "public/detail.html"));
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
