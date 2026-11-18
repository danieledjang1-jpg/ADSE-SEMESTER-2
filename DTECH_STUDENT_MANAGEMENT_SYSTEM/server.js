// ============================================
// DTECH STUDENT MANAGEMENT SYSTEM
// COMPLETE BACKEND
// ============================================

// Import modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const { XMLBuilder } = require("fast-xml-parser");
const cors = require("cors");

// Create Express application
const app = express();

// Server configuration
const PORT = process.env.PORT || 3000;

// File locations
const JSON_FILE = path.join(__dirname, "data", "students.json");
const XML_FILE = path.join(__dirname, "data", "students.xml");

// XML configuration
const xmlBuilder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://dtech-student-management-system.netlify.app"
    ]
}));

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

// ============================================
// DATABASE INITIALIZATION

fs.mkdirSync(path.dirname(JSON_FILE), { recursive: true });
// ============================================

if (!fs.existsSync(JSON_FILE)) {
  fs.writeFileSync(JSON_FILE, JSON.stringify({ students: [] }, null, 4));
}

if (!fs.existsSync(XML_FILE)) {
  fs.writeFileSync(
    XML_FILE,
    '<?xml version="1.0" encoding="UTF-8"?>\n<students></students>',
  );
}

// ============================================
// READ STUDENT RECORDS
// ============================================

function getStudents() {
  const data = fs.readFileSync(JSON_FILE, "utf8");

  const database = JSON.parse(data);

  return database.students || [];
}

// ============================================
// SAVE STUDENT RECORDS
// ============================================

function saveStudents(students) {
  // Convert records into JSON
  const jsonData = JSON.stringify({ students }, null, 4);

  // Convert records into XML
  const xmlData = xmlBuilder.build({
    students: {
      student: students,
    },
  });

  const completeXML = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlData;

  // Write temporary files first
  const jsonTemp = JSON_FILE + ".tmp";
  const xmlTemp = XML_FILE + ".tmp";

  fs.writeFileSync(jsonTemp, jsonData, "utf8");
  fs.writeFileSync(xmlTemp, completeXML, "utf8");

  // Replace the existing files
  fs.renameSync(jsonTemp, JSON_FILE);
  fs.renameSync(xmlTemp, XML_FILE);
}

// ============================================
// GENERATE UNIQUE STUDENT ID
// ============================================

function generateStudentID(students) {
  let highestNumber = 0;

  students.forEach((student) => {
    const number = Number(String(student.studentID).replace("DTECH", ""));

    if (Number.isFinite(number) && number > highestNumber) {
      highestNumber = number;
    }
  });

  return "DTECH" + String(highestNumber + 1).padStart(4, "0");
}

// ============================================
// VALIDATE STUDENT INFORMATION
// ============================================

function validateStudent(data) {
  const requiredFields = [
    "firstName",
    "lastName",
    "age",
    "email",
    "phone",
    "course",
    "city",
  ];

  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      String(data[field]).trim() === ""
    ) {
      return `Please provide your ${field}.`;
    }
  }

  const age = Number(data.age);

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return "Please enter a valid age.";
  }

  const email = String(data.email).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  const phone = String(data.phone).trim();

  if (phone.length < 7 || phone.length > 25) {
    return "Please enter a valid phone number.";
  }

  return null;
}

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DTECH backend is running!",
  });
});

// ============================================
// GET ALL STUDENTS
// ============================================

app.get("/api/students", (req, res) => {
  try {
    const students = getStudents();

    const search = String(req.query.search || "").toLowerCase();

    const filteredStudents = students.filter((student) => {
      const searchableText = [
        student.studentID,
        student.firstName,
        student.lastName,
        student.email,
        student.course,
        student.city,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });

    res.json({
      success: true,
      totalStudents: filteredStudents.length,
      students: filteredStudents,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve student records.",
    });
  }
});

// ============================================
// REGISTER STUDENT
// ============================================

app.post("/api/students", (req, res) => {
  try {
    const error = validateStudent(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const students = getStudents();

    const email = String(req.body.email).trim().toLowerCase();

    // Prevent duplicate email addresses
    const existingStudent = students.find(
      (student) => student.email.toLowerCase() === email,
    );

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this email address already exists.",
      });
    }

    const newStudent = {
      studentID: generateStudentID(students),

      firstName: String(req.body.firstName).trim(),

      lastName: String(req.body.lastName).trim(),

      age: Number(req.body.age),

      email: email,

      phone: String(req.body.phone).trim(),

      course: String(req.body.course).trim(),

      city: String(req.body.city).trim(),

      registrationDate: new Date().toISOString(),
    };

    students.push(newStudent);

    // Save in JSON and XML
    saveStudents(students);

    res.status(201).json({
      success: true,

      message: "Registration completed successfully!",

      student: newStudent,

      savedFormats: ["JSON", "XML"],
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// ============================================
// UPDATE STUDENT
// ============================================

app.put("/api/students/:id", (req, res) => {
  try {
    const students = getStudents();

    const index = students.findIndex(
      (student) => student.studentID === req.params.id,
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const error = validateStudent(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const email = String(req.body.email).trim().toLowerCase();

    const duplicateEmail = students.find(
      (student, i) => i !== index && student.email.toLowerCase() === email,
    );

    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        message: "Another student already uses this email.",
      });
    }

    const updatedStudent = {
      ...students[index],

      firstName: String(req.body.firstName).trim(),

      lastName: String(req.body.lastName).trim(),

      age: Number(req.body.age),

      email: email,

      phone: String(req.body.phone).trim(),

      course: String(req.body.course).trim(),

      city: String(req.body.city).trim(),
    };

    students[index] = updatedStudent;

    saveStudents(students);

    res.json({
      success: true,

      message: "Student information updated successfully!",

      student: updatedStudent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to update student.",
    });
  }
});

// ============================================
// DELETE STUDENT
// ============================================

app.delete("/api/students/:id", (req, res) => {
  try {
    const students = getStudents();

    const updatedStudents = students.filter(
      (student) => student.studentID !== req.params.id,
    );

    if (students.length === updatedStudents.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    saveStudents(updatedStudents);

    res.json({
      success: true,

      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to delete student.",
    });
  }
});

// ============================================
// DOWNLOAD ALL STUDENTS AS JSON
// ============================================

app.get("/api/export/json", (req, res) => {
  try {
    const students = getStudents();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dtech-students.json",
    );

    res.type("application/json");

    res.send(JSON.stringify({ students }, null, 4));
  } catch (error) {
    res.status(500).send("Unable to export JSON.");
  }
});

// ============================================
// DOWNLOAD ALL STUDENTS AS XML
// ============================================

app.get("/api/export/xml", (req, res) => {
  try {
    const students = getStudents();

    const xmlData = xmlBuilder.build({
      students: {
        student: students,
      },
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dtech-students.xml",
    );

    res.type("application/xml");

    res.send('<?xml version="1.0" encoding="UTF-8"?>\n' + xmlData);
  } catch (error) {
    res.status(500).send("Unable to export XML.");
  }
});

// ============================================
// DOWNLOAD INDIVIDUAL STUDENT JSON
// ============================================

app.get("/api/students/:id/json", (req, res) => {
  try {
    const students = getStudents();

    const student = students.find((item) => item.studentID === req.params.id);

    if (!student) {
      return res.status(404).send("Student not found.");
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${student.studentID}.json`,
    );

    res.type("application/json");

    res.send(JSON.stringify(student, null, 4));
  } catch (error) {
    res.status(500).send("Unable to download student JSON.");
  }
});

// ============================================
// DOWNLOAD INDIVIDUAL STUDENT XML
// ============================================

app.get("/api/students/:id/xml", (req, res) => {
  try {
    const students = getStudents();

    const student = students.find((item) => item.studentID === req.params.id);

    if (!student) {
      return res.status(404).send("Student not found.");
    }

    const xmlData = xmlBuilder.build({
      student: student,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${student.studentID}.xml`,
    );

    res.type("application/xml");

    res.send('<?xml version="1.0" encoding="UTF-8"?>\n' + xmlData);
  } catch (error) {
    res.status(500).send("Unable to download student XML.");
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log("========================================");
  console.log("     DTECH STUDENT MANAGEMENT SYSTEM");
  console.log("========================================");

  console.log(`Server: http://localhost:${PORT}`);

  console.log("JSON storage connected!");

  console.log("XML storage connected!");

  console.log("Student registration system ready!");
});
