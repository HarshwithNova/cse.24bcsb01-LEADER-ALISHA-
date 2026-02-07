const API_BASE = "http://localhost:5000/api";

async function loadAsteroids() {
  const res = await fetch(`${API_BASE}/asteroids?limit=20`);
  const data = await res.json();
  renderAsteroids(data.data);
}

async function loadHazardous() {
  const res = await fetch(`${API_BASE}/asteroids?hazardous=true`);
  const data = await res.json();
  renderAsteroids(data.data);
}

function renderAsteroids(asteroids) {
  const container = document.getElementById("asteroids");
  container.innerHTML = "";

  asteroids.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.name}</h3>
      <p>Diameter: ${a.diameter.toFixed(2)} km</p>
      <p class="${a.hazardous ? "hazard" : "safe"}">
        ${a.hazardous ? "⚠ Hazardous" : "✅ Safe"}
      </p>
    `;
    card.onclick = () => loadDetails(a.id);
    container.appendChild(card);
  });
}

async function loadDetails(id) {
  const res = await fetch(`${API_BASE}/asteroids/${id}`);
  const data = await res.json();

  document.getElementById("details").textContent =
    JSON.stringify(data, null, 2);

  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
