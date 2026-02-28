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
  const containers = ["task-list", "calendar-task-list"];
  const tasks = loadTasks();
  containers.forEach((id) => {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = "";
    tasks.forEach((task, idx) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.dataset.index = idx;

      // expand button for subtasks
      const expand = document.createElement("button");
      expand.className = "expand-btn";
      expand.textContent = task.subtasks && task.subtasks.length ? "▼" : "▶";
      expand.addEventListener("click", () => {
        const sub = li.querySelector(".subtask-container");
        if (sub) {
          sub.classList.toggle("hidden");
          expand.textContent = sub.classList.contains("hidden") ? "▶" : "▼";
        }
      });

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        tasks[idx].completed = checkbox.checked;
        saveTasks(tasks);
        updateProgress();
        renderTasks(); // re-render to update subtasks across all containers
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

      li.appendChild(expand);
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(del);

      // container for subtasks and input
      const container = document.createElement("div");
      container.className = "subtask-container hidden";

      const subul = document.createElement("ul");
      subul.className = "subtask-list";
      if (task.subtasks && task.subtasks.length) {
        task.subtasks.forEach((st, sidx) => {
          const sli = document.createElement("li");
          sli.className = "subtask-item";

          const scheckbox = document.createElement("input");
          scheckbox.type = "checkbox";
          scheckbox.checked = st.completed;
          scheckbox.addEventListener("change", () => {
            tasks[idx].subtasks[sidx].completed = scheckbox.checked;
            saveTasks(tasks);
            updateProgress();
            renderTasks();
          });

          const sspan = document.createElement("span");
          sspan.textContent = st.text;
          if (st.completed) sspan.classList.add("completed");

          const sdel = document.createElement("button");
          sdel.textContent = "✕";
          sdel.className = "delete-btn";
          sdel.addEventListener("click", () => {
            tasks[idx].subtasks.splice(sidx, 1);
            saveTasks(tasks);
            renderTasks();
            updateProgress();
          });

          sli.appendChild(scheckbox);
          sli.appendChild(sspan);
          sli.appendChild(sdel);
          subul.appendChild(sli);
        });
      }
      container.appendChild(subul);

      const subInput = document.createElement("input");
      subInput.type = "text";
      subInput.placeholder = "Add subtask...";
      subInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && subInput.value.trim()) {
          addSubtask(idx, subInput.value.trim());
          subInput.value = "";
        }
      });
      container.appendChild(subInput);

      li.appendChild(container);

      // toggle container visibility when expand clicked
      expand.addEventListener("click", () => {
        container.classList.toggle("hidden");
        expand.textContent = container.classList.contains("hidden") ? "▶" : "▼";
      });

      list.appendChild(li);
    });
  });
}

function addTask(text) {
  if (!text) return;
  const tasks = loadTasks();
  tasks.push({ text, completed: false, subtasks: [] });
  saveTasks(tasks);
  renderTasks();
  updateProgress();
}

function addSubtask(taskIndex, text) {
  if (!text) return;
  const tasks = loadTasks();
  const task = tasks[taskIndex];
  if (!task.subtasks) task.subtasks = [];
  task.subtasks.push({ text, completed: false });
  saveTasks(tasks);
  renderTasks();
  updateProgress();
}

function promptNewTask() {
  const input = document.getElementById("new-task-input");
  const text = input.value.trim();
  if (text) {
    addTask(text);
    input.value = "";
  }
}

function promptBrainDump() {
  const text = prompt("Brain dump:\n(Type whatever comes to mind)");
  if (text) {
    // for MVP just add as a normal task with note prefix
    addTask(`🧠 ${text}`);
  }
}

function updateProgress() {
  const tasks = loadTasks();
  let total = 0;
  let done = 0;
  tasks.forEach((t) => {
    total += 1;
    if (t.completed) done += 1;
    if (t.subtasks) {
      t.subtasks.forEach((st) => {
        total += 1;
        if (st.completed) done += 1;
      });
    }
  });
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

  const addBtn = document.getElementById("add-task-btn");
  if (addBtn) addBtn.addEventListener("click", promptNewTask);
  const input = document.getElementById("new-task-input");
  if (input) input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") promptNewTask();
  });
  const brainBtn = document.getElementById("brain-dump-btn");
  if (brainBtn) brainBtn.addEventListener("click", promptBrainDump);
  const sensBtn = document.getElementById("sensory-toggle");
  if (sensBtn) sensBtn.addEventListener("click", toggleSensoryMode);
});
