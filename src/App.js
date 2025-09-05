import { useState } from "react";

function App() {
  const [scores, setScores] = useState({ toan: "", ly: "", hoa: "" });
  const [average, setAverage] = useState(null);

  const handleChange = (e) => {
    setScores({ ...scores, [e.target.name]: e.target.value });
  };

  const tinhDiem = () => {
    const { toan, ly, hoa } = scores;
    if (toan && ly && hoa) {
      const avg = (Number(toan) + Number(ly) + Number(hoa)) / 3;
      setAverage(avg.toFixed(2));
    } else {
      setAverage("Vui lòng nhập đủ điểm!");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Ứng dụng Tính Điểm Trung Bình 🎓</h1>
      <input
        type="number"
        name="toan"
        placeholder="Điểm Toán"
        value={scores.toan}
        onChange={handleChange}
        style={{ margin: "5px" }}
      />
      <input
        type="number"
        name="ly"
        placeholder="Điểm Lý"
        value={scores.ly}
        onChange={handleChange}
        style={{ margin: "5px" }}
      />
      <input
        type="number"
        name="hoa"
        placeholder="Điểm Hóa"
        value={scores.hoa}
        onChange={handleChange}
        style={{ margin: "5px" }}
      />
      <br />
      <button onClick={tinhDiem} style={{ marginTop: "10px" }}>
        Tính điểm
      </button>

      {average !== null && (
        <h2 style={{ marginTop: "20px" }}>Điểm trung bình: {average}</h2>
      )}
    </div>
  );
}

export default App;
