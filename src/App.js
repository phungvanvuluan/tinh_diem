import { useState } from "react";

function App() {
  // --- state chính ---
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [scores, setScores] = useState({});     // tổng điểm
  const [logs, setLogs] = useState([]);         // lịch sử các ván: [{A: +2, B: -2, ...}, ...]
  const [currentRound, setCurrentRound] = useState({}); // điểm đang nhập của ván hiện tại

  // đổi tên / xóa
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  // form chặt heo
  const [heoVictim, setHeoVictim] = useState("");  // người bị chặt
  const [heoChopper, setHeoChopper] = useState(""); // người chặt
  const [heoColor, setHeoColor] = useState("den");  // 'den' | 'do'

  const pointMap = {
    nhat: 4,
    nhi: 2,
    ba: -2,
    chot: -4,
  };

  // --- helper ---
  const colorize = (n) => ({
    color: n > 0 ? "green" : n < 0 ? "red" : undefined,
    fontWeight: 600,
  });

  // --- người chơi ---
  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || players.includes(name)) return;

    setPlayers((ps) => [...ps, name]);
    setScores((s) => ({ ...s, [name]: 0 }));
    setCurrentRound((cr) => ({ ...cr, [name]: 0 }));
    setNewPlayer("");
  };

  const deletePlayer = (name) => {
    setPlayers((ps) => ps.filter((p) => p !== name));
    setScores(({ [name]: _omit, ...rest }) => rest);
    setCurrentRound(({ [name]: _omit2, ...rest2 }) => rest2);
    setLogs((L) =>
      L.map((round) => {
        const { [name]: _omit3, ...rest3 } = round;
        return rest3;
      })
    );
    // nếu đang dùng ở form chặt heo thì dọn
    if (heoVictim === name) setHeoVictim("");
    if (heoChopper === name) setHeoChopper("");
  };

  const startEdit = (name) => {
    setEditing(name);
    setEditName(name);
  };

  const saveEdit = (oldName) => {
    const nn = editName.trim();
    if (!nn || players.includes(nn)) {
      setEditing(null);
      return;
    }

    setPlayers((ps) => ps.map((p) => (p === oldName ? nn : p)));

    // chuyển điểm tổng
    setScores((s) => {
      const { [oldName]: old, ...rest } = s;
      return { ...rest, [nn]: old ?? 0 };
    });

    // chuyển điểm ván hiện tại
    setCurrentRound((cr) => {
      const { [oldName]: old, ...rest } = cr;
      return { ...rest, [nn]: old ?? 0 };
    });

    // chuyển trong log
    setLogs((L) =>
      L.map((round) => {
        const { [oldName]: old, ...rest } = round;
        return { ...rest, [nn]: old ?? 0 };
      })
    );

    // cập nhật nếu đang chọn trong form chặt heo
    if (heoVictim === oldName) setHeoVictim(nn);
    if (heoChopper === oldName) setHeoChopper(nn);

    setEditing(null);
  };

  // --- nhập điểm thường cho ván hiện tại ---
  const addScore = (player, type, custom = 0) => {
    const delta = custom || pointMap[type] || 0;
    setCurrentRound((cr) => ({ ...cr, [player]: (cr[player] || 0) + delta }));
  };

  // --- ghi sự kiện chặt heo (rõ ràng vai trò) ---
  const recordHeo = () => {
    if (!heoVictim || !heoChopper || heoVictim === heoChopper) return;
    const abs = heoColor === "den" ? 2 : 4; // đen=2, đỏ=4
    setCurrentRound((cr) => ({
      ...cr,
      [heoVictim]: (cr[heoVictim] || 0) - abs,
      [heoChopper]: (cr[heoChopper] || 0) + abs,
    }));
    // reset chọn cho lần sau (tuỳ thích)
    setHeoVictim("");
    setHeoChopper("");
    setHeoColor("den");
  };

  // --- hết ván: cộng vào tổng + lưu lịch sử ---
  const endRound = () => {
    if (players.length === 0) return;

    // cộng vào tổng
    const nextScores = { ...scores };
    const roundSnapshot = {};
    players.forEach((p) => {
      const change = currentRound[p] || 0;
      nextScores[p] = (nextScores[p] || 0) + change;
      roundSnapshot[p] = change;
    });

    setScores(nextScores);
    setLogs((L) => [...L, roundSnapshot]);

    // reset ván hiện tại
    const reset = {};
    players.forEach((p) => (reset[p] = 0));
    setCurrentRound(reset);
  };

  const maxRounds = logs.length;

  return (
    <div style={{ textAlign: "center", padding: 20, background: "#eef2f6", minHeight: "100vh" }}>
      <h1 style={{ marginTop: 10 }}>Tính Điểm Tiến Lên Miền Nam 🃏</h1>

      {/* Thêm người chơi */}
      <div style={{ margin: "10px 0 20px" }}>
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Nhập tên người chơi"
          style={{ padding: 6, width: 220 }}
        />
        <button onClick={addPlayer} style={{ marginLeft: 8, padding: "6px 12px" }}>
          Thêm
        </button>
      </div>

      {/* Khối ghi sự kiện chặt heo (rõ vai trò) */}
      {players.length >= 2 && (
        <div
          style={{
            margin: "0 auto 16px",
            background: "white",
            border: "1px solid #ddd",
            padding: 10,
            width: 900,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <strong>Chặt heo:</strong>
          <label>Người bị chặt</label>
          <select value={heoVictim} onChange={(e) => setHeoVictim(e.target.value)}>
            <option value="">-- chọn --</option>
            {players.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label>Người chặt</label>
          <select value={heoChopper} onChange={(e) => setHeoChopper(e.target.value)}>
            <option value="">-- chọn --</option>
            {players.map((p) => (
              <option key={p} value={p} disabled={p === heoVictim}>
                {p}
              </option>
            ))}
          </select>

          <label>Loại heo</label>
          <select value={heoColor} onChange={(e) => setHeoColor(e.target.value)}>
            <option value="den">Đen (-/+2)</option>
            <option value="do">Đỏ (-/+4)</option>
          </select>

          <button onClick={recordHeo} style={{ padding: "6px 12px" }}>
            Ghi điểm
          </button>
        </div>
      )}

      {/* Bảng chính */}
      {players.length > 0 && (
        <>
          <table
            border="1"
            cellPadding="8"
            style={{
              margin: "0 auto",
              borderCollapse: "collapse",
              minWidth: 900,
              background: "white",
            }}
          >
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th>Người chơi</th>
                {Array.from({ length: maxRounds }, (_, i) => (
                  <th key={i}>Ván {i + 1}</th>
                ))}
                <th>Điểm ván hiện tại</th>
                <th>Tổng điểm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p}>
                  {/* tên + sửa + xóa */}
                  <td>
                    {editing === p ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: 110 }}
                        />
                        <button onClick={() => saveEdit(p)}>💾</button>
                        <button onClick={() => setEditing(null)}>❌</button>
                      </>
                    ) : (
                      <>
                        {p}{" "}
                        <button onClick={() => startEdit(p)}>✏️</button>
                        <button onClick={() => deletePlayer(p)}>🗑️</button>
                      </>
                    )}
                  </td>

                  {/* lịch sử ván đã chốt */}
                  {Array.from({ length: maxRounds }, (_, i) => {
                    const v = logs[i]?.[p] ?? 0;
                    return (
                      <td key={i} style={colorize(v)}>
                        {v ? (v > 0 ? `+${v}` : v) : ""}
                      </td>
                    );
                  })}

                  {/* ván hiện tại */}
                  <td style={colorize(currentRound[p] || 0)}>
                    {currentRound[p] ? (currentRound[p] > 0 ? `+${currentRound[p]}` : currentRound[p]) : ""}
                  </td>

                  {/* tổng điểm */}
                  <td style={colorize(scores[p] || 0)}>{scores[p] || 0}</td>

                  {/* hành động thường */}
                  <td>
                    <button onClick={() => addScore(p, "nhat")}>Nhất</button>
                    <button onClick={() => addScore(p, "nhi")}>Nhì</button>
                    <button onClick={() => addScore(p, "ba")}>Ba</button>
                    <button onClick={() => addScore(p, "chot")}>Chót</button>
                    <input
                      type="number"
                      placeholder="+/-"
                      style={{ width: 65, marginLeft: 6 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = Number(e.currentTarget.value);
                          if (!Number.isNaN(v)) addScore(p, "custom", v);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18 }}>
            <button onClick={endRound} style={{ padding: "10px 20px" }}>
              ✅ Hết ván
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
