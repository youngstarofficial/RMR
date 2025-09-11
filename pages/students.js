import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCaste, setSelectedCaste] = useState("");
  const [studentCaste, setStudentCaste] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [collegeType, setCollegeType] = useState("All");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  const districtCodes = ["HNK","HYD","JTL","KGM","KHM","KMR","KRM","MBN","MDL","MED","MHB","NLG","NZB","PDL","RR","SDP","SRC","SRD","SRP","WGL","WNP","YBG"];
  const branchCodes = ["AGR","AI","AID","AIM","ANE","AUT","BIO","BME","CHE","CIC","CIV","CME","CS","CSA","CSB","CSC","CSD","CSE","CSG","CSI","CSM","CSN","CSO","CSW","DRG","DTD","ECE","ECI","ECM","EEE","EIE","ETM","FDT","GEO","INF","MCT","MEC","MET","MIN","MMS","MMT","MTE","PHD","PHE","PHM","TEX"];
  const casteOptions = ["OC Boys","OC Girls","BC-A Boys","BC-A Girls","BC-B Boys","BC-B Girls","BC-C Boys","BC-C Girls","BC-D Boys","BC-D Girls","BC-E Boys","BC-E Girls","SC Boys","SC Girls","ST Boys","ST Girls","EWS GEN OU","EWS GIRLS OU"];
  const casteMap = {
    "OC Boys":"ocBoys","OC Girls":"ocGirls","BC-A Boys":"bcABoys","BC-A Girls":"bcAGirls",
    "BC-B Boys":"bcBBoys","BC-B Girls":"bcBGirls","BC-C Boys":"bcCBoys","BC-C Girls":"bcCGirls",
    "BC-D Boys":"bcDBoys","BC-D Girls":"bcDGirls","BC-E Boys":"bcEBoys","BC-E Girls":"bcEGirls",
    "SC Boys":"scBoys","SC Girls":"scGirls","ST Boys":"stBoys","ST Girls":"stGirls",
    "EWS GEN OU":"ewsGenOu","EWS GIRLS OU":"ewsGirlsOu"
  };

  const parseRank = (value) => {
    if (value === undefined || value === null) return Infinity;
    const s = String(value).trim();
    if (s === "") return Infinity;
    const digits = s.replace(/\D/g, "");
    if (digits === "") return Infinity;
    return parseInt(digits, 10);
  };

  const isGirlsCollege = (student) => {
    return Object.keys(casteMap)
      .filter(c => c.endsWith("Boys"))
      .every(key => !student[casteMap[key]]);
  };

  const sortByInstituteAndRank = (data, casteKey = null) => {
    if (!casteKey) return [...data].sort((a, b) => (a.instituteName || "").localeCompare(b.instituteName || ""));
    
    const groups = {};
    data.forEach(item => {
      const inst = item.instituteName || "";
      if (!groups[inst]) groups[inst] = [];
      groups[inst].push(item);
    });

    Object.keys(groups).forEach(inst => {
      groups[inst].sort((a, b) => {
        const rankA = parseRank(a[casteKey]);
        const rankB = parseRank(b[casteKey]);
        if (rankA !== rankB) return rankA - rankB;
        return (a.branchName || "").localeCompare(b.branchName || "");
      });
    });

    const institutes = Object.keys(groups).sort((a, b) => {
      const bestA = Math.min(...groups[a].map(s => parseRank(s[casteKey])));
      const bestB = Math.min(...groups[b].map(s => parseRank(s[casteKey])));
      if (bestA !== bestB) return bestA - bestB;
      return a.localeCompare(b);
    });

    return institutes.flatMap(inst => groups[inst]);
  };

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(sortByInstituteAndRank(data, null));
          setFiltered(sortByInstituteAndRank(data, null));
        } else {
          setStudents([]);
          setFiltered([]);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setStudents([]);
        setFiltered([]);
      });
  }, []);

  const toggleSelection = (value, selectedArray, setSelectedArray) => {
    if (selectedArray.includes(value)) setSelectedArray(selectedArray.filter(v => v !== value));
    else setSelectedArray([...selectedArray, value]);
  };

  const getActiveCaste = () => selectedCaste || studentCaste || "";

  const handleSearch = () => {
    const name = document.getElementById("name").value.toLowerCase();
    const rank = document.getElementById("rank").value;
    const caste = getActiveCaste();
    const minRank = document.getElementById("minRank").value;
    const maxRank = document.getElementById("maxRank").value;

    const result = students.filter(s => {
      const matchesName = name ? (s.instituteName || "").toLowerCase().includes(name) : true;
      const matchesBranch = selectedBranches.length ? selectedBranches.includes(s.branchCode) : true;
      const matchesDistrict = selectedDistricts.length ? selectedDistricts.includes(s.distCode) : true;

      let matchesCollegeType = true;
      if (collegeType === "Women") matchesCollegeType = isGirlsCollege(s);

      const boysCaste = ["OC Boys","BC-A Boys","BC-B Boys","BC-C Boys","BC-D Boys","BC-E Boys","SC Boys","ST Boys","EWS GEN OU"];
      if (boysCaste.includes(caste) && isGirlsCollege(s)) return false;

      let matchesCaste = true;
      if (caste) {
        const key = casteMap[caste];
        matchesCaste = s[key] !== undefined && s[key] !== null && String(s[key]).trim() !== "";
      }

      let matchesRank = true;
      if (caste && s[casteMap[caste]] !== undefined && s[casteMap[caste]] !== "") {
        const rankValue = parseRank(s[casteMap[caste]]);
        if (rank && rankValue !== parseRank(rank)) matchesRank = false;
        if (minRank && rankValue < parseRank(minRank)) matchesRank = false;
        if (maxRank && rankValue > parseRank(maxRank)) matchesRank = false;
      }

      return matchesName && matchesBranch && matchesDistrict && matchesCaste && matchesRank && matchesCollegeType;
    });

    const casteKey = caste ? casteMap[caste] : null;
    setFiltered(sortByInstituteAndRank(result, casteKey));
  };

  const handleReset = () => {
    document.getElementById("name").value = "";
    document.getElementById("rank").value = "";
    setSelectedCaste("");
    setStudentCaste("");
    setCollegeType("All");
    document.getElementById("minRank").value = "";
    document.getElementById("maxRank").value = "";
    setSelectedBranches([]);
    setSelectedDistricts([]);
    setFiltered(sortByInstituteAndRank(students, null));
  };

  const handleSortByRank = () => {
    const caste = getActiveCaste();
    if (!caste) {
      alert("Please select a caste before sorting by rank.");
      return;
    }
    const casteKey = casteMap[caste];
    setFiltered(sortByInstituteAndRank(filtered, casteKey));
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
    const studentName = document.getElementById("name").value || "Provide_Name";
    const mark = document.getElementById("rank").value || "Provide_Rank";
    const caste = getActiveCaste() || "Provide_Caste";

    const bgColor = [228, 228, 255];
    const x = 14, y = 20, width = 182, height = 8;

    doc.setFillColor(...bgColor);
    doc.rect(x, y, width, height, "F");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);

    const colWidths = [60, 50, 72];
    const colX = [x, x + colWidths[0], x + colWidths[0] + colWidths[1]];

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Name:", colX[0] + 2, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(studentName, colX[0] + 18, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Rank:", colX[1] + 2, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(mark, colX[1] + 16, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Caste:", colX[2] + 2, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(caste, colX[2] + 18, y + 6);

    const tableColumn = ["Sl. No", "Inst Code", "Institute Name", "Branch Code", "Branch Name", "Dist Code", "Place"];
    const tableRows = filtered.map((s, idx) => [
      idx + 1,
      s.instCode || "",
      s.instituteName || "",
      s.branchCode || "",
      s.branchName || "",
      s.distCode || "",
      s.place || ""
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y + height + 4,
      styles: { halign: "center", fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.3 },
      headStyles: { fillColor: [173, 216, 230], textColor: 0, fontStyle: "bold" },
      bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.3,
      didParseCell: (data) => {
        if (data.section === "body") {
          const row = filtered[data.row.index];
          if (isGirlsCollege(row)) {
            data.cell.styles.fillColor = [255, 228, 225];
          }
        }
      },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
    }

    doc.save(`${studentName.replace(/\s+/g, "_")}_${mark}_${caste.replace(/\s+/g, "_")}.pdf`);
  };

  const displayCaste = selectedCaste || studentCaste || "";

  return (
    <div className="container">
      <h1>Student Portal 👨‍🎓🧑‍🎓</h1>

      <div className="filter-form">
        <div className="filter-box student-info-box">
          <h2>Enter Student Info</h2>
          <div className="student-info">
            <input type="text" id="name" placeholder="Student Name" />
            <input type="number" id="rank" placeholder="Rank" />
            <select value={studentCaste} onChange={e => setStudentCaste(e.target.value)}>
              <option value="">-- Select Caste --</option>
              {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="filter-box button-box">
          <button onClick={handleSearch}>🔍 Search</button>
          <button onClick={handleReset}>♻ Reset</button>
          <button onClick={handleSortByRank}>↕ Sort by Rank</button>
          <button onClick={handleDownload}>📥 Download PDF</button>
        </div>

        <div className="filter-box filters-box">
          <h2>Filters</h2>
          <div className="filters-side-by-side">
            <select value={collegeType} onChange={e => setCollegeType(e.target.value)}>
              <option value="All">All Colleges</option>
              <option value="Women">Women Colleges</option>
            </select>

            <select value={selectedCaste} onChange={e => setSelectedCaste(e.target.value)}>
              <option value="">-- Select Caste --</option>
              {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="dropdown">
              <button type="button" onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}>Select Branch Codes ▼</button>
              {branchDropdownOpen && (
                <div className="dropdown-content scrollable">
                  {branchCodes.map(b => (
                    <label key={b}>
                      <input type="checkbox" checked={selectedBranches.includes(b)} onChange={() => toggleSelection(b, selectedBranches, setSelectedBranches)} /> {b}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown">
              <button type="button" onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}>Select District Codes ▼</button>
              {districtDropdownOpen && (
                <div className="dropdown-content scrollable">
                  {districtCodes.map(d => (
                    <label key={d}>
                      <input type="checkbox" checked={selectedDistricts.includes(d)} onChange={() => toggleSelection(d, selectedDistricts, setSelectedDistricts)} /> {d}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <input type="number" id="minRank" placeholder="Min Rank" />
            <input type="number" id="maxRank" placeholder="Max Rank" />
          </div>
        </div>
      </div>

      <table id="studentTable">
        <thead>
          <tr>
            <th>Sl. No</th>
            <th>Remove</th>
            <th>Move</th>
            <th>Inst Code</th>
            <th>Institute Name</th>
            <th>Place</th>
            <th>Dist Code</th>
            <th>Branch Code</th>
            <th>Branch Name</th>
            {displayCaste === "" && casteOptions.map(c => <th key={c}>{c}</th>)}
            {displayCaste !== "" && <th>{displayCaste}</th>}
            <th>Tuition Fee</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s, idx) => {
            const isWomenCollege = (s.instituteName || "").toLowerCase().includes("women") || isGirlsCollege(s);
            return (
              <tr key={idx} style={{ backgroundColor: isWomenCollege ? "#ffe4e1" : "#e6e6fa" }}>
                <td>{idx + 1}</td>
                <td>
                  <button onClick={() => {
                    const newData = [...filtered];
                    newData.splice(idx, 1);
                    setFiltered(newData);
                  }}>❌</button>
                </td>
                {/* Move buttons */}
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
                {displayCaste === "" && casteOptions.map(c => <td key={c}>{s[casteMap[c]]}</td>)}
                {displayCaste !== "" && <td>{s[casteMap[displayCaste]]}</td>}
                <td>{s.tuitionFee}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx>{`
        .container { padding: 20px; background-color: #add8e6; }
        h1 { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; border: 2px solid #d18f8f; }
        th, td { border: 1px solid #d18f8f; padding: 6px; text-align: center; font-size: 13px; }
        th { background-color: #f7eaea; }
        tbody tr:nth-child(even) { background-color: #fdf0f0; }
        .filter-form { display: flex; flex-direction: column; gap: 15px; max-width: 1000px; }
        .student-info, .filters-side-by-side, .button-box { display: flex; flex-direction: row; gap: 8px; }
        .button-box button { font-size: 13px; padding: 4px 8px; min-width: 150px; }
        input, select { font-size: 13px; padding: 4px; }
        .dropdown { position: relative; }
        .dropdown button { text-align: left; font-size: 13px; }
        .dropdown-content { position: absolute; background-color: #f9f9f9; border: 1px solid #ddd; padding: 5px; z-index: 1; max-height: 150px; overflow-y: auto; min-width: 180px; font-size: 13px; }
        .dropdown-content label { display: block; margin-bottom: 3px; }
      `}</style>
    </div>
  );
}
