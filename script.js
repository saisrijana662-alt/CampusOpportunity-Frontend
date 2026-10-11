// ===================================================================
// CampusOpportunity - common JavaScript used by every page
// ===================================================================

const API_BASE_URL = "const API_BASE_URL = "https://campusopportunity-backend.onrender.com/api";";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"];
const TYPES = ["Internship", "Hackathon", "Placement", "Scholarship", "Competition"];
const STATUSES = ["Applied", "Assessment", "Interview", "Selected", "Rejected"];

// ---------- API helpers ----------

// Calls the backend and returns the JSON. Throws an Error with a readable message on failure.
async function apiRequest(path, method = "GET", body = null) {
    const options = { method: method, headers: {} };
    if (body !== null) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(API_BASE_URL + path, options);
    } catch (e) {
        throw new Error("Cannot reach the server. Is the Spring Boot backend running on port 8080?");
    }

    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data && data.message ? data.message : "Request failed (" + response.status + ")");
    }
    return data;
}

// ---------- logged-in student (localStorage) ----------

function getStudent() {
    const text = localStorage.getItem("student");
    return text ? JSON.parse(text) : null;
}

function saveStudent(student) {
    localStorage.setItem("student", JSON.stringify(student));
}

// Call at the top of pages that need login. Returns the student, or redirects to login.
function requireLogin() {
    const student = getStudent();
    if (!student) {
        window.location.href = "login.html";
        return null;
    }
    return student;
}

function logout() {
    localStorage.removeItem("student");
    window.location.href = "login.html";
}

// ---------- navigation bar ----------

function renderNavbar(activePage) {
    const student = getStudent();
    let links = "";

    if (student) {
        links += navLink("dashboard.html", "Dashboard", activePage);
        links += navLink("opportunities.html", "Opportunities", activePage);
        links += navLink("saved.html", "Saved", activePage);
        links += navLink("applications.html", "Applications", activePage);
        links += navLink("profile.html", "Profile", activePage);
        links += '<a href="#" onclick="logout(); return false;">Logout</a>';
    } else {
        links += navLink("index.html", "Home", activePage);
        links += navLink("opportunities.html", "Opportunities", activePage);
        links += navLink("login.html", "Login", activePage);
        links += navLink("register.html", "Register", activePage);
    }
    links += navLink("admin.html", "Admin", activePage);

    document.getElementById("navbar").innerHTML =
        '<nav class="navbar">' +
        '<a class="brand" href="' + (student ? "dashboard.html" : "index.html") + '">🎓 CampusOpportunity</a>' +
        '<button class="menu-btn" onclick="document.getElementById(\'nav-links\').classList.toggle(\'open\')">☰</button>' +
        '<div class="nav-links" id="nav-links">' + links + '</div>' +
        '</nav>';
}

function navLink(file, label, activePage) {
    const cls = file === activePage ? ' class="active"' : "";
    return '<a href="' + file + '"' + cls + '>' + label + '</a>';
}

// ---------- small utilities ----------

// Prevents HTML injection when we put text into innerHTML.
function esc(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function showMessage(elementId, text, type) {
    const box = document.getElementById(elementId);
    if (!box) return;
    box.className = "message " + (type || "error");
    box.textContent = text;
    box.style.display = "block";
}

function hideMessage(elementId) {
    const box = document.getElementById(elementId);
    if (box) box.style.display = "none";
}

function formatDate(dateText) {
    if (!dateText) return "Not specified";
    const d = new Date(dateText + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function splitSkills(text) {
    if (!text) return [];
    return text.split(",").map(s => s.trim()).filter(s => s.length > 0);
}

// ---------- deadline status ----------

// Returns { text, css, daysLeft }  ->  Open / Deadline Approaching / Closed
function getDeadlineStatus(deadline) {
    if (!deadline) return { text: "Open", css: "badge-open", daysLeft: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(deadline + "T00:00:00");
    const daysLeft = Math.round((end - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: "Closed", css: "badge-closed", daysLeft: daysLeft };
    if (daysLeft <= 7) return { text: "Deadline Approaching", css: "badge-warning", daysLeft: daysLeft };
    return { text: "Open", css: "badge-open", daysLeft: daysLeft };
}

function deadlineBadge(deadline) {
    const s = getDeadlineStatus(deadline);
    return '<span class="badge ' + s.css + '">' + s.text + '</span>';
}

function statusBadge(status) {
    return '<span class="badge status-' + esc(status) + '">' + esc(status) + '</span>';
}

// ---------- reusable opportunity card ----------

// extraButtons = extra HTML placed after the "View Details" button
function opportunityCard(o, extraButtons) {
    return '<div class="card opp-card">' +
        '<div class="card-top"><span class="badge type-' + esc(o.type) + '">' + esc(o.type) + '</span>' +
        deadlineBadge(o.deadline) + '</div>' +
        '<h3>' + esc(o.title) + '</h3>' +
        '<p class="company">' + esc(o.company) + '</p>' +
        '<ul class="info">' +
        '<li>📍 ' + esc(o.location || "Not specified") + '</li>' +
        '<li>📅 Deadline: ' + formatDate(o.deadline) + '</li>' +
        '<li>🎯 Min CGPA: ' + (o.minCgpa ? esc(o.minCgpa) : "None") + '</li>' +
        '<li>🏫 Branch: ' + esc(o.eligibleBranch || "All") + '</li>' +
        '</ul>' +
        '<div class="card-actions">' +
        '<a class="btn btn-primary btn-sm" href="opportunity-details.html?id=' + o.id + '">View Details</a>' +
        (extraButtons || "") +
        '</div></div>';
}

// Fills a <select> with the branch list
function fillBranchSelect(selectId, firstLabel) {
    const select = document.getElementById(selectId);
    let html = firstLabel ? '<option value="">' + firstLabel + '</option>' : "";
    BRANCHES.forEach(b => { html += '<option value="' + b + '">' + b + '</option>'; });
    select.innerHTML = html;
}

function fillTypeSelect(selectId, firstLabel) {
    const select = document.getElementById(selectId);
    let html = firstLabel ? '<option value="">' + firstLabel + '</option>' : "";
    TYPES.forEach(t => { html += '<option value="' + t + '">' + t + '</option>'; });
    select.innerHTML = html;
}
