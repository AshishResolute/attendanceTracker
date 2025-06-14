document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    newSubjectName: document.getElementById("newSubjectName"),
    newAttended: document.getElementById("newAttended"),
    newTotal: document.getElementById("newTotal"),
    addSubjectBtn: document.getElementById("addSubjectBtn"),
    subjectsList: document.getElementById("subjectsList"),
    saveDataBtn: document.getElementById("saveDataBtn"),
    loadDataBtn: document.getElementById("loadDataBtn"),
    clearDataBtn: document.getElementById("clearDataBtn"),
    noSubjectsMessage: document.getElementById("noSubjectsMessage"),
    alertContainer: document.getElementById("alertContainer"),
  };

  let subjects = [];

  const saveData = () => {
    localStorage.setItem(
      "attendanceTrackerData",
      JSON.stringify(subjects)
    );
    alertMessage("Data saved successfully!", "green");
  };

  const loadData = () => {
    const savedData = localStorage.getItem("attendanceTrackerData");
    if (savedData) {
      subjects = JSON.parse(savedData);
      subjects.forEach((subject) => {
        subject.lastUpdated = subject.lastUpdated || getCurrentDate();
        subject.percentage = calculatePercentage(
          subject.attended,
          subject.total
        );
      });
      renderSubjects();
      alert("Data loaded successfully!");
    } else {
      alert("No saved data found.");
    }
  };

  const clearData = () => {
    showConfirmation(
      "Are you sure you want to clear all attendance data? This action cannot be undone.",
      () => {
        localStorage.removeItem("attendanceTrackerData");
        subjects = [];
        renderSubjects();
        alert("All data cleared.");
      }
    );
  };

  const calculatePercentage = (attended, total) => {
    return total === 0 ? "N/A" : ((attended / total) * 100).toFixed(2);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };

  const alertMessage = (message, type = "info") => {
    const alertDiv = document.createElement("div");
    alertDiv.className = `custom-alert`;
    alertDiv.classList.add(bgColorMap[type] || bgColorMap.info);
    alertDiv.textContent = message;

    elements.alertContainer.appendChild(alertDiv);
  };

  const showConfirmation = (message, onConfirm) => {
    const modalId = "confirmModal";
    let modal = document.getElementById(modalId);

    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = `confirm-modal-overlay`;
    modal.innerHTML = `
                    <div class="confirm-modal-content">
                        <p>${message}</p>
                        <div class="confirm-modal-buttons">
                            <button id="confirmYes" class="btn-primary px-6 py-2">Yes</button>
                            <button id="confirmNo" class="btn-secondary px-6 py-2">No</button>
                        </div>
                    </div>
                `;
    document.body.appendChild(modal);

    setTimeout(() => {
      modal.style.opacity = "1";
    }, 10);

    const closeModal = () => {
      modal.style.opacity = "0";
      modal.addEventListener("transitionend", () => modal.remove(), {
        once: true,
      });
    };

    document
      .getElementById("confirmYes")
      .addEventListener("click", () => {
        onConfirm();
        closeModal();
      });
    document
      .getElementById("confirmNo")
      .addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  };

  const renderSubjects = () => {
    elements.subjectsList.innerHTML = "";
    if (subjects.length === 0) {
      elements.noSubjectsMessage.style.display = "block";
    } else {
      elements.noSubjectsMessage.style.display = "none";
      subjects.forEach((subject, index) => {
        const subjectItem = document.createElement("div");
        subjectItem.className = "subject-item";

        const percentageValue = parseFloat(subject.percentage);
        const percentageDisplay = isNaN(percentageValue)
          ? "N/A"
          : percentageValue.toFixed(2) + "%";
        const percentageColorClass =
          percentageValue >= 75 ? "text-green-600" : "text-red-600";

        subjectItem.innerHTML = `
                            <div class="subject-info">
                                <input type="text" value="${subject.name
          }" data-index="${index}" data-field="name">
                                <div class="class-inputs">
                                    <input type="number" value="${subject.attended
          }" data-index="${index}" data-field="attended">
                                    <input type="number" value="${subject.total
          }" data-index="${index}" data-field="total">
                                </div>
                               
                            </div>
                            <span class="attendance-percentage ${percentageColorClass}">
                                ${percentageDisplay}
                            </span>
                            <button class="remove-subject-btn">Remove</button>
                        `;
        elements.subjectsList.appendChild(subjectItem);
      });
    }
  };

  elements.addSubjectBtn.addEventListener("click", () => {
    const name = elements.newSubjectName.value;
    const attended = parseInt(elements.newAttended.value, 10);
    const total = parseInt(elements.newTotal.value, 10);

    if (
      !name ||isNaN(attended) ||isNaN(total) ||attended < 0 ||total < 0 ||attended > total
    ) {
      alertMessage(
        "Please enter valid data"
      );
      return;
    }

    subjects.push({name,attended,total,
      percentage: calculatePercentage(attended, total),
    });

    elements.newSubjectName.value = "";
    elements.newAttended.value = "";
    elements.newTotal.value = "";

    renderSubjects();
    saveData();
  });

  elements.subjectsList.addEventListener("input", (event) => {
    const target = event.target;
    const { index, field } = target.dataset;

    if (index === undefined || !field) return;

    let value = target.value;


    if (field === "attended" || field === "total") {
      value = parseInt(value, 10);
      if (isNaN(value) || value < 0) {
        alertMessage("Please enter a valid non-negative number.");
        return;
      }
      if (subjects[index][field] !== value) shouldUpdateDate = true;
    } else if (field === "name") {
      if (subjects[index][field] !== value) shouldUpdateDate = true;
    }

    const tempAttended =
      field === "attended" ? value : subjects[index].attended;
    const tempTotal = field === "total" ? value : subjects[index].total;
    if (
      tempAttended &&tempTotal &&tempAttended > tempTotal
    ) {
      alertMessage(
        "Attended classes cannot be more than total classes."

      );
      return;
    }

    subjects[index][field] = value;
    saveData();
  });

  elements.subjectsList.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-subject-btn")) {
      const subjectItem = event.target.closest(".subject-item");
      const index = subjectItem.querySelector('input[data-field="name"]')
        .dataset.index;

      showConfirmation(
        `Are you sure you want to remove "${subjects[index].name}"?`,
        () => {
          subjects.splice(index, 1);
          renderSubjects();
          saveData();
        }
      );
    }
  });

  elements.saveDataBtn.addEventListener("click", saveData);
  elements.loadDataBtn.addEventListener("click", loadData);
  elements.clearDataBtn.addEventListener("click", clearData);
  loadData();
});