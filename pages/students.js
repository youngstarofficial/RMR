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
  const casteMap = { "OC Boys":"ocBoys","OC Girls":"ocGirls","BC-A Boys":"bcABoys","BC-A Girls":"bcAGirls","BC-B Boys":"bcBBoys","BC-B Girls":"bcBGirls","BC-C Boys":"bcCBoys","BC-C Girls":"bcCGirls","BC-D Boys":"bcDBoys","BC-D Girls":"bcDGirls","BC-E Boys":"bcEBoys","BC-E Girls":"bcEGirls","SC Boys":"scBoys","SC Girls":"scGirls","ST Boys":"stBoys","ST Girls":"stGirls","EWS GEN OU":"ewsGenOu","EWS GIRLS OU":"ewsGirlsOu"};

  const sortByInstAndBranch = (data) => [...data].sort((a,b) => {
    const codeCompare = a.instCode.localeCompare(b.instCode);
    if(codeCompare !== 0) return codeCompare;
    return a.branchName.localeCompare(b.branchName);
  });

  useEffect(() => {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedData = sortByInstAndBranch(data);
          setStudents(sortedData);
          setFiltered(sortedData);
        } else setStudents([]);
      })
      .catch(err => { console.error("Fetch error:", err); setStudents([]); });
  }, []);

  const toggleSelection = (value, selectedArray, setSelectedArray) => {
    if (selectedArray.includes(value)) setSelectedArray(selectedArray.filter(v => v !== value));
    else setSelectedArray([...selectedArray, value]);
  };

  const handleSearch = () => {
    const name = document.getElementById("name").value.toLowerCase();
    const rank = document.getElementById("rank").value;
    const caste = selectedCaste;
    const minRank = document.getElementById("minRank").value;
    const maxRank = document.getElementById("maxRank").value;

    const result = students.filter(s => {
      const matchesName = name ? s.instituteName.toLowerCase().includes(name) : true;
      const matchesBranch = selectedBranches.length ? selectedBranches.includes(s.branchCode) : true;
      const matchesDistrict = selectedDistricts.length ? selectedDistricts.includes(s.distCode) : true;

      // College type filter
      const matchesCollegeType = collegeType === "All" ? true : s.instituteName.toLowerCase().includes("women");

      // If college is Women and caste is a Boys caste, no match
      const isBoysCaste = ["OC Boys","BC-A Boys","BC-B Boys","BC-C Boys","BC-D Boys","BC-E Boys","SC Boys","ST Boys","EWS GEN OU"].includes(caste);
      if (collegeType === "Women" && isBoysCaste) return false;

      let matchesCaste = true;
      if(caste) {
        const key = casteMap[caste];
        matchesCaste = s[key] !== undefined;
      }

      let matchesRank = true;
      if(caste && s[casteMap[caste]] !== undefined) {
        const rankValue = parseInt(s[casteMap[caste]]);
        if(rank && rankValue !== parseInt(rank)) matchesRank = false;
        if(minRank && rankValue < parseInt(minRank)) matchesRank = false;
        if(maxRank && rankValue > parseInt(maxRank)) matchesRank = false;
      }

      return matchesName && matchesBranch && matchesDistrict && matchesCaste && matchesRank && matchesCollegeType;
    });

    setFiltered(sortByInstAndBranch(result));
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
    setFiltered(sortByInstAndBranch(students));
  };

  const handleSortByRank = () => {
    if(!selectedCaste) { alert("Please select a caste before sorting by rank."); return; }
    const casteKey = casteMap[selectedCaste];
    const sorted = [...filtered].sort((a,b) => (parseInt(a[casteKey])||Infinity) - (parseInt(b[casteKey])||Infinity));
    setFiltered(sorted);
  };

  const moveRow = (index, direction) => {
    const newData = [...filtered];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if(targetIndex < 0 || targetIndex >= newData.length) return;
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
    styles: {
      halign: "center",
      textColor: 0,
      lineColor: [0,0,0], // black borders
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [173, 216, 230], // header light blue
      textColor: 0,
      lineColor: [0,0,0],
      lineWidth: 0.5
    },
    didParseCell: function (data) {
      if(data.section === 'body') {
        const row = filtered[data.row.index];
        if(row.instituteName.toLowerCase().includes("women")) {
          data.cell.styles.fillColor = [224, 235, 255]; // very light blue for women's college
        }
        data.cell.styles.lineColor = [0,0,0]; // black borders
        data.cell.styles.lineWidth = 0.5;
      }
    }
  });

  doc.save("student_portal_data.pdf");
};

  return (
    <div className="container">
      <h1>Student Portal 👨‍🎓🧑‍🎓</h1>

      <div className="filter-form">

        {/* Student Info */}
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

        {/* Buttons */}
        <div className="filter-box button-box">
          <button onClick={handleSearch}>🔍 Search</button>
          <button onClick={handleReset}>♻ Reset</button>
          <button onClick={handleSortByRank}>↕ Sort by Rank</button>
          <button onClick={handleDownload}>📥 Download PDF</button>
        </div>

        {/* Filters */}
        <div className="filter-box filters-box">
          <h2>Filters</h2>
          <div className="filters-side-by-side">

            {/* College Type */}
            <select value={collegeType} onChange={e => setCollegeType(e.target.value)}>
              <option value="All">All Colleges</option>
              <option value="Women">Women Colleges</option>
            </select>

            {/* Caste Filter */}
            <select value={selectedCaste} onChange={e => setSelectedCaste(e.target.value)}>
              <option value="">-- Select Caste --</option>
              {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Branch */}
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

            {/* District */}
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

      {/* Table */}
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
            {selectedCaste === "" && casteOptions.map(c => <th key={c}>{c}</th>)}
            {selectedCaste !== "" && <th>{selectedCaste}</th>}
            <th>Tuition Fee</th>
          </tr>
        </thead>
        <tbody>
  {filtered.map((s, idx) => {
    const isWomenCollege = s.instituteName.toLowerCase().includes("women");
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
        {selectedCaste === "" && casteOptions.map(c => <td key={c}>{s[casteMap[c]]}</td>)}
        {selectedCaste !== "" && <td>{s[casteMap[selectedCaste]]}</td>}
        <td>{s.tuitionFee}</td>
      </tr>
    )
  })}
</tbody>

      </table>

      <style jsx>{`
      .container { 
    padding: 20px; 
    background-color: #add8e6; /* Light Blue */
  }
        .container { padding: 20px; }
        h1 { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; border: 2px solid #d18f8f; }
        th, td { border: 1px solid #d18f8f; padding: 6px; text-align: center; font-size: 13px; }
        th { background-color: #f7eaea; }
        tbody tr:nth-child(even) { background-color: #fdf0f0; }

        .filter-form { 
          display: flex; 
          flex-direction: column; 
          gap: 15px; 
          max-width: 1000px;
        }

        .student-info, .filters-side-by-side, .button-box {
          display: flex; 
          flex-direction: row; 
          gap: 8px;
        }

        .button-box button { font-size: 13px; padding: 4px 8px; min-width: 150px; }
        input, select { font-size: 13px; padding: 4px; }

        .dropdown { position: relative; }
        .dropdown button { text-align: left; font-size: 13px; }
        .dropdown-content { 
          position: absolute; 
          background-color: #f9f9f9; 
          border: 1px solid #ddd; 
          padding: 5px; 
          z-index: 1; 
          max-height: 150px; 
          overflow-y: auto; 
          min-width: 180px; 
          font-size: 13px; 
        }
        .dropdown-content label { display: block; margin-bottom: 3px; }
      `}</style>
    </div>
  );
}
