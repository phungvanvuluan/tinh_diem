import { useState } from "react";

function App() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [scores, setScores] = useState({});
  const [logs, setLogs] = useState([]);
  const [currentRound, setCurrentRound] = useState({});
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  const pointMap = {
    nhat: 4,
    nhi: 2,
    ba: -2,
    chot: -4,
  };

  // Thêm người chơi
  const addPlayer = () => {
    if (!newPlayer.trim() || players.includes(newPlayer)) return;
    setPlayers([...players, newPlayer]);
    setScores({ ...scores, [newPlayer]: 0 });
    setNewPlayer("");
  };

  // Cập nhật điểm trong ván hiện tại
  const addScore = (player, type, custom = 0, target = null) => {
    let updates = { ...currentRound };

    if (type === "heo_den") {
      updates[player] = (updates[player] || 0) - 2;
      if (target) updates[target] = (updates[target] || 0) + 2;
    } else if (type === "heo_do") {
      updates[player] = (updates[player] || 0) - 4;
      if (target) updates[target] = (updates[target] || 0) + 4;
    } else {
      let value = custom || pointMap[type] || 0;
      updates[player] = (updates[player] || 0) + value;
    }

    setCurrentRound(updates);
  };

  // Kết thúc ván -> cộng vào tổng + lưu lịch sử
  const endRound = () => {
    let newScores = { ...scores };
    let roundLog = {};

    players.forEach((p) => {
      let change = currentRound[p] || 0;
      newScores[p] += change;
      roundLog[p] = change;
    });

    setScores(newScores);
    setLogs([...logs, roundLog]);
    setCurrentRound({});
  };

  // Xóa người chơi
  const deletePlayer = (player) => {
    setPlayers(players.filter((p) => p !== player));
    const { [player]: _, ...restScores } = scores;
    setScores(restScores);
  };

  // Đổi tên
  const startEdit = (player) => {
    setEditing(player);
    setEditName(player);
  };

  const saveEdit = (oldName) => {
    if (!editName.trim() || players.includes(editName)) {
      setEditing(null);
      return;
    }

    const newPlayers = players.map((p) => (p === oldName ? editName : p));
    setPlayers(newPlayers);

    let newScores = { ...scores };
    newScores[editName] = newScores[oldName];
    delete newScores[oldName];
    setScores(newScores);

    setLogs(
      logs.map((round) => {
        let updated = { ...round };
        updated[editName] = updated[oldName] || 0;
        delete updated[oldName];
        return updated;
      })
    );

    let newCurrent = { ...currentRound };
    newCurrent[editName] = newCurrent[oldName] || 0;
    delete newCurrent[oldName];
    setCurrentRound(newCurrent);

    setEditing(null);
  };

  // Tính số ván nhiều nhất để hiện lịch sử
  const maxRounds = logs.length;

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Tính Điểm Tiến Lên Miền Nam 🃏</h1>

      {/* Thêm người chơi */}
      <div style={{ marginBottom: "20px" }}>
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Nhập tên người chơi"
        />
        <button onClick={addPlayer}>Thêm</button>
      </div>

      {players.length > 0 && (
        <>
          <table
            border="1"
            cellPadding="8"
            style={{
              margin: "0 auto",
              borderCollapse: "collapse",
              minWidth: "900px",
            }}
          >
            <thead style={{ backgroundColor: "#f0f0f0" }}>
              <tr>
                <th>Người chơi</th>
                {[...Array(maxRounds)].map((_, i) => (
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
                  {/* Tên người chơi */}
                  <td>
                    {editing === p ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: "100px" }}
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

                  {/* Lịch sử các ván */}
                  {[...Array(maxRounds)].map((_, i) => (
                    <td
                      key={i}
                      style={{
                        color:
                          logs[i][p] > 0
                            ? "green"
                            : logs[i][p] < 0
                            ? "red"
                            : "",
                      }}
                    >
                      {logs[i][p] > 0 ? `+${logs[i][p]}` : logs[i][p] || ""}
                    </td>
                  ))}

                  {/* Điểm ván hiện tại */}
                  <td
                    style={{
                      color:
                        (currentRound[p] || 0) > 0
                          ? "green"
                          : (currentRound[p] || 0) < 0
                          ? "red"
                          : "",
                    }}
                  >
                    {currentRound[p] > 0
                      ? `+${currentRound[p]}`
                      : currentRound[p] || ""}
                  </td>

                  {/* Tổng điểm */}
                  <td style={{ color: scores[p] >= 0 ? "green" : "red" }}>
                    {scores[p]}
                  </td>

                  {/* Các nút cộng điểm */}
                  <td>
                    <button onClick={() => addScore(p, "nhat")}>Nhất</button>
                    <button onClick={() => addScore(p, "nhi")}>Nhì</button>
                    <button onClick={() => addScore(p, "ba")}>Ba</button>
                    <button onClick={() => addScore(p, "chot")}>Chót</button>

                    {/* Chặt Heo Đen */}
                    <select
                      onChange={(e) => {
                        const target = e.target.value;
                        if (target) {
                          addScore(p, "heo_den", 0, target);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Chặt Heo Đen</option>
                      {players
                        .filter((x) => x !== p)
                        .map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                    </select>

                    {/* Chặt Heo Đỏ */}
                    <select
                      onChange={(e) => {
                        const target = e.target.value;
                        if (target) {
                          addScore(p, "heo_do", 0, target);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Chặt Heo Đỏ</option>
                      {players
                        .filter((x) => x !== p)
                        .map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                    </select>

                    <input
                      type="number"
                      placeholder="+/-"
                      style={{ width: "60px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addScore(p, "custom", Number(e.target.value));
                          e.target.value = "";
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "20px" }}>
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
