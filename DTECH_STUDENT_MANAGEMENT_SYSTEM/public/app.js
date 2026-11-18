// ============================================
// DTECH STUDENT MANAGEMENT SYSTEM
// FRONTEND JAVASCRIPT
// ============================================

const API_BASE_URL = "https://dtech-student-management-system.onrender.com";

// Send frontend requests to the Node.js backend
function apiFetch(endpoint, options = {}) {
    const backendUrl = new URL(endpoint, API_BASE_URL);
    return fetch(backendUrl, options);
}

// Select HTML elements
const studentForm = document.getElementById("studentForm");

const studentTable = document.getElementById("studentTable");

const searchInput = document.getElementById("searchInput");

const totalStudents = document.getElementById("totalStudents");

const totalCourses = document.getElementById("totalCourses");

const notice = document.getElementById("notice");

const formTitle = document.getElementById("formTitle");

const submitButton = document.getElementById("submitButton");

const cancelEdit = document.getElementById("cancelEdit");

const studentDialog = document.getElementById("studentDialog");

const studentDetails = document.getElementById("studentDetails");

const profileDownloads = document.getElementById("profileDownloads");

const closeDialog = document.getElementById("closeDialog");

// Current editing student
let editingStudentID = null;

// ============================================
// DISPLAY NOTIFICATIONS
// ============================================

function showNotice(message, type = "success", studentID = null) {
  notice.hidden = false;

  notice.className = `notice ${type}`;

  notice.replaceChildren();

  const messageText = document.createElement("p");

  messageText.textContent = message;

  notice.appendChild(messageText);

  if (studentID) {
    const jsonLink = document.createElement("a");

    jsonLink.href = `/api/students/${encodeURIComponent(studentID)}/json`;

    jsonLink.textContent = "Download JSON";

    const xmlLink = document.createElement("a");

    xmlLink.href = `/api/students/${encodeURIComponent(studentID)}/xml`;

    xmlLink.textContent = "Download XML";

    notice.appendChild(jsonLink);

    notice.appendChild(xmlLink);
  }

  notice.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

// ============================================
// GET STUDENT INFORMATION
// ============================================

async function loadStudents(search = "") {
  try {
    const response = await apiFetch(
      `/api/students?search=${encodeURIComponent(search)}`,
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load students.");
    }

    displayStudents(data.students);

    updateStatistics(data.students);
  } catch (error) {
    console.error(error);

    studentTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    Unable to load student records.
                </td>
            </tr>
        `;
  }
}

// ============================================
// DISPLAY STUDENT RECORDS
// ============================================

function displayStudents(students) {
  studentTable.replaceChildren();

  if (students.length === 0) {
    const row = document.createElement("tr");

    const cell = document.createElement("td");

    cell.colSpan = 6;

    cell.className = "empty-message";

    cell.textContent = "No student records found.";

    row.appendChild(cell);

    studentTable.appendChild(row);

    return;
  }

  students.forEach((student) => {
    const row = document.createElement("tr");

    const values = [
      student.studentID,
      `${student.firstName} ${student.lastName}`,
      student.course,
      student.email,
      student.city,
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");

      cell.textContent = value;

      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");

    const actions = document.createElement("div");

    actions.className = "action-buttons";

    // View button

    const viewButton = document.createElement("button");

    viewButton.textContent = "View";

    viewButton.className = "view-button";

    viewButton.addEventListener("click", () => {
      viewStudent(student.studentID);
    });

    // Edit button

    const editButton = document.createElement("button");

    editButton.textContent = "Edit";

    editButton.className = "edit-button";

    editButton.addEventListener("click", () => {
      editStudent(student.studentID);
    });

    // Delete button

    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";

    deleteButton.className = "delete-button";

    deleteButton.addEventListener("click", () => {
      deleteStudent(student.studentID);
    });

    actions.appendChild(viewButton);

    actions.appendChild(editButton);

    actions.appendChild(deleteButton);

    actionCell.appendChild(actions);

    row.appendChild(actionCell);

    studentTable.appendChild(row);
  });
}

// ============================================
// UPDATE DASHBOARD STATISTICS
// ============================================

function updateStatistics(students) {
  totalStudents.textContent = students.length;

  const courses = new Set(students.map((student) => student.course));

  totalCourses.textContent = courses.size;
}

// ============================================
// REGISTER OR UPDATE STUDENT
// ============================================

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(studentForm);

  const studentData = Object.fromEntries(formData.entries());

  const isEditing = Boolean(editingStudentID);

  const url = isEditing
    ? `/api/students/${encodeURIComponent(editingStudentID)}`
    : "/api/students";

  const method = isEditing ? "PUT" : "POST";

  submitButton.disabled = true;

  submitButton.textContent = isEditing ? "Updating..." : "Registering...";

  try {
    const response = await apiFetch(url, {
      method: method,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(studentData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Something went wrong.");
    }

    showNotice(result.message, "success", result.student.studentID);

    resetForm();

    await loadStudents();
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    submitButton.disabled = false;

    submitButton.textContent = editingStudentID
      ? "Update Student"
      : "Register Student";
  }
});

// ============================================
// VIEW STUDENT PROFILE
// ============================================

async function viewStudent(studentID) {
  try {
    const response = await apiFetch("/api/students");

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error("Unable to retrieve student information.");
    }

    const student = data.students.find((item) => item.studentID === studentID);

    if (!student) {
      throw new Error("Student not found.");
    }

    studentDetails.textContent = `

STUDENT ID: ${student.studentID}

FIRST NAME: ${student.firstName}

LAST NAME: ${student.lastName}

AGE: ${student.age}

EMAIL: ${student.email}

PHONE: ${student.phone}

COURSE: ${student.course}

CITY: ${student.city}

REGISTRATION DATE: ${new Date(student.registrationDate).toLocaleString()}

`;

    profileDownloads.replaceChildren();

    const jsonLink = document.createElement("a");

    jsonLink.href = `/api/students/${encodeURIComponent(studentID)}/json`;

    jsonLink.textContent = "Download JSON";

    const xmlLink = document.createElement("a");

    xmlLink.href = `/api/students/${encodeURIComponent(studentID)}/xml`;

    xmlLink.textContent = "Download XML";

    profileDownloads.appendChild(jsonLink);

    profileDownloads.appendChild(xmlLink);

    studentDialog.showModal();
  } catch (error) {
    showNotice(error.message, "error");
  }
}

// ============================================
// EDIT STUDENT
// ============================================

async function editStudent(studentID) {
  try {
    const response = await apiFetch("/api/students");

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error("Unable to retrieve student records.");
    }

    const student = data.students.find((item) => item.studentID === studentID);

    if (!student) {
      throw new Error("Student not found.");
    }

    editingStudentID = studentID;

    document.getElementById("firstName").value = student.firstName;

    document.getElementById("lastName").value = student.lastName;

    document.getElementById("age").value = student.age;

    document.getElementById("email").value = student.email;

    document.getElementById("phone").value = student.phone;

    document.getElementById("course").value = student.course;

    document.getElementById("city").value = student.city;

    formTitle.textContent = "Update Student Information";

    submitButton.textContent = "Update Student";

    cancelEdit.hidden = false;

    document.getElementById("registration").scrollIntoView({
      behavior: "smooth",
    });
  } catch (error) {
    showNotice(error.message, "error");
  }
}

// ============================================
// DELETE STUDENT
// ============================================

async function deleteStudent(studentID) {
  const confirmed = confirm(`Are you sure you want to delete ${studentID}?`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await apiFetch(
      `/api/students/${encodeURIComponent(studentID)}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to delete student.");
    }

    showNotice(result.message, "success");

    if (editingStudentID === studentID) {
      resetForm();
    }

    await loadStudents();
  } catch (error) {
    showNotice(error.message, "error");
  }
}

// ============================================
// RESET REGISTRATION FORM
// ============================================

function resetForm() {
  studentForm.reset();

  editingStudentID = null;

  formTitle.textContent = "Register New Student";

  submitButton.textContent = "Register Student";

  cancelEdit.hidden = true;
}

cancelEdit.addEventListener("click", resetForm);

// ============================================
// SEARCH STUDENTS
// ============================================

searchInput.addEventListener("input", () => {
  loadStudents(searchInput.value.trim());
});

// ============================================
// CLOSE STUDENT PROFILE
// ============================================

closeDialog.addEventListener("click", () => {
  studentDialog.close();
});

// ============================================
// START APPLICATION
// ============================================

loadStudents();
