const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const form = document.querySelector("#enquiryForm");
const formMessage = document.querySelector("#formMessage");
const publicDoctorGrid = document.querySelector("#publicDoctorGrid");
const API_BASE_URL = getApiBaseUrl();

function getApiBaseUrl() {
  const isLocalPage = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

  if (window.location.protocol === "file:" || (isLocalPage && window.location.port !== "3000")) {
    return "http://localhost:3000";
  }

  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
});

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const payload = {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      appointmentDate: form.appointmentDate.value,
      appointmentTime: form.appointmentTime.value,
      problemType: form.problemType.value,
      message: form.message.value.trim()
    };

    formMessage.className = "form-message";
    formMessage.textContent = "Submitting your appointment request...";
    submitButton.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      form.reset();
      formMessage.classList.add("success");
      formMessage.textContent = data.message;
    } catch (error) {
      formMessage.classList.add("error");
      formMessage.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function loadPublicDoctors() {
  if (!publicDoctorGrid) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/doctors`);
    const doctors = await response.json();

    if (!response.ok) {
      throw new Error(doctors.message || "Unable to load doctors.");
    }

    publicDoctorGrid.innerHTML = doctors.map((doctor) => `
      <article class="public-doctor-card">
        <div>
          <h3>${escapeHtml(doctor.doctorName)}</h3>
          <p>${escapeHtml(doctor.degree)}</p>
          <p>${escapeHtml(doctor.specialty)}</p>
        </div>
        <div class="doctor-schedule">
          <span class="${doctor.acceptingSchedule ? "status-open" : "status-closed"}">
            ${doctor.acceptingSchedule ? "Accepting Schedule" : "Not Accepting"}
          </span>
          <p>${escapeHtml(doctor.availableDays)}</p>
          <p>${escapeHtml(doctor.availableTime)}</p>
        </div>
      </article>
    `).join("");
  } catch (error) {
    publicDoctorGrid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

loadPublicDoctors();
