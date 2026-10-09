// ========================================
// J.D.I DASHBOARD - MAIN JAVASCRIPT
// ========================================

// Get HTML elements easily
const $ = (id) => document.getElementById(id);

// LocalStorage keys
const BLOGS_KEY = "jeanBlogs";
const PROJECTS_KEY = "jeanProjects";
const ADMIN_NAME_KEY = "dashboardAdminName";
const THEME_KEY = "dashboardTheme";

// Current editing IDs
let editingBlogId = null;
let editingProjectId = null;

// Selected images
let selectedBlogImage = "";
let selectedProjectImage = "";

// ========================================
// PAGE ELEMENTS
// ========================================

const pages = {
    dashboard: $("dashboardPage"),
    profile: $("profilePage"),
    settings: $("settingsPage"),
    "add-blog": $("addBlogPage"),
    "edit-blog": $("addBlogPage"),
    "delete-blog": $("addBlogPage"),
    "add-project": $("addProjectPage"),
    "edit-project": $("addProjectPage"),
    "delete-project": $("addProjectPage")
};

// ========================================
// GENERATE UNIQUE ID
// ========================================

function makeId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

// ========================================
// READ DATA FROM LOCAL STORAGE
// ========================================

function getItems(key) {
    try {
        const value = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error(`Could not read ${key}:`, error);
        return [];
    }
}

// ========================================
// SAVE DATA TO LOCAL STORAGE
// ========================================

function saveItems(key, items) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(items)
        );

        return true;
    } catch (error) {
        console.error(`Could not save ${key}:`, error);

        alert(
            "Storage is full or unavailable. Try using a smaller image."
        );

        return false;
    }
}

// ========================================
// GET BLOGS
// ========================================

function getBlogs() {
    return getItems(BLOGS_KEY).map((item, index) => ({
        ...item,

        id:
            item.id ??
            `legacy-blog-${index}-${String(item.title || "")}`,

        title: item.title || "",

        content:
            item.content ??
            item.description ??
            "",

        image: item.image || "",

        date:
            item.date ||
            new Date().toISOString()
    }));
}

// ========================================
// GET PROJECTS
// ========================================

function getProjects() {
    return getItems(PROJECTS_KEY).map((item, index) => ({
        ...item,

        id:
            item.id ??
            `legacy-project-${index}-${String(item.title || "")}`,

        title: item.title || "",

        description:
            item.description ??
            item.content ??
            "",

        image: item.image || "",

        date:
            item.date ||
            new Date().toISOString()
    }));
}

// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// ========================================
// SHOW MESSAGE
// ========================================

function showMessage(element, message, isError = false) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.display = "block";

    element.style.color = isError
        ? "#ff4d4d"
        : "#22c55e";
}

// ========================================
// HIDE MESSAGE
// ========================================

function hideMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = "";
    element.style.display = "none";
}

// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(pageName) {
    Object.values(pages).forEach((page) => {
        if (page) {
            page.classList.remove("active");
        }
    });

    const selectedPage = pages[pageName] || pages.dashboard;

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document
        .querySelectorAll(".menu li[data-page]")
        .forEach((menuItem) => {
            menuItem.classList.toggle(
                "active",
                menuItem.dataset.page === pageName
            );
        });

    const pageTitle = $("pageTitle");

    if (pageTitle) {
        const titles = {
            dashboard: "Dashboard",
            profile: "Profile",
            settings: "Settings",
            "add-blog": "Add Blog",
            "edit-blog": "Edit Blog",
            "delete-blog": "Manage Blogs",
            "add-project": "Add Project",
            "edit-project": "Edit Project",
            "delete-project": "Manage Projects"
        };

        pageTitle.textContent =
            titles[pageName] || "Dashboard";
    }

    if (
        pageName.includes("blog")
    ) {
        renderBlogs();
    }

    if (
        pageName.includes("project")
    ) {
        renderProjects();
    }
}

// ========================================
// SIDEBAR MENU EVENTS
// ========================================

document
    .querySelectorAll(".menu li[data-page]")
    .forEach((menuItem) => {
        menuItem.addEventListener("click", () => {
            const pageName = menuItem.dataset.page;

            if (pageName) {
                showPage(pageName);
            }
        });
    });

// Blog submenu
const blogMenu = $("blogMenu");
const blogSubmenu = $("blogSubmenu");

if (blogMenu && blogSubmenu) {
    blogMenu.addEventListener("click", () => {
        blogSubmenu.classList.toggle("show");
    });
}

// Project submenu
const projectMenu = $("projectMenu");
const projectSubmenu = $("projectSubmenu");

if (projectMenu && projectSubmenu) {
    projectMenu.addEventListener("click", () => {
        projectSubmenu.classList.toggle("show");
    });
}

// ========================================
// READ IMAGE FILE
// ========================================

function readImage(file, callback) {
    if (!file) {
        callback("");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        callback(null);
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        callback(reader.result);
    };

    reader.onerror = function () {
        alert("Could not read this image.");
        callback(null);
    };

    reader.readAsDataURL(file);
}

// ========================================
// BLOG IMAGE PREVIEW
// ========================================

const blogImageInput = $("blogImage");
const blogImagePreview = $("blogImagePreview");

if (blogImageInput) {
    blogImageInput.addEventListener("change", function () {
        const file = this.files[0];

        readImage(file, function (imageData) {
            if (imageData === null) {
                blogImageInput.value = "";
                return;
            }

            selectedBlogImage = imageData || "";

            if (blogImagePreview) {
                if (imageData) {
                    blogImagePreview.src = imageData;
                    blogImagePreview.style.display = "block";
                } else {
                    blogImagePreview.removeAttribute("src");
                    blogImagePreview.style.display = "none";
                }
            }
        });
    });
}

// ========================================
// PROJECT IMAGE PREVIEW
// ========================================

const projectImageInput = $("projectImage");
const projectImagePreview = $("projectImagePreview");

if (projectImageInput) {
    projectImageInput.addEventListener("change", function () {
        const file = this.files[0];

        readImage(file, function (imageData) {
            if (imageData === null) {
                projectImageInput.value = "";
                return;
            }

            selectedProjectImage = imageData || "";

            if (projectImagePreview) {
                if (imageData) {
                    projectImagePreview.src = imageData;
                    projectImagePreview.style.display = "block";
                } else {
                    projectImagePreview.removeAttribute("src");
                    projectImagePreview.style.display = "none";
                }
            }
        });
    });
}

// ========================================
// RESET BLOG FORM
// ========================================

function resetBlogForm() {
    const blogForm = $("blogForm");

    if (blogForm) {
        blogForm.reset();
    }

    editingBlogId = null;
    selectedBlogImage = "";

    if (blogImagePreview) {
        blogImagePreview.removeAttribute("src");
        blogImagePreview.style.display = "none";
    }

    const blogSubmitBtn = $("blogSubmitBtn");
    const cancelBlogEdit = $("cancelBlogEdit");
    const blogFormHeading = $("blogFormHeading");

    if (blogSubmitBtn) {
        blogSubmitBtn.innerHTML =
            '<i class="fa-solid fa-plus"></i> Add Blog';
    }

    if (cancelBlogEdit) {
        cancelBlogEdit.style.display = "none";
    }

    if (blogFormHeading) {
        blogFormHeading.textContent = "Add New Blog";
    }

    hideMessage($("blogMessage"));
}

// ========================================
// RESET PROJECT FORM
// ========================================

function resetProjectForm() {
    const projectForm = $("projectForm");

    if (projectForm) {
        projectForm.reset();
    }

    editingProjectId = null;
    selectedProjectImage = "";

    if (projectImagePreview) {
        projectImagePreview.removeAttribute("src");
        projectImagePreview.style.display = "none";
    }

    const projectSubmitBtn = $("projectSubmitBtn");
    const cancelProjectEdit = $("cancelProjectEdit");
    const projectFormHeading = $("projectFormHeading");

    if (projectSubmitBtn) {
        projectSubmitBtn.innerHTML =
            '<i class="fa-solid fa-plus"></i> Add Project';
    }

    if (cancelProjectEdit) {
        cancelProjectEdit.style.display = "none";
    }

    if (projectFormHeading) {
        projectFormHeading.textContent = "Add New Project";
    }

    hideMessage($("projectMessage"));
}

// ========================================
// CREATE BLOG CARD
// ========================================

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
    date.className = "item-date";
    date.textContent = formatDate(blog.date);
    card.appendChild(date);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Edit';

    editButton.addEventListener("click", () => {
        editBlog(blog.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash"></i> Delete';

    deleteButton.addEventListener("click", () => {
        deleteBlog(blog.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);

    return card;
}

// ========================================
// DISPLAY BLOGS
// ========================================

function renderBlogs() {
    const savedBlogs = $("savedBlogs");
    const blogCount = $("blogCount");

    const blogs = getBlogs();

    if (blogCount) {
        blogCount.textContent = blogs.length;
    }

    if (!savedBlogs) {
        return;
    }

    savedBlogs.replaceChildren();

    if (blogs.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent =
            "No blogs yet. Add your first blog!";

        savedBlogs.appendChild(emptyMessage);
        return;
    }

    [...blogs].reverse().forEach((blog) => {
        savedBlogs.appendChild(createBlogCard(blog));
    });
}

// ========================================
// EDIT BLOG
// ========================================

function editBlog(blogId) {
    const blog = getBlogs().find(
        (item) => item.id === blogId
    );

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    editingBlogId = blog.id;

    const blogTitle = $("blogTitle");
    const blogContent = $("blogContent");
    const blogSubmitBtn = $("blogSubmitBtn");
    const cancelBlogEdit = $("cancelBlogEdit");
    const blogFormHeading = $("blogFormHeading");

    if (blogTitle) {
        blogTitle.value = blog.title;
    }

    if (blogContent) {
        blogContent.value = blog.content;
    }

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

    if (blogSubmitBtn) {
        blogSubmitBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Blog';
    }

    if (cancelBlogEdit) {
        cancelBlogEdit.style.display = "inline-block";
    }

    if (blogFormHeading) {
        blogFormHeading.textContent = "Edit Blog";
    }

    hideMessage($("blogMessage"));

    showPage("add-blog");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ========================================
// DELETE BLOG
// ========================================

function deleteBlog(blogId) {
    const blogs = getBlogs();

    const blog = blogs.find(
        (item) => item.id === blogId
    );

    if (!blog) {
        alert("Blog not found.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${blog.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedBlogs = blogs.filter(
        (item) => item.id !== blogId
    );

    if (!saveItems(BLOGS_KEY, updatedBlogs)) {
        return;
    }

    renderBlogs();

    showMessage(
        $("blogMessage"),
        "Blog deleted successfully!"
    );
}

// ========================================
// ADD OR UPDATE BLOG
// ========================================

const blogForm = $("blogForm");

if (blogForm) {
    blogForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const blogTitle = $("blogTitle");
        const blogContent = $("blogContent");
        const blogMessage = $("blogMessage");

        const title = blogTitle
            ? blogTitle.value.trim()
            : "";

        const content = blogContent
            ? blogContent.value.trim()
            : "";

        if (!title || !content) {
            showMessage(
                blogMessage,
                "Please enter both the blog title and content.",
                true
            );

            return;
        }

        const wasEditing = editingBlogId !== null;

        const blogs = getBlogs();

        const existingBlog = wasEditing
            ? blogs.find(
                (item) => item.id === editingBlogId
            )
            : null;

        const blog = {
            id: existingBlog
                ? existingBlog.id
                : makeId(),

            title: title,

            content: content,

            image:
                selectedBlogImage ||
                (existingBlog ? existingBlog.image : "") ||
                "",

            date: existingBlog
                ? existingBlog.date
                : new Date().toISOString()
        };

        let updatedBlogs;

        if (wasEditing) {
            updatedBlogs = blogs.map((item) =>
                item.id === editingBlogId
                    ? blog
                    : item
            );
        } else {
            updatedBlogs = [...blogs, blog];
        }

        if (!saveItems(BLOGS_KEY, updatedBlogs)) {
            return;
        }

        resetBlogForm();
        renderBlogs();

        showMessage(
            blogMessage,
            wasEditing
                ? "Blog updated successfully!"
                : "Blog added successfully!"
        );
    });
}

// ========================================
// CANCEL BLOG EDIT
// ========================================

const cancelBlogEdit = $("cancelBlogEdit");

if (cancelBlogEdit) {
    cancelBlogEdit.addEventListener("click", function () {
        resetBlogForm();
    });
}

// ========================================
// CREATE PROJECT CARD
// ========================================

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
    date.className = "item-date";
    date.textContent = formatDate(project.date);

    card.appendChild(date);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Edit';

    editButton.addEventListener("click", () => {
        editProject(project.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash"></i> Delete';

    deleteButton.addEventListener("click", () => {
        deleteProject(project.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);

    return card;
}

// ========================================
// DISPLAY PROJECTS
// ========================================

function renderProjects() {
    const savedProjects = $("savedProjects");
    const projectCount = $("projectCount");

    const projects = getProjects();

    if (projectCount) {
        projectCount.textContent = projects.length;
    }

    if (!savedProjects) {
        return;
    }

    savedProjects.replaceChildren();

    if (projects.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent =
            "No projects yet. Add your first project!";

        savedProjects.appendChild(emptyMessage);
        return;
    }

    [...projects].reverse().forEach((project) => {
        savedProjects.appendChild(
            createProjectCard(project)
        );
    });
}

// ========================================
// EDIT PROJECT
// ========================================

function editProject(projectId) {
    const project = getProjects().find(
        (item) => item.id === projectId
    );

    if (!project) {
        alert("Project not found.");
        return;
    }

    editingProjectId = project.id;

    const projectTitle = $("projectTitle");
    const projectDescription = $("projectDescription");
    const projectSubmitBtn = $("projectSubmitBtn");
    const cancelProjectEdit = $("cancelProjectEdit");
    const projectFormHeading = $("projectFormHeading");

    if (projectTitle) {
        projectTitle.value = project.title;
    }

    if (projectDescription) {
        projectDescription.value = project.description;
    }

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

    if (projectSubmitBtn) {
        projectSubmitBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Project';
    }

    if (cancelProjectEdit) {
        cancelProjectEdit.style.display = "inline-block";
    }

    if (projectFormHeading) {
        projectFormHeading.textContent = "Edit Project";
    }

    hideMessage($("projectMessage"));

    showPage("add-project");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ========================================
// DELETE PROJECT
// ========================================

function deleteProject(projectId) {
    const projects = getProjects();

    const project = projects.find(
        (item) => item.id === projectId
    );

    if (!project) {
        alert("Project not found.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${project.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedProjects = projects.filter(
        (item) => item.id !== projectId
    );

    if (!saveItems(PROJECTS_KEY, updatedProjects)) {
        return;
    }

    renderProjects();

    showMessage(
        $("projectMessage"),
        "Project deleted successfully!"
    );
}

// ========================================
// ADD OR UPDATE PROJECT
// ========================================

const projectForm = $("projectForm");

if (projectForm) {
    projectForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const projectTitle = $("projectTitle");
        const projectDescription = $("projectDescription");
        const projectMessage = $("projectMessage");

        const title = projectTitle
            ? projectTitle.value.trim()
            : "";

        const description = projectDescription
            ? projectDescription.value.trim()
            : "";

        if (!title || !description) {
            showMessage(
                projectMessage,
                "Please enter both the project title and description.",
                true
            );

            return;
        }

        const wasEditing = editingProjectId !== null;

        const projects = getProjects();

        const existingProject = wasEditing
            ? projects.find(
                (item) => item.id === editingProjectId
            )
            : null;

        const project = {
            id: existingProject
                ? existingProject.id
                : makeId(),

            title: title,

            description: description,

            image:
                selectedProjectImage ||
                (
                    existingProject
                        ? existingProject.image
                        : ""
                ) ||
                "",

            date: existingProject
                ? existingProject.date
                : new Date().toISOString()
        };

        let updatedProjects;

        if (wasEditing) {
            updatedProjects = projects.map((item) =>
                item.id === editingProjectId
                    ? project
                    : item
            );
        } else {
            updatedProjects = [...projects, project];
        }

        if (!saveItems(PROJECTS_KEY, updatedProjects)) {
            return;
        }

        resetProjectForm();
        renderProjects();

        showMessage(
            projectMessage,
            wasEditing
                ? "Project updated successfully!"
                : "Project added successfully!"
        );
    });
}

// ========================================
// CANCEL PROJECT EDIT
// ========================================

const cancelProjectEdit = $("cancelProjectEdit");

if (cancelProjectEdit) {
    cancelProjectEdit.addEventListener("click", function () {
        resetProjectForm();
    });
}

// ========================================
// APPLY DASHBOARD THEME
// ========================================

function applyDashboardTheme(theme) {
    document.body.classList.toggle(
        "light-mode",
        theme === "light"
    );
}

// ========================================
// LOAD SETTINGS
// ========================================

function loadSettings() {
    const savedName =
        localStorage.getItem(ADMIN_NAME_KEY) ||
        "Jean d'Amour";

    const savedTheme =
        localStorage.getItem(THEME_KEY) ||
        "dark";

    const settingsName = $("settingsName");
    const settingsTheme = $("settingsTheme");

    if (settingsName) {
        settingsName.value = savedName;
    }

    if (settingsTheme) {
        settingsTheme.value = savedTheme;

        settingsTheme.addEventListener(
            "change",
            function () {
                applyDashboardTheme(this.value);
            }
        );
    }

    applyDashboardTheme(savedTheme);

    updateAdminName(savedName);
}

// ========================================
// UPDATE ADMIN NAME
// ========================================

function updateAdminName(name) {
    const userName = document.querySelector(".user strong");

    if (userName) {
        userName.textContent = name;
    }

    const topbarDescription = document.querySelector(
        ".topbar > div:first-child p"
    );

    if (topbarDescription) {
        topbarDescription.textContent =
            `Welcome back, ${name}!`;
    }

    document
        .querySelectorAll("#profilePage p strong")
        .forEach((strongElement) => {
            if (
                strongElement.textContent.trim() === "Name:"
            ) {
                const parent = strongElement.parentElement;

                if (parent) {
                    parent.textContent = `Name: ${name}`;
                }
            }
        });
}

// ========================================
// SAVE SETTINGS
// ========================================

const settingsForm = $("settingsForm");

if (settingsForm) {
    settingsForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const settingsName = $("settingsName");
        const settingsTheme = $("settingsTheme");
        const settingsMessage = $("settingsMessage");

        const name = settingsName
            ? settingsName.value.trim()
            : "";

        const theme = settingsTheme
            ? settingsTheme.value
            : "dark";

        if (!name) {
            showMessage(
                settingsMessage,
                "Please enter your name.",
                true
            );

            return;
        }

        try {
            localStorage.setItem(ADMIN_NAME_KEY, name);
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error("Could not save settings:", error);

            showMessage(
                settingsMessage,
                "Could not save settings. Check your browser storage.",
                true
            );

            return;
        }

        updateAdminName(name);
        applyDashboardTheme(theme);

        showMessage(
            settingsMessage,
            "Settings saved successfully!"
        );
    });
}


/* ========================================
   LOGOUT
======================================== */

const logoutBtn = $("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {

        const confirmed = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) {
            return;
        }

        // Go to the login page
        window.location.href = "Login.html";
    });
}


// ========================================
// INITIALIZE DASHBOARD
// ========================================

function initializeDashboard() {
    loadSettings();

    renderBlogs();
    renderProjects();

    showPage("dashboard");
}

initializeDashboard();