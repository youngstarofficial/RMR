import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCaste, setSelectedCaste] = useState(""); // filter-area caste
  const [studentCaste, setStudentCaste] = useState("");   // student-info caste
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

  // Utility: parse rank string to numeric
  const parseRank = (value) => {
    if (value === undefined || value === null) return Infinity;
    const s = String(value).trim();
    if (s === "") return Infinity;
    const digits = s.replace(/\D/g, "");
    if (digits === "") return Infinity;
    return parseInt(digits, 10);
  };

  // ✅ Colleges sorted by best branch rank, branches inside ordered by rank
  const sortByInstituteAndRank = (data, casteKey = null) => {
    if (!casteKey) {
      return [...data].sort((a, b) =>
        (a.instituteName || "").localeCompare(b.instituteName || "")
      );
    }

    // Group by institute
    const groups = {};
    data.forEach((item) => {
      const inst = item.instituteName || "";
      if (!groups[inst]) groups[inst] = [];
      groups[inst].push(item);
    });

    // Sort branches inside each group by rank
    Object.keys(groups).forEach((inst) => {
      groups[inst].sort((a, b) => {
        const rankA = parseRank(a[casteKey]);
        const rankB = parseRank(b[casteKey]);
        if (rankA !== rankB) return rankA - rankB;
        return (a.branchName || "").localeCompare(b.branchName || "");
      });
    });

    // Sort institutes by their best branch rank
    const institutes = Object.keys(groups).sort((instA, instB) => {
      const bestA = Math.min(...groups[instA].map((s) => parseRank(s[casteKey])));
      const bestB = Math.min(...groups[instB].map((s) => parseRank(s[casteKey])));
      if (bestA !== bestB) return bestA - bestB;
      return instA.localeCompare(instB);
    });

    // Flatten into a single array
    return institutes.flatMap((inst) => groups[inst]);
  };

  const isGirlsCollege = (student) => {
    return Object.keys(casteMap)
      .filter(c => c.endsWith("Boys"))
      .every(key => !student[casteMap[key]]);
  };

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedData = sortByInstituteAndRank(data, null);
          setStudents(sortedData);
          setFiltered(sortedData);
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
      const matchesCollegeType = collegeType === "All" ? true : (s.instituteName || "").toLowerCase().includes("women");

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
    const studentName = document.getElementById("name").value || "Provide Name";
    const mark = document.getElementById("rank").value || "Provide Mark";
    const caste = getActiveCaste() || "Provide Caste";

    doc.setFontSize(14);
    doc.text(`Student Name: ${studentName}`, 14, 20);
    doc.text(`Mark: ${mark}`, 14, 30);
    doc.text(`Caste: ${caste}`, 14, 40);

    const tableColumn = ["S.No","Inst Code","Institute Name","Branch Code","Branch Name","Dist Code","Dist Name"];
    const tableRows = filtered.map((s, idx) => [
      idx + 1,
      s.instCode,
      s.instituteName,
      s.branchCode,
      s.branchName,
      s.distCode,
      s.place
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { halign: "center", textColor: 0, lineColor: [0,0,0], lineWidth: 0.5 },
      headStyles: { fillColor: [173, 216, 230], textColor: 0, lineColor: [0,0,0], lineWidth: 0.5 },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const row = filtered[data.row.index];
          if ((row.instituteName || "").toLowerCase().includes("women")) data.cell.styles.fillColor = [224, 235, 255];
          data.cell.styles.lineColor = [0,0,0];
          data.cell.styles.lineWidth = 0.5;
        }
      }
    });

    doc.save("student_portal_data.pdf");
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
                <td>
                  <button onClick={() => moveRow(idx,"up")}>⬆</button>
                  <button onClick={() => moveRow(idx,"down")}>⬇</button>
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
