
// ==========================================
// J.D.I DASHBOARD - MAIN JAVASCRIPT
// LocalStorage + Firebase Authentication
// ==========================================

"use strict";

// ==========================================
// 1. FIREBASE AUTHENTICATION
// ==========================================

const firebaseAuthReady = (async () => {
    const { initializeApp, getApps } = await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
    );

    const {
        getAuth,
        onAuthStateChanged,
        signOut,
        EmailAuthProvider,
        reauthenticateWithCredential,
        updatePassword
    } = await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
    );

    const firebaseConfig = {
        apiKey: "AIzaSyDkB9QoCnDaxQieInfaKVjPocJM4BTlt8k",
        authDomain: "jeandamour-login.firebaseapp.com",
        projectId: "jeandamour-login",
        storageBucket: "jeandamour-login.firebasestorage.app",
        messagingSenderId: "372516516628",
        appId: "1:372516516628:web:e07d8de6aeadb7a6310801",
        measurementId: "G-G9REMS5J0Q"
    };

    const existingApp = getApps().find(
        app => app.name === "[DEFAULT]"
    );

    const app = existingApp || initializeApp(firebaseConfig);
    const auth = getAuth(app);

    window.firebaseAuth = auth;

    let redirecting = false;

    onAuthStateChanged(auth, user => {
        if (!user && !redirecting) {
            redirecting = true;
            window.location.replace("Login.html");
        }
    });

    return {
        auth,
        signOut,
        EmailAuthProvider,
        reauthenticateWithCredential,
        updatePassword
    };
})();

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

const $ = id => document.getElementById(id);

const BLOGS_KEY = "jeanBlogs";
const PROJECTS_KEY = "jeanProjects";
const CONTACTS_KEY = "portfolioMessages";
const ADMIN_NAME_KEY = "dashboardAdminName";
const THEME_KEY = "dashboardTheme";

let editingBlogId = null;
let editingProjectId = null;
let selectedBlogImage = "";
let selectedProjectImage = "";

function makeId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function getItems(key) {
    try {
        const value = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error("Storage read error:", error);
        return [];
    }
}

function saveItems(key, items) {
    try {
        localStorage.setItem(key, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error("Storage save error:", error);

        alert(
            "Could not save data. Browser storage may be full."
        );

        return false;
    }
}

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
// 3. PAGE NAVIGATION
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

const pageTitles = {
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

function showPage(pageName) {
    Object.values(pages).forEach(page => {
        if (page) page.classList.remove("active");
    });

    const selectedPage = pages[pageName] || pages.dashboard;

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document.querySelectorAll(".menu li[data-page]")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );
        });

    if ($("pageTitle")) {
        $("pageTitle").textContent =
            pageTitles[pageName] || "Dashboard";
    }

    if (pageName.includes("blog")) renderBlogs();
    if (pageName.includes("project")) renderProjects();
    if (pageName === "contacts") renderContacts();
}

document.querySelectorAll(".menu li[data-page]")
    .forEach(item => {
        item.addEventListener("click", () => {
            if (item.dataset.page) {
                showPage(item.dataset.page);
            }
        });
    });

$("blogMenu")?.addEventListener("click", () => {
    $("blogSubmenu")?.classList.toggle("show");
});

$("projectMenu")?.addEventListener("click", () => {
    $("projectSubmenu")?.classList.toggle("show");
});

// ==========================================
// 4. IMAGE READER AND PREVIEW
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

const blogImageInput = $("blogImage");
const blogImagePreview = $("blogImagePreview");

blogImageInput?.addEventListener("change", function () {
    readImage(this.files[0], image => {
        if (image === null) {
            this.value = "";
            return;
        }

        selectedBlogImage = image || "";

        if (!blogImagePreview) return;

        if (image) {
            blogImagePreview.src = image;
            blogImagePreview.style.display = "block";
        } else {
            blogImagePreview.removeAttribute("src");
            blogImagePreview.style.display = "none";
        }
    });
});

const projectImageInput = $("projectImage");
const projectImagePreview = $("projectImagePreview");

projectImageInput?.addEventListener("change", function () {
    readImage(this.files[0], image => {
        if (image === null) {
            this.value = "";
            return;
        }

        selectedProjectImage = image || "";

        if (!projectImagePreview) return;

        if (image) {
            projectImagePreview.src = image;
            projectImagePreview.style.display = "block";
        } else {
            projectImagePreview.removeAttribute("src");
            projectImagePreview.style.display = "none";
        }
    });
});

// ==========================================
// 5. BLOGS
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

function renderBlogs() {
    const container = $("savedBlogs");
    const count = $("blogCount");
    const blogs = getBlogs();

    if (count) count.textContent = blogs.length;
    if (!container) return;

    container.replaceChildren();

    if (blogs.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No blogs yet. Add your first blog!";
        empty.className = "empty-message";
        container.appendChild(empty);
        return;
    }

    [...blogs].reverse().forEach(blog => {
        const card = document.createElement("article");
        card.className = "saved-blog-card";

        const title = document.createElement("h3");
        title.textContent = blog.title;
        card.appendChild(title);

        if (blog.image) {
            const image = document.createElement("img");
            image.src = blog.image;
            image.alt = blog.title;
            image.className = "saved-item-image";
            card.appendChild(image);
        }

        const content = document.createElement("p");
        content.textContent = blog.content;
        card.appendChild(content);

        const date = document.createElement("small");
        date.textContent = formatDate(blog.date);
        card.appendChild(date);

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Edit";
        edit.className = "edit-btn";
        edit.addEventListener("click", () => editBlog(blog.id));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";
        remove.className = "delete-btn";
        remove.addEventListener("click", () => deleteBlog(blog.id));

        const actions = document.createElement("div");
        actions.className = "item-actions";
        actions.append(edit, remove);

        card.appendChild(actions);
        container.appendChild(card);
    });
}

function resetBlogForm() {
    $("blogForm")?.reset();

    editingBlogId = null;
    selectedBlogImage = "";

    if (blogImagePreview) {
        blogImagePreview.removeAttribute("src");
        blogImagePreview.style.display = "none";
    }

    if ($("blogSubmitBtn")) {
        $("blogSubmitBtn").innerHTML =
            '<i class="fa-solid fa-plus"></i> Add Blog';
    }

    if ($("cancelBlogEdit")) {
        $("cancelBlogEdit").style.display = "none";
    }

    if ($("blogFormHeading")) {
        $("blogFormHeading").textContent = "Add New Blog";
    }

    hideMessage($("blogMessage"));
}

$("blogForm")?.addEventListener("submit", event => {
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
    const oldBlog = blogs.find(item => item.id === editingBlogId);

    const blog = {
        id: oldBlog ? oldBlog.id : makeId(),
        title,
        content,
        image: selectedBlogImage || oldBlog?.image || "",
        date: oldBlog?.date || new Date().toISOString()
    };

    const updated = editingBlogId
        ? blogs.map(item => item.id === editingBlogId ? blog : item)
        : [...blogs, blog];

    if (!saveItems(BLOGS_KEY, updated)) return;

    resetBlogForm();
    renderBlogs();

    showMessage(
        $("blogMessage"),
        oldBlog ? "Blog updated successfully!" : "Blog added successfully!"
    );
});

function editBlog(id) {
    const blog = getBlogs().find(item => item.id === id);

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    editingBlogId = blog.id;
    $("blogTitle").value = blog.title;
    $("blogContent").value = blog.content;
    selectedBlogImage = blog.image || "";

    if (blogImagePreview) {
        if (blog.image) {
            blogImagePreview.src = blog.image;
            blogImagePreview.style.display = "block";
        } else {
            blogImagePreview.removeAttribute("src");
            blogImagePreview.style.display = "none";
        }
    }

    if ($("blogSubmitBtn")) {
        $("blogSubmitBtn").innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Blog';
    }

    if ($("cancelBlogEdit")) {
        $("cancelBlogEdit").style.display = "inline-block";
    }

    if ($("blogFormHeading")) {
        $("blogFormHeading").textContent = "Edit Blog";
    }

    showPage("edit-blog");
}

function deleteBlog(id) {
    const blogs = getBlogs();
    const blog = blogs.find(item => item.id === id);

    if (!blog || !confirm(`Delete "${blog.title}"?`)) return;

    const updated = blogs.filter(item => item.id !== id);

    if (saveItems(BLOGS_KEY, updated)) {
        renderBlogs();
        showMessage($("blogMessage"), "Blog deleted successfully!");
    }
}

$("cancelBlogEdit")?.addEventListener("click", resetBlogForm);

// ==========================================
// 6. PROJECTS
// ==========================================

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

function renderProjects() {
    const container = $("savedProjects");
    const count = $("projectCount");
    const projects = getProjects();

    if (count) count.textContent = projects.length;
    if (!container) return;

    container.replaceChildren();

    if (projects.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No projects yet. Add your first project!";
        empty.className = "empty-message";
        container.appendChild(empty);
        return;
    }

    [...projects].reverse().forEach(project => {
        const card = document.createElement("article");
        card.className = "saved-project-card";

        const title = document.createElement("h3");
        title.textContent = project.title;
        card.appendChild(title);

        if (project.image) {
            const image = document.createElement("img");
            image.src = project.image;
            image.alt = project.title;
            image.className = "saved-item-image";
            card.appendChild(image);
        }

        const description = document.createElement("p");
        description.textContent = project.description;
        card.appendChild(description);

        const date = document.createElement("small");
        date.textContent = formatDate(project.date);
        card.appendChild(date);

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Edit";
        edit.className = "edit-btn";
        edit.addEventListener("click", () => editProject(project.id));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";
        remove.className = "delete-btn";
        remove.addEventListener("click", () => deleteProject(project.id));

        const actions = document.createElement("div");
        actions.className = "item-actions";
        actions.append(edit, remove);

        card.appendChild(actions);
        container.appendChild(card);
    });
}

function resetProjectForm() {
    $("projectForm")?.reset();

    editingProjectId = null;
    selectedProjectImage = "";

    if (projectImagePreview) {
        projectImagePreview.removeAttribute("src");
        projectImagePreview.style.display = "none";
    }

    if ($("projectSubmitBtn")) {
        $("projectSubmitBtn").innerHTML =
            '<i class="fa-solid fa-plus"></i> Add Project';
    }

    if ($("cancelProjectEdit")) {
        $("cancelProjectEdit").style.display = "none";
    }

    if ($("projectFormHeading")) {
        $("projectFormHeading").textContent = "Add New Project";
    }

    hideMessage($("projectMessage"));
}

$("projectForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const title = $("projectTitle")?.value.trim() || "";
    const description = $("projectDescription")?.value.trim() || "";

    if (!title || !description) {
        showMessage(
            $("projectMessage"),
            "Enter the project title and description.",
            true
        );
        return;
    }

    const projects = getProjects();
    const oldProject = projects.find(
        item => item.id === editingProjectId
    );

    const project = {
        id: oldProject ? oldProject.id : makeId(),
        title,
        description,
        image: selectedProjectImage || oldProject?.image || "",
        date: oldProject?.date || new Date().toISOString()
    };

    const updated = editingProjectId
        ? projects.map(item =>
            item.id === editingProjectId ? project : item
        )
        : [...projects, project];

    if (!saveItems(PROJECTS_KEY, updated)) return;

    resetProjectForm();
    renderProjects();

    showMessage(
        $("projectMessage"),
        oldProject
            ? "Project updated successfully!"
            : "Project added successfully!"
    );
});

function editProject(id) {
    const project = getProjects().find(item => item.id === id);

    if (!project) {
        alert("Project not found.");
        return;
    }

    editingProjectId = project.id;
    $("projectTitle").value = project.title;
    $("projectDescription").value = project.description;
    selectedProjectImage = project.image || "";

    if (projectImagePreview) {
        if (project.image) {
            projectImagePreview.src = project.image;
            projectImagePreview.style.display = "block";
        } else {
            projectImagePreview.removeAttribute("src");
            projectImagePreview.style.display = "none";
        }
    }

    if ($("projectSubmitBtn")) {
        $("projectSubmitBtn").innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Project';
    }

    if ($("cancelProjectEdit")) {
        $("cancelProjectEdit").style.display = "inline-block";
    }

    if ($("projectFormHeading")) {
        $("projectFormHeading").textContent = "Edit Project";
    }

    showPage("edit-project");
}

function deleteProject(id) {
    const projects = getProjects();
    const project = projects.find(item => item.id === id);

    if (!project || !confirm(`Delete "${project.title}"?`)) return;

    const updated = projects.filter(item => item.id !== id);

    if (saveItems(PROJECTS_KEY, updated)) {
        renderProjects();
        showMessage(
            $("projectMessage"),
            "Project deleted successfully!"
        );
    }
}

$("cancelProjectEdit")?.addEventListener(
    "click",
    resetProjectForm
);

// ==========================================
// 7. CONTACT MESSAGES - LOCAL STORAGE
// ==========================================

function getContactMessages() {
    return getItems(CONTACTS_KEY);
}

function renderContacts() {
    const tableBody = $("contactsTableBody");
    const count = $("contactCount");

    if (!tableBody) {
        console.error("contactsTableBody was not found in the HTML.");
        return;
    }

    const messages = getContactMessages();

    if (count) count.textContent = messages.length;

    tableBody.replaceChildren();

    if (messages.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No contact messages yet.";
        cell.style.textAlign = "center";
        cell.style.padding = "20px";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    // Keep the original index so messages without IDs
    // can still be marked as read or deleted correctly.
    messages
        .map((message, originalIndex) => ({
            message,
            originalIndex
        }))
        .reverse()
        .forEach(({ message, originalIndex }) => {
            const row = document.createElement("tr");

            const values = [
                message.name || "Unknown",
                message.email || "—",
                message.phone || "—",
                message.message || message.content || "—"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            // Message status
            const statusCell = document.createElement("td");

            const isRead =
                String(message.status || "Unread").toLowerCase() === "read";

            const status = document.createElement("span");
            status.textContent = isRead ? "Read" : "Unread";
            status.className = isRead
                ? "contact-status read"
                : "contact-status unread";

            statusCell.appendChild(status);
            row.appendChild(statusCell);

            // Action cell
            const actionCell = document.createElement("td");
            const actions = document.createElement("div");
            actions.className = "contact-actions";

            // Mark Read button
            const markRead = document.createElement("button");
            markRead.type = "button";
            markRead.className = "btn-read";
            markRead.innerHTML =
                '<i class="fa-solid fa-check"></i> Mark Read';
            markRead.disabled = isRead;
            markRead.title = isRead
                ? "This message has been read"
                : "Mark this message as read";

            markRead.addEventListener("click", () => {
                const all = getContactMessages();

                const index = message.id != null
                    ? all.findIndex(item => item.id === message.id)
                    : originalIndex;

                if (index < 0 || !all[index]) return;

                all[index] = {
                    ...all[index],
                    status: "Read"
                };

                if (saveItems(CONTACTS_KEY, all)) {
                    renderContacts();
                }
            });

            // Delete button
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "btn-delete";
            remove.innerHTML =
                '<i class="fa-solid fa-trash"></i> Delete';
            remove.title = "Delete this message";

            remove.addEventListener("click", () => {
                if (!confirm("Are you sure you want to delete this message?")) {
                    return;
                }

                const all = getContactMessages();

                const updated = message.id != null
                    ? all.filter(item => item.id !== message.id)
                    : all.filter((_, index) => index !== originalIndex);

                if (saveItems(CONTACTS_KEY, updated)) {
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
// 8. ADMIN NAME AND SETTINGS
// ==========================================

function applyDashboardTheme(theme) {
    document.body.classList.toggle(
        "light-mode",
        theme === "light"
    );
}

function updateAdminName(name) {
    const savedName = name.trim() || "Jean d'Amour";

    const userName = document.querySelector(".user strong");

    if (userName) userName.textContent = savedName;

    const description = document.querySelector(
        ".topbar > div:first-child p"
    );

    if (description) {
        description.textContent = `Welcome back, ${savedName} 👋`;
    }

    const profileAdminName = $("profileAdminName");

    if (profileAdminName) {
        profileAdminName.textContent = savedName;
    }

    const profileNameInput = $("profileName");

    if (profileNameInput) {
        profileNameInput.value = savedName;
    }

    document.querySelectorAll("[data-admin-name]")
        .forEach(element => {
            element.textContent = savedName;
        });
}

function saveAdminName(name, messageElement) {
    const cleanName = name.trim();

    if (!cleanName) {
        showMessage(messageElement, "Please enter your name.", true);
        return false;
    }

    try {
        localStorage.setItem(ADMIN_NAME_KEY, cleanName);
    } catch (error) {
        console.error("Name save error:", error);
        showMessage(messageElement, "Could not save your name.", true);
        return false;
    }

    updateAdminName(cleanName);
    showMessage(messageElement, "Name saved successfully!");

    return true;
}

function loadSettings() {
    const name =
        localStorage.getItem(ADMIN_NAME_KEY) || "Jean d'Amour";

    const theme =
        localStorage.getItem(THEME_KEY) || "dark";

    if ($("settingsName")) $("settingsName").value = name;
    if ($("settingsTheme")) $("settingsTheme").value = theme;

    updateAdminName(name);
    applyDashboardTheme(theme);
}

$("settingsForm")?.addEventListener("submit", event => {
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
        console.error("Settings save error:", error);
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

$("settingsTheme")?.addEventListener("change", function () {
    applyDashboardTheme(this.value);
});

// ==========================================
// 9. PROFILE PAGE NAME
// ==========================================

$("profileForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const name = $("profileName")?.value || "";
    saveAdminName(name, $("profileMessage"));
});

// ==========================================
// 10. LOGOUT - FIREBASE AUTHENTICATION
// ==========================================

$("logoutBtn")?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    try {
        const { auth, signOut } = await firebaseAuthReady;

        await signOut(auth);
        window.location.replace("Login.html");
    } catch (error) {
        console.error("Logout error:", error);
        alert("Could not log out. Please try again.");
    }
});

// ==========================================
// 11. CHANGE PASSWORD - FIREBASE AUTH
// ==========================================

$("changePasswordForm")?.addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const currentPassword = $("currentPassword")?.value || "";
        const newPassword = $("newPassword")?.value || "";
        const confirmPassword = $("confirmPassword")?.value || "";

        const message = $("passwordMessage");
        const button = $("changePasswordBtn");

        if (!currentPassword) {
            showMessage(message, "Enter your current password.", true);
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

        if (newPassword !== confirmPassword) {
            showMessage(message, "New passwords do not match.", true);
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(
                message,
                "Choose a different new password.",
                true
            );
            return;
        }

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Updating password...";
            }

            const {
                auth,
                EmailAuthProvider,
                reauthenticateWithCredential,
                updatePassword
            } = await firebaseAuthReady;

            const user = auth.currentUser;

            if (!user || !user.email) {
                showMessage(
                    message,
                    "Please sign in again before changing your password.",
                    true
                );
                return;
            }

            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            $("changePasswordForm").reset();

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
                    "Please sign in again and retry.",

                "auth/too-many-requests":
                    "Too many attempts. Try again later.",

                "auth/network-request-failed":
                    "Check your internet connection.",

                "auth/operation-not-allowed":
                    "Email and password sign-in is not enabled."
            };

            showMessage(
                message,
                errors[error.code] ||
                    "Could not change password. Please try again.",
                true
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML =
                    '<i class="fa-solid fa-shield-halved"></i> Change Password';
            }
        }
    }
);

const profileImageInput = document.getElementById("profileImageInput");
const profileImage = document.getElementById("profileImage");

const savedPhoto = localStorage.getItem("dashboardProfilePhoto");

if (savedPhoto && profileImage) {
    profileImage.src = savedPhoto;
}

if (profileImageInput && profileImage) {
    profileImageInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image.");
            this.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be smaller than 2 MB.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                localStorage.setItem(
                    "dashboardProfilePhoto",
                    event.target.result
                );

                profileImage.src = event.target.result;
            } catch (error) {
                alert("Unable to save the image. Please choose a smaller image.");
            }
        };

        reader.readAsDataURL(file);
    });
}


// ==========================================
// 12. INITIALIZE DASHBOARD
// ==========================================

function initializeDashboard() {
    loadSettings();
    renderBlogs();
    renderProjects();
    renderContacts();
    showPage("dashboard");
}

initializeDashboard();
