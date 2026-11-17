const loadButton = document.getElementById("loadButton");

const message = document.getElementById("message");

const studentSection = document.getElementById("studentSection");

function showMessage(text, type = "") {
  message.textContent = text;

  message.className = "message " + type;
}

function getElementText(parent, tagName) {
  const element = parent.getElementsByTagName(tagName)[0];

  return element ? element.textContent.trim() : "";
}

function getMultipleElements(parent, tagName) {
  const elements = parent.getElementsByTagName(tagName);

  return Array.from(elements).map((element) => element.textContent.trim());
}

function displayStudent(student) {
  const name = getElementText(student, "Name");

  const age = getElementText(student, "Age");

  const studentID = getElementText(student, "StudentID");

  const level = getElementText(student, "Level");

  const studentAttribute = student.getAttribute("id");

  // Display student information

  document.getElementById("studentName").textContent = name;

  document.getElementById("avatar").textContent = name.charAt(0).toUpperCase();

  document.getElementById("studentId").textContent =
    "Registration ID: " + studentAttribute;

  document.getElementById("studentAge").textContent = age;

  document.getElementById("studentNumber").textContent = studentID;

  document.getElementById("studentTraining").textContent = level;

  document.getElementById("studentLevel").textContent = level;

  // Display phone numbers

  const phones = getMultipleElements(student, "Phone");

  const phoneList = document.getElementById("phoneList");

  phoneList.replaceChildren();

  if (phones.length === 0) {
    const empty = document.createElement("p");

    empty.className = "empty-message";

    empty.textContent = "No phone numbers provided.";

    phoneList.appendChild(empty);
  } else {
    phones.forEach((phone) => {
      const item = document.createElement("div");

      item.className = "phone-item";

      item.textContent = phone;

      phoneList.appendChild(item);
    });
  }

  // Display skills

  const skills = getMultipleElements(student, "Skill");

  const skillList = document.getElementById("skillList");

  skillList.replaceChildren();

  skills.forEach((skill) => {
    const tag = document.createElement("span");

    tag.className = "tag";

    tag.textContent = skill;

    skillList.appendChild(tag);
  });

  // Display certificates

  const certificates = getMultipleElements(student, "Certificate");

  const certificateList = document.getElementById("certificateList");

  certificateList.replaceChildren();

  if (certificates.length === 0) {
    const empty = document.createElement("p");

    empty.className = "empty-message";

    empty.textContent = "No certificates available.";

    certificateList.appendChild(empty);
  } else {
    certificates.forEach((certificate) => {
      const tag = document.createElement("span");

      tag.className = "tag";

      tag.textContent = certificate;

      certificateList.appendChild(tag);
    });
  }

  // Show the student dashboard

  studentSection.classList.remove("hidden");
}

async function loadStudentData() {
  try {
    showMessage("Loading student information...");

    studentSection.classList.add("hidden");

    const response = await fetch("dtech-registration.xml");

    if (!response.ok) {
      throw new Error("Could not load the XML file.");
    }

    const xmlText = await response.text();

    const parser = new DOMParser();

    const xmlDocument = parser.parseFromString(xmlText, "application/xml");

    // Check for XML syntax errors

    const parserError = xmlDocument.querySelector("parsererror");

    if (parserError) {
      throw new Error("Your XML document contains a syntax error.");
    }

    // Find the student element

    const student = xmlDocument.getElementsByTagName("student")[0];

    if (!student) {
      throw new Error("No student record was found.");
    }

    // Display the student information

    displayStudent(student);

    showMessage("Student information loaded successfully!", "success");
  } catch (error) {
    showMessage(error.message, "error");

    console.error(error);
  }
}

loadButton.addEventListener("click", loadStudentData);
