import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------- CACHE ----------------
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const asteroidCache = {}; // date-based cache
const detailCache = {};   // single asteroid cache

const getCacheKey = (start, end) => `${start}_${end}`;

// ---------------- HELPERS ----------------
function formatAsteroids(data) {
  const asteroids = [];

  for (const date in data.near_earth_objects) {
    for (const a of data.near_earth_objects[date]) {
      asteroids.push({
        id: a.id,
        name: a.name,
        hazardous: a.is_potentially_hazardous_asteroid,
        diameter:
          a.estimated_diameter.kilometers.estimated_diameter_max,
        velocity:
          Number(a.close_approach_data[0].relative_velocity.kilometers_per_hour),
        distance:
          Number(a.close_approach_data[0].miss_distance.kilometers),
        approachDate: a.close_approach_data[0].close_approach_date
      });
    }
  }

  return asteroids;
}

// ---------------- ROUTES ----------------

// HEALTH CHECK
app.get("/api/status", (req, res) => {
  res.json({ status: "NASA API Server Running 🚀" });
});

// MAIN ASTEROID LIST
app.get("/api/asteroids", async (req, res) => {
  try {
    let {
      start,
      end,
      hazardous,
      q,
      page = 1,
      limit = 20,
      sort
    } = req.query;

    const today = new Date().toISOString().slice(0, 10);
    start = start || today;
    end = end || start;

    const cacheKey = getCacheKey(start, end);

    let asteroids;

    // ---- CACHE HIT ----
    if (
      asteroidCache[cacheKey] &&
      Date.now() - asteroidCache[cacheKey].time < CACHE_TIME
    ) {
      asteroids = asteroidCache[cacheKey].data;
      console.log("⚡ Served from cache");
    } else {
      console.log("🌐 Fetching from NASA API");

      const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${process.env.NASA_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      asteroids = formatAsteroids(data);

      asteroidCache[cacheKey] = {
        data: asteroids,
        time: Date.now()
      };
    }

    // ---- FILTERING ----
    if (hazardous === "true")
      asteroids = asteroids.filter(a => a.hazardous);
    if (hazardous === "false")
      asteroids = asteroids.filter(a => !a.hazardous);

    // ---- SEARCH ----
    if (q)
      asteroids = asteroids.filter(a =>
        a.name.toLowerCase().includes(q.toLowerCase())
      );

    // ---- SORTING ----
    if (sort === "size")
      asteroids.sort((a, b) => b.diameter - a.diameter);
    if (sort === "distance")
      asteroids.sort((a, b) => a.distance - b.distance);
    if (sort === "velocity")
      asteroids.sort((a, b) => b.velocity - a.velocity);

    // ---- PAGINATION ----
    const total = asteroids.length;
    const startIndex = (page - 1) * limit;
    const paginated = asteroids.slice(
      startIndex,
      startIndex + Number(limit)
    );

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: paginated
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch asteroid data",
      details: err.message
    });
  }
});

// SINGLE ASTEROID DETAILS
app.get("/api/asteroids/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // CACHE HIT
    if (detailCache[id]) {
      return res.json(detailCache[id]);
    }

    const url = `https://api.nasa.gov/neo/rest/v1/neo/${id}?api_key=${process.env.NASA_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    const details = {
      id: data.id,
      name: data.name,
      hazardous: data.is_potentially_hazardous_asteroid,
      diameter:
        data.estimated_diameter.kilometers.estimated_diameter_max,
      nasaUrl: data.nasa_jpl_url,
      approaches: data.close_approach_data.map(a => ({
        date: a.close_approach_date,
        velocity: a.relative_velocity.kilometers_per_hour,
        distance: a.miss_distance.kilometers,
        orbitingBody: a.orbiting_body
      }))
    };

    detailCache[id] = details;
    res.json(details);

  } catch (err) {
    res.status(500).json({ error: "Asteroid not found" });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
