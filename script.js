// ==========================================================
// Little To-Do 🎀 — script.js
// ==========================================================

// The key name we use to save/load our data in localStorage
const STORAGE_KEY = "little-todo-tasks";

// ----- Grab the HTML elements we need -----
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCounter = document.getElementById("task-counter");
const emptyState = document.getElementById("empty-state");
const emptyMessage = document.getElementById("empty-message");
const filterButtons = document.querySelectorAll(".filter-btn");

// ----- App state -----
// "tasks" is an array of objects like: { id: 123, text: "Buy milk", completed: false }
let tasks = loadTasks();

// "currentFilter" is one of: "all", "active", "completed"
let currentFilter = "all";

// ==========================================================
// SAVING & LOADING (localStorage)
// ==========================================================

// Load tasks from localStorage. Returns an empty array if anything goes wrong.
function loadTasks() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    // Nothing saved yet -> start with an empty list
    if (savedData === null) {
      return [];
    }

    // Convert the saved text back into a JavaScript value
    const parsed = JSON.parse(savedData);

    // The saved data must be an array, otherwise it's invalid
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Keep only items that look like real tasks (ignore broken ones)
    return parsed
      .filter(function (item) {
        return (
          item !== null &&
          typeof item === "object" &&
          typeof item.text === "string" &&
          item.text.trim() !== ""
        );
      })
      .map(function (item, index) {
        return {
          // If an id is missing or not a number, make a new unique one
          id: typeof item.id === "number" ? item.id : Date.now() + index,
          text: item.text,
          completed: item.completed === true
        };
      });
  } catch (error) {
    // Happens if the JSON is corrupted OR localStorage is blocked/unavailable
    console.warn("Could not load saved tasks:", error);
    return [];
  }
}

// Save the current tasks to localStorage. Never crashes the app.
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // For example: private browsing mode or storage is full/blocked
    console.warn("Could not save tasks:", error);
  }
}

// ==========================================================
// TASK ACTIONS (add, toggle, delete)
// ==========================================================

// Add a new task
function addTask(text) {
  const cleanText = text.trim();

  // Ignore empty or whitespace-only tasks
  if (cleanText === "") {
    return;
  }

  const newTask = {
    id: Date.now(), // a simple unique number based on the current time
    text: cleanText,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  render();
}

// Flip a task between active and completed
function toggleTask(id) {
  tasks = tasks.map(function (task) {
    if (task.id === id) {
      return { id: task.id, text: task.text, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  render();
}

// Remove a task from the list
function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  saveTasks();
  render();
}

// ==========================================================
// FILTERING
// ==========================================================

// Return only the tasks that match the selected filter
function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter(function (task) {
      return !task.completed;
    });
  }
  if (currentFilter === "completed") {
    return tasks.filter(function (task) {
      return task.completed;
    });
  }
  return tasks; // "all"
}

// Highlight the selected filter button
function updateFilterButtons() {
  filterButtons.forEach(function (button) {
    const isSelected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

// ==========================================================
// DRAWING THE PAGE (render)
// ==========================================================

// Build one <li> element for a task.
// We use textContent (NOT innerHTML) so typed text is never treated as HTML. This is safe!
function createTaskElement(task) {
  const listItem = document.createElement("li");
  listItem.className = "task-item";
  if (task.completed) {
    listItem.classList.add("completed");
  }

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Mark task as completed: " + task.text);
  checkbox.addEventListener("change", function () {
    toggleTask(task.id);
  });

  // Task text
  const textSpan = document.createElement("span");
  textSpan.className = "task-text";
  textSpan.textContent = task.text; // safe: shows the text exactly as typed

  // Delete button
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-delete";
  deleteButton.textContent = "✕";
  deleteButton.setAttribute("aria-label", "Delete task: " + task.text);
  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  // Put the pieces together
  listItem.appendChild(checkbox);
  listItem.appendChild(textSpan);
  listItem.appendChild(deleteButton);

  return listItem;
}

// Update the "X tasks left" text
function updateCounter() {
  const activeCount = tasks.filter(function (task) {
    return !task.completed;
  }).length;

  // Use singular "task" when there is exactly 1
  const word = activeCount === 1 ? "task" : "tasks";
  taskCounter.textContent = activeCount + " " + word + " left";
}

// Show a cute message when there is nothing to display
function updateEmptyState(visibleCount) {
  if (visibleCount > 0) {
    emptyState.hidden = true;
    return;
  }

  // Pick a message that matches the situation
  if (tasks.length === 0) {
    emptyMessage.textContent = "Your list is empty — add something sweet to start your day! 🌷";
  } else if (currentFilter === "active") {
    emptyMessage.textContent = "No active tasks — everything is done! You did amazing 🎀";
  } else if (currentFilter === "completed") {
    emptyMessage.textContent = "Nothing completed yet — you've got this! 🌸";
  } else {
    emptyMessage.textContent = "Nothing to show here.";
  }

  emptyState.hidden = false;
}

// The main function: redraws everything based on the current state
function render() {
  const visibleTasks = getVisibleTasks();

  // Clear the old list
  taskList.textContent = "";

  // Add each visible task to the page
  visibleTasks.forEach(function (task) {
    taskList.appendChild(createTaskElement(task));
  });

  updateCounter();
  updateEmptyState(visibleTasks.length);
  updateFilterButtons();
}

// ==========================================================
// EVENT LISTENERS
// ==========================================================

// Submitting the form (clicking Add OR pressing Enter) adds the task
taskForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading
  addTask(taskInput.value);
  taskInput.value = "";   // clear the input
  taskInput.focus();      // ready for the next task
});

// Clicking a filter button changes the filter
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    render();
  });
});

// ==========================================================
// START THE APP
// ==========================================================
render();