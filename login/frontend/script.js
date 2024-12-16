// Token management functions
function saveToken(token) {
  localStorage.setItem("accessToken", token);
}

function getToken() {
  return localStorage.getItem("accessToken");
}

function removeToken() {
  localStorage.removeItem("accessToken");
}

// Toggle between login and register forms
function toggleForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm.classList.toggle("hidden");
  registerForm.classList.toggle("hidden");
}

// Check authentication status on page load
document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname;
  const token = getToken();

  if (currentPage.includes("dashboard")) {
    if (!token) {
      window.location.href = "index.html";
    } else {
      // Fetch user data on dashboard load
      fetchUserData();
      loadTasks(); // Load tasks when on dashboard
    }
  } else if (currentPage.includes("index.html") || currentPage === "/") {
    if (token) {
      window.location.href = "dashboard.html";
    }
  }
});

// Fetch user data
async function fetchUserData() {
  const token = getToken();
  try {
    const response = await fetch("http://localhost:5000/api/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await response.json();

    if (response.ok) {
      document.getElementById("userInfo").innerHTML = `
        <h2>Welcome, ${userData.username}!</h2>
        <p>Email: ${userData.email}</p>
      `;
    } else {
      throw new Error(userData.error || "Failed to fetch user data");
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    alert("Failed to load user data. Please login again.");
    removeToken();
    window.location.href = "index.html";
  }
}

// Task management
async function loadTasks() {
  const token = getToken();

  try {
    const response = await fetch("http://localhost:5000/api/task/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const tasks = await response.json();

    if (response.ok) {
      const taskListItems = document.getElementById("taskListItems");
      taskListItems.innerHTML = ""; // Clear previous tasks

      tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          ${task.task}
          <button onclick="updateTask(${task.task_id}, '${task.task}')">Update</button>
          <button onclick="deleteTask(${task.task_id}, '${task.task}')">Delete</button>
        `;

        taskListItems.appendChild(listItem);
      });
    } else {
      throw new Error(tasks.error || "Failed to load tasks");
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
    alert(error.message);
  }
}

// Create task
async function createTask() {
  const token = getToken();
  const taskInput = prompt("Enter your new task:");

  if (taskInput && taskInput.trim()) {
    try {
      const response = await fetch("http://localhost:5000/api/task/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: taskInput.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Task created successfully");
        loadTasks(); // Refresh task list
      } else {
        throw new Error(data.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.message);
    }
  }
}

// Update task
async function updateTask(taskId, currentTask) {
  const token = getToken();
  const newTask = prompt("Edit your task:", currentTask);

  if (newTask && newTask.trim() && newTask !== currentTask) {
    try {
      const response = await fetch("http://localhost:5000/api/task/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, newTask: newTask.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Task updated successfully");
        loadTasks(); // Refresh task list
      } else {
        throw new Error(data.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert(error.message);
    }
  }
}

// Delete task
async function deleteTask(taskId, taskName) {
  const token = getToken();

  if (confirm(`Are you sure you want to delete the task: "${taskName}"?`)) {
    try {
      const response = await fetch("http://localhost:5000/api/task/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Task deleted successfully");
        loadTasks(); // Refresh task list
      } else {
        throw new Error(data.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(error.message);
    }
  }
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      saveToken(data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed. Please try again.");
  }
}

// Handle logout
async function handleLogout() {
  const token = getToken();

  if (token) {
    try {
      const response = await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        removeToken();
        window.location.href = "index.html";
      } else {
        alert(data.error || "Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed. Please try again.");
    }
  } else {
    window.location.href = "index.html";
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  // Comprehensive client-side validation
  if (!username || username.length < 3) {
    alert("Username must be at least 3 characters long");
    return;
  }

  if (!email || !email.includes("@")) {
    alert("Please enter a valid email address");
    return;
  }

  if (!password || password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful. Please login.");
      toggleForms();
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (err) {
    console.error("Registration error:", err);
    alert("Registration failed. Please try again.");
  }
}
