let allAsteroids = [];
let filtered = [];
let page = 1;
const LIMIT = 6;

async function loadAsteroids() {
  const res = await fetch("/api/asteroids");
  allAsteroids = await res.json();
  filtered = [...allAsteroids];
  document.getElementById("loading").style.display = "none";
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById("search").value.toLowerCase();
  const sort = document.getElementById("sort").value;
  const hazard = document.getElementById("hazard").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  filtered = allAsteroids.filter(a => {
    if (search && !a.name.toLowerCase().includes(search)) return false;
    if (hazard && String(a.hazardous) !== hazard) return false;
    if (start && a.approachDate < start) return false;
    if (end && a.approachDate > end) return false;
    return true;
  });

  if (sort === "diameter")
    filtered.sort((a, b) => b.diameter - a.diameter);
  if (sort === "velocity")
    filtered.sort((a, b) => b.velocity - a.velocity);
  if (sort === "date")
    filtered.sort((a, b) =>
      new Date(a.approachDate) - new Date(b.approachDate)
    );

  page = 1;
  render();
}

function render() {
  const start = (page - 1) * LIMIT;
  const visible = filtered.slice(start, start + LIMIT);

  document.getElementById("asteroids").innerHTML =
    visible.map(a => `
      <div class="card ${a.hazardous ? "danger" : ""}">
        <h3>${a.name}</h3>
        <p>📅 ${a.approachDate}</p>
        <p>⚠️ Hazardous: ${a.hazardous}</p>
        <p>📏 Diameter: ${a.diameter} km</p>
        <button onclick="openDetail('${a.id}')">Details</button>
      </div>
    `).join("");

  document.getElementById("page").innerText =
    `Page ${page} of ${Math.ceil(filtered.length / LIMIT)}`;
}

function openDetail(id) {
  window.location.href = `/detail?id=${id}`;
}

function nextPage() {
  if (page * LIMIT < filtered.length) {
    page++;
    render();
  }
}

function prevPage() {
  if (page > 1) {
    page--;
    render();
  }
}

["search", "sort", "hazard", "startDate", "endDate"]
  .forEach(id => document.getElementById(id).addEventListener("input", applyFilters));

loadAsteroids();
