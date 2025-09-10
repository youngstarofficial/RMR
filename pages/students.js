import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCaste, setSelectedCaste] = useState("");

  const districtCodes = [
    "HNK", "HYD", "JTL", "KGM", "KHM", "KMR", "KRM", "MBN", "MDL", "MED",
    "MHB", "NLG", "NZB", "PDL", "RR", "SDP", "SRC", "SRD", "SRP", "WGL",
    "WNP", "YBG"
  ];

  const branchCodes = [
    "AGR", "AI", "AID", "AIM", "ANE", "AUT", "BIO", "BME", "CHE", "CIC",
    "CIV", "CME", "CS", "CSA", "CSB", "CSC", "CSD", "CSE", "CSG", "CSI",
    "CSM", "CSN", "CSO", "CSW", "DRG", "DTD", "ECE", "ECI", "ECM", "EEE",
    "EIE", "ETM", "FDT", "GEO", "INF", "MCT", "MEC", "MET", "MIN", "MMS",
    "MMT", "MTE", "PHD", "PHE", "PHM", "TEX"
  ];

  const casteOptions = [
    "OC Boys", "OC Girls", "BC-A Boys", "BC-A Girls", "BC-B Boys", "BC-B Girls",
    "BC-C Boys", "BC-C Girls", "BC-D Boys", "BC-D Girls", "BC-E Boys", "BC-E Girls",
    "SC Boys", "SC Girls", "ST Boys", "ST Girls", "EWS GEN OU", "EWS GIRLS OU"
  ];

  const casteMap = {
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
    "EWS GIRLS OU": "ewsGirlsOu",
  };

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          setFiltered(data);
        } else {
          setStudents([]);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setStudents([]);
      });
  }, []);

  const handleSearch = () => {
    const name = document.getElementById("name").value.toLowerCase();
    const rank = document.getElementById("rank").value;
    const caste = document.getElementById("studentCaste").value || document.getElementById("filterCaste").value;
    setSelectedCaste(caste);

    const branch = document.getElementById("branch").value;
    const district = document.getElementById("district").value;
    const minRank = document.getElementById("minRank").value;
    const maxRank = document.getElementById("maxRank").value;

    const casteKey = casteMap[caste] || null;

    const result = students.filter(s => {
      const matchesName = name ? s.instituteName.toLowerCase().includes(name) : true;
      const matchesBranch = branch ? s.branchCode === branch : true;
      const matchesDistrict = district ? s.distCode === district : true;

      let matchesRank = true;
      if (casteKey) {
        const rankValue = parseInt(s[casteKey]);
        if (rank && rankValue !== parseInt(rank)) matchesRank = false;
        if (minRank && rankValue < parseInt(minRank)) matchesRank = false;
        if (maxRank && rankValue > parseInt(maxRank)) matchesRank = false;
      }

      return matchesName && matchesBranch && matchesDistrict && matchesRank;
    });

    setFiltered(result);
  };

  const handleReset = () => {
    document.getElementById("name").value = "";
    document.getElementById("rank").value = "";
    document.getElementById("studentCaste").value = "";
    document.getElementById("branch").value = "";
    document.getElementById("district").value = "";
    document.getElementById("filterCaste").value = "";
    document.getElementById("minRank").value = "";
    document.getElementById("maxRank").value = "";
    setSelectedCaste("");
    setFiltered(students);
  };

  const handleSortByRank = () => {
    if (!selectedCaste || !casteMap[selectedCaste]) {
      alert("Please select a caste before sorting by rank.");
      return;
    }

    const casteKey = casteMap[selectedCaste];
    const sorted = [...filtered].sort((a, b) => {
      const rankA = parseInt(a[casteKey]) || Infinity;
      const rankB = parseInt(b[casteKey]) || Infinity;
      return rankA - rankB;
    });

    setFiltered(sorted);
  };

  const moveRow = (index, direction) => {
    const newData = [...filtered];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newData.length) return;

    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];
    setFiltered(newData);
  };

  const handleDownload = () => {
    const doc = new jsPDF();

    const studentName = document.getElementById("name").value || "Provide Name";
    const mark = document.getElementById("rank").value || "Provide Mark";
    const caste = selectedCaste || "Provide Caste";

    doc.setFontSize(14);
    doc.text(`Student Name: ${studentName}`, 14, 20);
    doc.text(`Mark: ${mark}`, 14, 30);
    doc.text(`Caste: ${caste}`, 14, 40);

    const tableColumn = [
      "Inst Code",
      "Institute Name",
      "Branch Code",
      "Branch Name",
      "Dist Code",
      "Dist Name"
    ];

    const tableRows = [];

    filtered.forEach(s => {
      const rowData = [
        s.instCode,
        s.instituteName,
        s.branchCode,
        s.branchName,
        s.distCode,
        s.place
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { halign: "center" },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save("student_portal_data.pdf");
  };

  return (
    <div className="container">
      <h1>Student Portal 👨‍🎓🧑‍🎓</h1>

      <div className="filter-form">
        <div className="filter-box filter-left">
          <h2>Enter Student Info</h2>
          <input type="text" id="name" placeholder="Student Name" />
          <input type="number" id="rank" placeholder="Rank" />
          <select id="studentCaste">
            <option value="">-- Select Caste --</option>
            {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-box filter-middle">
          <div className="button-group">
            <button id="searchBtn" onClick={handleSearch}>🔍 Search</button>
            <button id="resetBtn" onClick={handleReset}>♻ Reset</button>
            <button id="sortBtn" onClick={handleSortByRank}>↕ Sort by Rank</button>
            <button id="downloadBtn" onClick={handleDownload}>📥 Download PDF</button>
          </div>
        </div>

        <div className="filter-box filter-right">
          <h2>Filters</h2>
          <select id="branch">
            <option value="">-- Select Branch --</option>
            {branchCodes.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select id="district">
            <option value="">-- Select District --</option>
            {districtCodes.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select id="filterCaste">
            <option value="">-- Filter by Caste --</option>
            {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="number" id="minRank" placeholder="Min Rank" />
          <input type="number" id="maxRank" placeholder="Max Rank" />
        </div>
      </div>

      <table id="studentTable">
        <thead>
          <tr>
            <th>Move</th>
            <th>Inst Code</th>
            <th>Institute Name</th>
            <th>Place</th>
            <th>Dist Code</th>
            <th>Branch Code</th>
            <th>Branch Name</th>
            {selectedCaste === "" && (
              <>
                {casteOptions.map(c => <th key={c}>{c}</th>)}
              </>
            )}
            {selectedCaste !== "" && <th>{selectedCaste}</th>}
            <th>Tuition Fee</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, idx) => (
            <tr key={idx}>
              <td>
                <button onClick={() => moveRow(idx, "up")}>⬆</button>
                <button onClick={() => moveRow(idx, "down")}>⬇</button>
              </td>
              <td>{s.instCode}</td>
              <td>{s.instituteName}</td>
              <td>{s.place}</td>
              <td>{s.distCode}</td>
              <td>{s.branchCode}</td>
              <td>{s.branchName}</td>
              {selectedCaste === "" && (
                <>
                  {casteOptions.map(c => <td key={c}>{s[casteMap[c]]}</td>)}
                </>
              )}
              {selectedCaste !== "" && <td>{s[casteMap[selectedCaste]]}</td>}
              <td>{s.tuitionFee}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .container { padding: 30px; }
        h1 { text-align: center; margin-bottom: 40px; }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #d18f8f;
        }
        th, td {
          border: 1px solid #d18f8f;
          padding: 8px;
          text-align: center;
        }
        th { background-color: #f7eaea; }
        tbody tr:nth-child(even) { background-color: #fdf0f0; }
        button { margin: 0 2px; cursor: pointer; }
      `}</style>
    </div>
  );
}
