// renderer.js - runs in the browser window (renderer process)

// keep tasks in localStorage to persist across restarts
const TASKS_KEY = "daily_tasks";

function loadTasks() {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";
  const tasks = loadTasks();
  tasks.forEach((task, idx) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      tasks[idx].completed = checkbox.checked;
      saveTasks(tasks);
      updateProgress();
    });

    const span = document.createElement("span");
    span.textContent = task.text;
    if (task.completed) {
      span.classList.add("completed");
    }

    const del = document.createElement("button");
    del.textContent = "✕";
    del.className = "delete-btn";
    del.addEventListener("click", () => {
      tasks.splice(idx, 1);
      saveTasks(tasks);
      renderTasks();
      updateProgress();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function addTask(text) {
  if (!text) return;
  const tasks = loadTasks();
  tasks.push({ text, completed: false });
  saveTasks(tasks);
  renderTasks();
  updateProgress();
}

function updateProgress() {
  const tasks = loadTasks();
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-text").textContent = `${pct}%`;
  const circle = document.getElementById("progress-ring-circle");
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  const offset = circumference - (pct / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function promptNewTask() {
  const text = prompt("Enter task:");
  if (text) addTask(text);
}

function promptBrainDump() {
  const text = prompt("Brain dump:\n(Type whatever comes to mind)");
  if (text) {
    // for MVP just add as a normal task with note prefix
    addTask(`🧠 ${text}`);
  }
}

function toggleSensoryMode() {
  const body = document.body;
  body.classList.toggle("sensory-mode");
}

function setTodayDate() {
  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  document.getElementById("today-date").textContent = today.toLocaleDateString(undefined, options);
}

window.addEventListener("DOMContentLoaded", () => {
  setTodayDate();
  renderTasks();
  updateProgress();
  document.getElementById("add-task-btn").addEventListener("click", promptNewTask);
  document.getElementById("brain-dump-btn").addEventListener("click", promptBrainDump);
  document.getElementById("sensory-toggle").addEventListener("click", toggleSensoryMode);
});
