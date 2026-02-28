// calendar.js - manages events and countdown logic

const EVENTS_KEY = "calendar_events";
let countdownInterval = null;

function loadEvents() {
  const raw = localStorage.getItem(EVENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEvents(evts) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(evts));
}

function renderEvents() {
  const ul = document.getElementById("event-list");
  ul.innerHTML = "";
  const events = loadEvents();
  events.sort((a, b) => new Date(a.time) - new Date(b.time));
  events.forEach((evt, idx) => {
    const li = document.createElement("li");
    const date = new Date(evt.time);
    li.textContent = `${evt.title} @ ${date.toLocaleString()}${evt.location ? " (" + evt.location + ")" : ""}`;

    const del = document.createElement("button");
    del.textContent = "✕";
    del.style.marginLeft = "1rem";
    del.addEventListener("click", () => {
      events.splice(idx, 1);
      saveEvents(events);
      renderEvents();
      updateCountdown();
    });

    li.appendChild(del);
    ul.appendChild(li);
  });
  // always refresh countdown after rebuilding list
  updateCountdown();
}

function showEventForm(show) {
  const form = document.getElementById("event-form");
  if (show) {
    form.classList.remove("hidden");
  } else {
    form.classList.add("hidden");
  }
}

function clearForm() {
  document.getElementById("event-title-input").value = "";
  document.getElementById("event-time-input").value = "";
  document.getElementById("event-location-input").value = "";
  document.getElementById("event-reminder-input").checked = false;
}

function addEventFromForm() {
  const title = document.getElementById("event-title-input").value.trim();
  const time = document.getElementById("event-time-input").value;
  const location = document.getElementById("event-location-input").value.trim();
  const reminder = document.getElementById("event-reminder-input").checked;
  if (!title || !time) return;

  const events = loadEvents();
  events.push({ title, time, location, reminder });
  // keep persisted list sorted so renderEvents and countdown are simpler
  events.sort((a, b) => new Date(a.time) - new Date(b.time));
  saveEvents(events);
  renderEvents();
  updateCountdown();
  clearForm();
  showEventForm(false);
}

function updateCountdown() {
  const now = new Date();
  // include events occurring right now or in the future
  const events = loadEvents().filter(e => new Date(e.time) >= now);
  if (events.length === 0) {
    document.getElementById("countdown-text").textContent = "--:--";
    document.getElementById("leave-text").textContent = "";
    return;
  }
  events.sort((a, b) => new Date(a.time) - new Date(b.time));
  const next = events[0];
  const now = new Date();
  const then = new Date(next.time);
  const diffMs = then - now;
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);
  const mm = String(diffMin).padStart(2, "0");
  const ss = String(diffSec).padStart(2, "0");
  document.getElementById("countdown-text").textContent = `${mm}:${ss}`;

  // countdown ring relative to 60 minutes window
  const circle = document.getElementById("countdown-ring-circle");
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  let pct = 0;
  if (diffMin <= 60) {
    pct = (diffMin * 60 + diffSec) / 3600; // fraction of hour remaining
  } else {
    pct = 1; // full ring if more than hour away
  }
  const offset = circumference - pct * circumference;
  circle.style.strokeDashoffset = offset;

  // leave text (15‑minute buffer)
  const leaveMin = diffMin - 15;
  if (leaveMin <= 0) {
    document.getElementById("leave-text").textContent = "Leave now!";
  } else {
    document.getElementById("leave-text").textContent = `Leave in ${leaveMin} min`;
  }
}

function populateWeekGrid() {
  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";
  const now = new Date();
  // start on Sunday (0) or Monday based on locale? we'll use Sunday for simplicity
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const cell = document.createElement("div");
    cell.className = "week-cell";
    cell.innerHTML = `<strong>${d.toLocaleDateString(undefined, { weekday: 'short' })}</strong><br>${d.getDate()}`;
    grid.appendChild(cell);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  renderEvents();
  updateCountdown();
  populateWeekGrid();

  document.getElementById("add-event-btn").addEventListener("click", () => showEventForm(true));
  document.getElementById("cancel-event-btn").addEventListener("click", () => {
    showEventForm(false);
    clearForm();
  });
  document.getElementById("save-event-btn").addEventListener("click", addEventFromForm);

  // refresh countdown every second
  countdownInterval = setInterval(updateCountdown, 1000);
});