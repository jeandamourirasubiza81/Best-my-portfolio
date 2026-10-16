
/* ==========================================
   J.D.I DASHBOARD - MAIN JAVASCRIPT
   HTML, CSS, JavaScript + LocalStorage
========================================== */

"use strict";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const $ = (id) => document.getElementById(id);

const BLOGS_KEY = "jeanBlogs";
const PROJECTS_KEY = "jeanProjects";
const CONTACTS_KEY = "portfolioMessages";
const ADMIN_NAME_KEY = "dashboardAdminName";
const THEME_KEY = "dashboardTheme";

let editingBlogId = null;
let editingProjectId = null;

let selectedBlogImage = "";
let selectedProjectImage = "";

// ==========================================
// UNIQUE ID
// ==========================================

function makeId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

// ==========================================
// LOCAL STORAGE
// ==========================================

function getItems(key) {
    try {
        const value = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error("Could not read storage:", error);
        return [];
    }
}

function saveItems(key, items) {
    try {
        localStorage.setItem(key, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error("Could not save storage:", error);

        alert(
            "Could not save data. Browser storage may be full."
        );

        return false;
    }
}

// ==========================================
// BLOGS AND PROJECTS
// ==========================================

function getBlogs() {
    return getItems(BLOGS_KEY).map((item, index) => ({
        ...item,
        id: item.id ?? `blog-${index}-${item.title || ""}`,
        title: item.title || "",
        content: item.content ?? item.description ?? "",
        image: item.image || "",
        date: item.date || new Date().toISOString()
    }));
}

function getProjects() {
    return getItems(PROJECTS_KEY).map((item, index) => ({
        ...item,
        id: item.id ?? `project-${index}-${item.title || ""}`,
        title: item.title || "",
        description: item.description ?? item.content ?? "",
        image: item.image || "",
        date: item.date || new Date().toISOString()
    }));
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// ==========================================
// STATUS MESSAGES
// ==========================================

function showMessage(element, message, isError = false) {
    if (!element) return;

    element.textContent = message;
    element.style.display = "block";
    element.style.color = isError ? "#ff4d4d" : "#22c55e";
}

function hideMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.style.display = "none";
}

// ==========================================
// PAGE NAVIGATION
// ==========================================

const pages = {
    dashboard: $("dashboardPage"),
    profile: $("profilePage"),
    settings: $("settingsPage"),
    contacts: $("contactsPage"),
    "add-blog": $("addBlogPage"),
    "edit-blog": $("addBlogPage"),
    "delete-blog": $("addBlogPage"),
    "add-project": $("addProjectPage"),
    "edit-project": $("addProjectPage"),
    "delete-project": $("addProjectPage")
};

function showPage(pageName) {
    Object.values(pages).forEach((page) => {
        if (page) page.classList.remove("active");
    });

    const selectedPage = pages[pageName] || pages.dashboard;

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document.querySelectorAll(".menu li[data-page]")
        .forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );
        });

    const titles = {
        dashboard: "Dashboard",
        profile: "Profile",
        settings: "Settings",
        contacts: "Contacts",
        "add-blog": "Add Blog",
        "edit-blog": "Edit Blog",
        "delete-blog": "Manage Blogs",
        "add-project": "Add Project",
        "edit-project": "Edit Project",
        "delete-project": "Manage Projects"
    };

    const pageTitle = $("pageTitle");

    if (pageTitle) {
        pageTitle.textContent = titles[pageName] || "Dashboard";
    }

    if (pageName.includes("blog")) {
        renderBlogs();
    }

    if (pageName.includes("project")) {
        renderProjects();
    }

    if (pageName === "contacts") {
        renderContacts();
    }
}

// Sidebar menu
document.querySelectorAll(".menu li[data-page]")
    .forEach((item) => {
        item.addEventListener("click", () => {
            if (item.dataset.page) {
                showPage(item.dataset.page);
            }
        });
    });

// Submenus
const blogMenu = $("blogMenu");
const blogSubmenu = $("blogSubmenu");

if (blogMenu && blogSubmenu) {
    blogMenu.addEventListener("click", () => {
        blogSubmenu.classList.toggle("show");
    });
}

const projectMenu = $("projectMenu");
const projectSubmenu = $("projectSubmenu");

if (projectMenu && projectSubmenu) {
    projectMenu.addEventListener("click", () => {
        projectSubmenu.classList.toggle("show");
    });
}

// ==========================================
// IMAGE FILE READER
// ==========================================

function readImage(file, callback) {
    if (!file) {
        callback("");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        callback(null);
        return;
    }

    const reader = new FileReader();

    reader.onload = () => callback(reader.result);

    reader.onerror = () => {
        alert("Could not read image.");
        callback(null);
    };

    reader.readAsDataURL(file);
}

// Blog image preview
const blogImageInput = $("blogImage");
const blogImagePreview = $("blogImagePreview");

if (blogImageInput) {
    blogImageInput.addEventListener("change", function () {
        readImage(this.files[0], (image) => {
            if (image === null) {
                blogImageInput.value = "";
                return;
            }

            selectedBlogImage = image || "";

            if (blogImagePreview) {
                blogImagePreview.src = image || "";
                blogImagePreview.style.display =
                    image ? "block" : "none";
            }
        });
    });
}

// Project image preview
const projectImageInput = $("projectImage");
const projectImagePreview = $("projectImagePreview");

if (projectImageInput) {
    projectImageInput.addEventListener("change", function () {
        readImage(this.files[0], (image) => {
            if (image === null) {
                projectImageInput.value = "";
                return;
            }

            selectedProjectImage = image || "";

            if (projectImagePreview) {
                projectImagePreview.src = image || "";
                projectImagePreview.style.display =
                    image ? "block" : "none";
            }
        });
    });
}

// ==========================================
// RESET BLOG FORM
// ==========================================

function resetBlogForm() {
    $("blogForm")?.reset();

    editingBlogId = null;
    selectedBlogImage = "";

    if (blogImagePreview) {
        blogImagePreview.removeAttribute("src");
        blogImagePreview.style.display = "none";
    }

    if ($("blogSubmitBtn")) {
        $("blogSubmitBtn").textContent = "Add Blog";
    }

    if ($("cancelBlogEdit")) {
        $("cancelBlogEdit").style.display = "none";
    }

    if ($("blogFormHeading")) {
        $("blogFormHeading").textContent = "Add New Blog";
    }

    hideMessage($("blogMessage"));
}

// ==========================================
// RESET PROJECT FORM
// ==========================================

function resetProjectForm() {
    $("projectForm")?.reset();

    editingProjectId = null;
    selectedProjectImage = "";

    if (projectImagePreview) {
        projectImagePreview.removeAttribute("src");
        projectImagePreview.style.display = "none";
    }

    if ($("projectSubmitBtn")) {
        $("projectSubmitBtn").textContent = "Add Project";
    }

    if ($("cancelProjectEdit")) {
        $("cancelProjectEdit").style.display = "none";
    }

    if ($("projectFormHeading")) {
        $("projectFormHeading").textContent = "Add New Project";
    }

    hideMessage($("projectMessage"));
}

// ==========================================
// BLOGS - DISPLAY
// ==========================================

function createBlogCard(blog) {
    const card = document.createElement("article");
    card.className = "saved-blog-card";

    const title = document.createElement("h3");
    title.textContent = blog.title;
    card.appendChild(title);

    if (blog.image) {
        const image = document.createElement("img");
        image.src = blog.image;
        image.alt = blog.title || "Blog image";
        image.className = "saved-item-image";
        image.loading = "lazy";
        card.appendChild(image);
    }

    const content = document.createElement("p");
    content.textContent = blog.content;
    card.appendChild(content);

    const date = document.createElement("small");
    date.textContent = formatDate(blog.date);
    card.appendChild(date);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => editBlog(blog.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlog(blog.id));

    actions.append(edit, remove);
    card.appendChild(actions);

    return card;
}

function renderBlogs() {
    const container = $("savedBlogs");
    const count = $("blogCount");
    const blogs = getBlogs();

    if (count) count.textContent = blogs.length;
    if (!container) return;

    container.replaceChildren();

    if (!blogs.length) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No blogs yet. Add your first blog!";
        container.appendChild(empty);
        return;
    }

    [...blogs].reverse().forEach((blog) => {
        container.appendChild(createBlogCard(blog));
    });
}

// Add or update blog
const blogForm = $("blogForm");

if (blogForm) {
    blogForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = $("blogTitle")?.value.trim() || "";
        const content = $("blogContent")?.value.trim() || "";

        if (!title || !content) {
            showMessage(
                $("blogMessage"),
                "Enter the blog title and content.",
                true
            );
            return;
        }

        const blogs = getBlogs();
        const oldBlog = blogs.find((item) =>
            item.id === editingBlogId
        );

        const blog = {
            id: oldBlog ? oldBlog.id : makeId(),
            title,
            content,
            image: selectedBlogImage || oldBlog?.image || "",
            date: oldBlog?.date || new Date().toISOString()
        };

        const updated = editingBlogId
            ? blogs.map((item) =>
                item.id === editingBlogId ? blog : item
            )
            : [...blogs, blog];

        if (!saveItems(BLOGS_KEY, updated)) return;

        resetBlogForm();
        renderBlogs();

        showMessage(
            $("blogMessage"),
            oldBlog ? "Blog updated successfully!" :
                "Blog added successfully!"
        );
    });
}

function editBlog(id) {
    const blog = getBlogs().find((item) => item.id === id);

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    editingBlogId = blog.id;
    $("blogTitle").value = blog.title;
    $("blogContent").value = blog.content;
    selectedBlogImage = blog.image || "";

    if (blogImagePreview) {
        blogImagePreview.src = blog.image || "";
        blogImagePreview.style.display =
            blog.image ? "block" : "none";
    }

    if ($("blogSubmitBtn")) {
        $("blogSubmitBtn").textContent = "Update Blog";
    }

    if ($("cancelBlogEdit")) {
        $("cancelBlogEdit").style.display = "inline-block";
    }

    if ($("blogFormHeading")) {
        $("blogFormHeading").textContent = "Edit Blog";
    }

    showPage("edit-blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBlog(id) {
    const blogs = getBlogs();
    const blog = blogs.find((item) => item.id === id);

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    if (!confirm(`Delete "${blog.title}"?`)) return;

    const updated = blogs.filter((item) => item.id !== id);

    if (!saveItems(BLOGS_KEY, updated)) return;

    renderBlogs();
    showMessage($("blogMessage"), "Blog deleted successfully!");
}

$("cancelBlogEdit")?.addEventListener("click", resetBlogForm);

// ==========================================
// PROJECTS - DISPLAY
// ==========================================

function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "saved-project-card";

    const title = document.createElement("h3");
    title.textContent = project.title;
    card.appendChild(title);

    if (project.image) {
        const image = document.createElement("img");
        image.src = project.image;
        image.alt = project.title || "Project image";
        image.className = "saved-item-image";
        image.loading = "lazy";
        card.appendChild(image);
    }

    const description = document.createElement("p");
    description.textContent = project.description;
    card.appendChild(description);

    const date = document.createElement("small");
    date.textContent = formatDate(project.date);
    card.appendChild(date);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => editProject(project.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteProject(project.id));

    actions.append(edit, remove);
    card.appendChild(actions);

    return card;
}

function renderProjects() {
    const container = $("savedProjects");
    const count = $("projectCount");
    const projects = getProjects();

    if (count) count.textContent = projects.length;
    if (!container) return;

    container.replaceChildren();

    if (!projects.length) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No projects yet. Add your first project!";
        container.appendChild(empty);
        return;
    }

    [...projects].reverse().forEach((project) => {
        container.appendChild(createProjectCard(project));
    });
}

// Add or update project
const projectForm = $("projectForm");

if (projectForm) {
    projectForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = $("projectTitle")?.value.trim() || "";
        const description =
            $("projectDescription")?.value.trim() || "";

        if (!title || !description) {
            showMessage(
                $("projectMessage"),
                "Enter the project title and description.",
                true
            );
            return;
        }

        const projects = getProjects();
        const oldProject = projects.find((item) =>
            item.id === editingProjectId
        );

        const project = {
            id: oldProject ? oldProject.id : makeId(),
            title,
            description,
            image: selectedProjectImage || oldProject?.image || "",
            date: oldProject?.date || new Date().toISOString()
        };

        const updated = editingProjectId
            ? projects.map((item) =>
                item.id === editingProjectId ? project : item
            )
            : [...projects, project];

        if (!saveItems(PROJECTS_KEY, updated)) return;

        resetProjectForm();
        renderProjects();

        showMessage(
            $("projectMessage"),
            oldProject ? "Project updated successfully!" :
                "Project added successfully!"
        );
    });
}

function editProject(id) {
    const project = getProjects().find((item) => item.id === id);

    if (!project) {
        alert("Project not found.");
        return;
    }

    editingProjectId = project.id;
    $("projectTitle").value = project.title;
    $("projectDescription").value = project.description;
    selectedProjectImage = project.image || "";

    if (projectImagePreview) {
        projectImagePreview.src = project.image || "";
        projectImagePreview.style.display =
            project.image ? "block" : "none";
    }

    if ($("projectSubmitBtn")) {
        $("projectSubmitBtn").textContent = "Update Project";
    }

    if ($("cancelProjectEdit")) {
        $("cancelProjectEdit").style.display = "inline-block";
    }

    if ($("projectFormHeading")) {
        $("projectFormHeading").textContent = "Edit Project";
    }

    showPage("edit-project");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProject(id) {
    const projects = getProjects();
    const project = projects.find((item) => item.id === id);

    if (!project) {
        alert("Project not found.");
        return;
    }

    if (!confirm(`Delete "${project.title}"?`)) return;

    const updated = projects.filter((item) => item.id !== id);

    if (!saveItems(PROJECTS_KEY, updated)) return;

    renderProjects();
    showMessage(
        $("projectMessage"),
        "Project deleted successfully!"
    );
}

$("cancelProjectEdit")?.addEventListener("click", resetProjectForm);

// ==========================================
// CONTACTS - LOCAL STORAGE
// ==========================================

function getContactMessages() {
    return getItems(CONTACTS_KEY);
}

function renderContacts() {
    const tableBody = $("contactsTableBody");
    const count = $("contactCount");
    const statusMessage = $("contactsMessage");

    if (!tableBody) {
        console.warn(
            'Missing HTML element with id="contactsTableBody".'
        );
        return;
    }

    const messages = getContactMessages();

    if (count) count.textContent = messages.length;

    tableBody.replaceChildren();

    if (statusMessage) statusMessage.textContent = "";

    if (messages.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No contact messages yet.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    [...messages].reverse().forEach((message) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = message.name || "Unknown";
        row.appendChild(nameCell);

        const emailCell = document.createElement("td");
        emailCell.textContent = message.email || "—";
        row.appendChild(emailCell);

        const phoneCell = document.createElement("td");
        phoneCell.textContent = message.phone || "—";
        row.appendChild(phoneCell);

        const textCell = document.createElement("td");
        textCell.textContent = message.message || message.content || "";
        row.appendChild(textCell);

        const statusCell = document.createElement("td");
        const status = document.createElement("span");

        const isRead =
            String(message.status || "Unread").toLowerCase() === "read";

        status.textContent = isRead ? "Read" : "Unread";
        status.className = isRead
            ? "contact-status read"
            : "contact-status unread";

        statusCell.appendChild(status);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");

        actions.style.display = "flex";
        actions.style.gap = "6px";
        actions.style.flexWrap = "wrap";

        const markRead = document.createElement("button");
        markRead.type = "button";
        markRead.className = "contact-action-btn";
        markRead.textContent = isRead ? "Read" : "Mark Read";
        markRead.disabled = isRead;

        markRead.addEventListener("click", () => {
            const all = getContactMessages();
            const index = all.findIndex((item) =>
                message.id ? item.id === message.id : item === message
            );

            if (index < 0) {
                renderContacts();
                return;
            }

            all[index].status = "Read";

            if (saveItems(CONTACTS_KEY, all)) {
                renderContacts();
            }
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "contact-delete-btn";
        remove.textContent = "Delete";

        remove.addEventListener("click", () => {
            if (!confirm("Delete this contact message?")) return;

            const all = getContactMessages();
            const index = all.findIndex((item) =>
                message.id ? item.id === message.id : item === message
            );

            if (index < 0) {
                renderContacts();
                return;
            }

            all.splice(index, 1);

            if (saveItems(CONTACTS_KEY, all)) {
                renderContacts();
            }
        });

        actions.append(markRead, remove);
        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });
}

// ==========================================
// SETTINGS AND THEME
// ==========================================

function applyDashboardTheme(theme) {
    document.body.classList.toggle("light-mode", theme === "light");
}

function updateAdminName(name) {
    const userName = document.querySelector(".user strong");

    if (userName) userName.textContent = name;

    const description = document.querySelector(
        ".topbar > div:first-child p"
    );

    if (description) {
        description.textContent = `Welcome back, ${name}!`;
    }
}

function loadSettings() {
    const name = localStorage.getItem(ADMIN_NAME_KEY) || "Jean d'Amour";
    const theme = localStorage.getItem(THEME_KEY) || "dark";

    if ($("settingsName")) $("settingsName").value = name;
    if ($("settingsTheme")) $("settingsTheme").value = theme;

    applyDashboardTheme(theme);
    updateAdminName(name);
}

const settingsForm = $("settingsForm");

if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = $("settingsName")?.value.trim() || "";
        const theme = $("settingsTheme")?.value || "dark";

        if (!name) {
            showMessage($("settingsMessage"), "Enter your name.", true);
            return;
        }

        try {
            localStorage.setItem(ADMIN_NAME_KEY, name);
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error(error);
            showMessage(
                $("settingsMessage"),
                "Could not save settings.",
                true
            );
            return;
        }

        updateAdminName(name);
        applyDashboardTheme(theme);
        showMessage(
            $("settingsMessage"),
            "Settings saved successfully!"
        );
    });
}

if ($("settingsTheme")) {
    $("settingsTheme").addEventListener("change", function () {
        applyDashboardTheme(this.value);
    });
}

// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = $("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to log out?")) {
            window.location.href = "Login.html";
        }
    });
}

// ==========================================
// CHANGE PASSWORD - FIREBASE AUTH
// ==========================================

const changePasswordForm = $("changePasswordForm");

if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const currentPassword = $("currentPassword")?.value || "";
        const newPassword = $("newPassword")?.value || "";
        const confirmPassword = $("confirmPassword")?.value || "";

        const message = $("passwordMessage");
        const button = $("changePasswordBtn");
        const auth = window.firebaseAuth;

        if (newPassword !== confirmPassword) {
            showMessage(message, "New passwords do not match.", true);
            return;
        }

        if (newPassword.length < 6) {
            showMessage(
                message,
                "Password must contain at least 6 characters.",
                true
            );
            return;
        }

        if (!auth?.currentUser) {
            showMessage(
                message,
                "Firebase Authentication is not connected.",
                true
            );
            return;
        }

        const user = auth.currentUser;

        if (!user.email) {
            showMessage(message, "Account email is unavailable.", true);
            return;
        }

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Updating password...";
            }

            const {
                EmailAuthProvider,
                reauthenticateWithCredential,
                updatePassword
            } = await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
            );

            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            changePasswordForm.reset();
            showMessage(message, "Password changed successfully!");

        } catch (error) {
            console.error("Change password error:", error);

            const errors = {
                "auth/invalid-credential":
                    "Current password is incorrect.",
                "auth/wrong-password":
                    "Current password is incorrect.",
                "auth/weak-password":
                    "New password is too weak.",
                "auth/requires-recent-login":
                    "Sign in again before changing your password.",
                "auth/too-many-requests":
                    "Too many attempts. Try again later.",
                "auth/network-request-failed":
                    "Check your internet connection."
            };

            showMessage(
                message,
                errors[error.code] || "Could not change password.",
                true
            );

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Change Password";
            }
        }
    });
}

// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

function initializeDashboard() {
    loadSettings();
    renderBlogs();
    renderProjects();
    showPage("dashboard");
}

initializeDashboard();
