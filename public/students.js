let allStudents = [];
let allBranches = [];
let allDistricts = [];
let currentStudents = [];

const categoryMap = {
  "OC Boys": "ocBoys",
  "OC Girls": "ocGirls",
  "BC-A Boys": "bcABoys",
  "BC-A Girls": "bcAGirls",
  "BC-B Boys": "bcBBoys",
  "BC-B Girls": "bcBGirls",
  "BC-C Boys": "bcCBoys",
  "BC-C Girls": "bcCGirls",
  "BC-D Boys": "bcDBoys",
  "BC-D Girls": "bcDGirls",
  "BC-E Boys": "bcEBoys",
  "BC-E Girls": "bcEGirls",
  "SC Boys": "scBoys",
  "SC Girls": "scGirls",
  "ST Boys": "stBoys",
  "ST Girls": "stGirls",
  "EWS GEN OU": "ewsGenOu",
  "EWS GIRLS OU": "ewsGirlsOu"
};

const categories = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b));

async function fetchStudents() {
  try {
    const res = await fetch("/api/students");
    const data = await res.json();

    allBranches = [...new Set(data.map(s => s.branchCode))].sort();
    allDistricts = [...new Set(data.map(s => s.distCode))].sort();
    allStudents = data;

    currentStudents = [...allStudents];

    populateDropdowns();
    populateTable(allStudents);
  } catch (err) {
    console.error(err);
  }
}

function populateTable(students, selectedCaste = "") {
  currentStudents = [...students];

  const tbody = document.querySelector("#studentTable tbody");
  const theadRow = document.querySelector("#studentTable thead tr");
  tbody.innerHTML = "";

  const casteColumns = selectedCaste ? [selectedCaste] : categories;

  const headers = [
    "Institute Code", "Institute Name", "Place",
    "Dist Code", "Branch Code", "Branch Name",
    ...casteColumns, "Tuition Fee"
  ];

  theadRow.innerHTML = headers.map(h => `<th>${h}</th>`).join("");

  students.forEach(s => {
    let row = `<tr>
      <td>${s.instituteCode || ""}</td>
      <td>${s.instituteName || ""}</td>
      <td>${s.place || ""}</td>
      <td>${s.distCode || ""}</td>
      <td>${s.branchCode || ""}</td>
      <td>${s.branchName || ""}</td>`;

    casteColumns.forEach(cat => {
      row += `<td>${s[categoryMap[cat]] !== undefined ? s[categoryMap[cat]] : 0}</td>`;
    });

    row += `<td>${s.tuitionFee || 0}</td></tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

function populateDropdowns() {
  const branchSelect = document.getElementById("branch");
  const districtSelect = document.getElementById("district");
  const casteSelect = document.getElementById("filterCaste");

  branchSelect.innerHTML = `<option value="">-- Select Branch --</option>`;
  districtSelect.innerHTML = `<option value="">-- Select District --</option>`;
  casteSelect.innerHTML = `<option value="">-- Filter by Caste --</option>`;

  allBranches.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    branchSelect.appendChild(opt);
  });

  allDistricts.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    districtSelect.appendChild(opt);
  });

  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    casteSelect.appendChild(opt);
  });
}

function applyFilters() {
  let filtered = [...allStudents];

  const name = document.getElementById("name").value.toLowerCase();
  const studentCasteInput = document.getElementById("studentCaste").value;
  const branch = document.getElementById("branch").value;
  const district = document.getElementById("district").value;
  const filterCaste = document.getElementById("filterCaste").value;

  const rank = parseInt(document.getElementById("rank").value);
  const minRank = parseInt(document.getElementById("minRank").value);
  const maxRank = parseInt(document.getElementById("maxRank").value);

  if (name) {
    filtered = filtered.filter(
      s =>
        (s.instituteName && s.instituteName.toLowerCase().includes(name)) ||
        (s.branchName && s.branchName.toLowerCase().includes(name)) ||
        (s.place && s.place.toLowerCase().includes(name)) ||
        (s.distCode && s.distCode.toLowerCase().includes(name))
    );
  }

  const casteToFilter = studentCasteInput || filterCaste;

  if (branch) filtered = filtered.filter(s => s.branchCode === branch);
  if (district) filtered = filtered.filter(s => s.distCode === district);

  if (casteToFilter && categoryMap[casteToFilter]) {
    const field = categoryMap[casteToFilter];

    if (!isNaN(rank))
      filtered = filtered.filter(s => Number(s[field]) === rank);
    if (!isNaN(minRank))
      filtered = filtered.filter(s => Number(s[field]) >= minRank);
    if (!isNaN(maxRank))
      filtered = filtered.filter(s => Number(s[field]) <= maxRank);

    filtered.sort((a, b) => {
      const va = Number(a[field]);
      const vb = Number(b[field]);
      const na = isNaN(va) ? Infinity : va;
      const nb = isNaN(vb) ? Infinity : vb;
      return na - nb || (a.instituteCode || "").localeCompare(b.instituteCode || "");
    });
  } else {
    filtered.sort((a, b) => (a.instituteCode || "").localeCompare(b.instituteCode || ""));
  }

  populateTable(filtered, casteToFilter);
}

function resetFilters() {
  document.getElementById("name").value = "";
  document.getElementById("studentCaste").value = "";
  document.getElementById("branch").value = "";
  document.getElementById("district").value = "";
  document.getElementById("filterCaste").value = "";
  document.getElementById("rank").value = "";
  document.getElementById("minRank").value = "";
  document.getElementById("maxRank").value = "";

  populateTable(allStudents);
}

function downloadPDF() {
  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Campus Students (Filtered)", 14, 15);

    const studentName = document.getElementById("name").value || "N/A";
    const studentRank = document.getElementById("rank").value || "N/A";
    const studentCaste =
      document.getElementById("studentCaste").value ||
      document.getElementById("filterCaste").value ||
      "";

    doc.setFontSize(11);
    doc.text(`Student Name: ${studentName}`, 14, 25);
    doc.text(`Rank: ${studentRank}`, 14, 32);
    doc.text(`Caste: ${studentCaste || "N/A"}`, 14, 39);

    const headers = [
      "Institute Code", "Institute Name", "Place",
      "Dist Code", "Branch Code", "Branch Name"
    ];

    let rowsSource = [...currentStudents];

    if (studentCaste && categoryMap[studentCaste]) {
      const rankField = categoryMap[studentCaste];
      rowsSource.sort((a, b) => {
        const va = Number(a[rankField]);
        const vb = Number(b[rankField]);
        const na = isNaN(va) ? Infinity : va;
        const nb = isNaN(vb) ? Infinity : vb;
        return na - nb || (a.instituteCode || "").localeCompare(b.instituteCode || "");
      });
    }

    const rows = rowsSource.map(s => [
      s.instituteCode,
      s.instituteName,
      s.place,
      s.distCode,
      s.branchCode,
      s.branchName
    ]);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 45
    });

    doc.save("students_filtered.pdf");
  } else {
    alert("jsPDF not loaded properly.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("searchBtn").addEventListener("click", applyFilters);
  document.getElementById("resetBtn").addEventListener("click", resetFilters);
  document.getElementById("downloadBtn").addEventListener("click", downloadPDF);

  fetchStudents();
});
