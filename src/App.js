import { useState } from "react";
import "./App.css";

function App() {
  // --- state chính ---
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [scores, setScores] = useState({}); // tổng điểm
  const [logs, setLogs] = useState([]); // lịch sử các ván: [{A: +2, B: -2, ...}, ...]
  const [heoLogs, setHeoLogs] = useState([]); // lịch sử chặt heo: [{victim, chopper, color, roundIndex}, ...]
  const [currentRound, setCurrentRound] = useState({}); // điểm đang nhập của ván hiện tại
  const [currentRoundHeos, setCurrentRoundHeos] = useState([]); // heo của ván hiện tại
  const [disabledButtons, setDisabledButtons] = useState({}); // Trạng thái disable của các nút theo người chơi
  const [openMenuPlayer, setOpenMenuPlayer] = useState(null); // ẩn và hiện nút chỉnh sửa / xóa người chơi

  // Hệ thống streak và achievement
  const [playerStreaks, setPlayerStreaks] = useState({}); // {playerName: {current: 5, type: 'win'/'lose', history: [...]}}

  // đổi tên / xóa
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  // form chặt heo
  const [heoVictim, setHeoVictim] = useState(""); // người bị chặt
  const [heoChopper, setHeoChopper] = useState(""); // người chặt
  const [heoColor, setHeoColor] = useState("den"); // 'den' | 'do'

  // xem lịch sử
  const [showHistory, setShowHistory] = useState(false);

  // bóp cổ - UPDATED: count thay vì boolean
  const [showBopCo, setShowBopCo] = useState(false);
  const [bopCoWinner, setBopCoWinner] = useState("");
  const [bopCoPlayerHeos, setBopCoPlayerHeos] = useState({}); // {playerName: {den: 0|1|2, do: 0|1|2}}

  const pointMap = {
    nhat: 4,
    nhi: 2,
    ba: -2,
    chot: -4,
    toiTrang: -4, // Tới trắng, 3 người còn lại mỗi người bị trừ 4 điểm
  };

  // --- helper ---
  const colorize = (n) => ({
    color: n > 0 ? "#10b981" : n < 0 ? "#ef4444" : "#6b7280",
    fontWeight: 600,
  });

  // Hàm tính streak và achievement
  const getStreakTitle = (streak, type) => {
    if (type === "win") {
      if (streak >= 10) return "🔥👑 Thần Chiến Thắng";
      if (streak >= 8) return "🔥🔥🔥 Bất Bại";
      if (streak >= 5) return "🔥🔥 Streak Master";
      if (streak >= 3) return "🔥 Hot Hand";
    } else if (type === "lose") {
      if (streak >= 8) return "☠️ Vua Lót Đường";
      if (streak >= 5) return "💀 Cảm Giác Quen Quen";
      if (streak >= 3) return "❄️ Đen Như Chó Mực";
    }
    return "";
  };

  const getStreakClass = (streak, type) => {
    if (type === "win") {
      if (streak >= 10) return "streak-godlike";
      if (streak >= 8) return "streak-unstoppable";
      if (streak >= 5) return "streak-dominating";
      if (streak >= 3) return "streak-hot";
    } else if (type === "lose") {
      if (streak >= 8) return "streak-cursed";
      if (streak >= 5) return "streak-cold";
      if (streak >= 3) return "streak-unlucky";
    }
    return "";
  };

  const updateStreaks = (roundScores) => {
    const newStreaks = { ...playerStreaks };

    players.forEach((player) => {
      if (!newStreaks[player]) {
        newStreaks[player] = { current: 0, type: null, history: [] };
      }

      const playerScore = roundScores[player] || 0;

      // Xác định loại streak dựa trên điểm (+/-)
      if (playerScore > 0) {
        // Điểm dương - Win streak
        if (newStreaks[player].type === "win") {
          newStreaks[player].current += 1;
        } else {
          newStreaks[player].current = 1;
          newStreaks[player].type = "win";
        }
      } else if (playerScore < 0) {
        // Điểm âm - Lose streak
        if (newStreaks[player].type === "lose") {
          newStreaks[player].current += 1;
        } else {
          newStreaks[player].current = 1;
          newStreaks[player].type = "lose";
        }
      } else {
        // Điểm 0 - Reset streak
        newStreaks[player].current = 0;
        newStreaks[player].type = null;
      }

      newStreaks[player].history.push({
        round: logs.length + 1,
        score: playerScore,
        streak: newStreaks[player].current,
        type: newStreaks[player].type,
      });
    });

    setPlayerStreaks(newStreaks);
  };

  // --- người chơi ---
  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || players.includes(name)) return;

    setPlayers((ps) => [...ps, name]);
    setScores((s) => ({ ...s, [name]: 0 }));
    setCurrentRound((cr) => ({ ...cr, [name]: 0 }));
    setDisabledButtons((db) => ({ ...db, [name]: false }));
    setPlayerStreaks((ps) => ({
      ...ps,
      [name]: { current: 0, type: null, history: [] },
    }));
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
      }),
    );
    setDisabledButtons(({ [name]: _omit4, ...rest4 }) => rest4);
    setPlayerStreaks(({ [name]: _omit5, ...rest5 }) => rest5);
    // xóa khỏi lịch sử heo
    setHeoLogs((logs) =>
      logs.filter((h) => h.victim !== name && h.chopper !== name),
    );
    // nếu đang dùng ở form chặt heo thì dọn
    if (heoVictim === name) setHeoVictim("");
    if (heoChopper === name) setHeoChopper("");
    if (bopCoWinner === name) setBopCoWinner("");
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
      }),
    );

    // chuyển trong lịch sử heo
    setHeoLogs((logs) =>
      logs.map((h) => ({
        ...h,
        victim: h.victim === oldName ? nn : h.victim,
        chopper: h.chopper === oldName ? nn : h.chopper,
      })),
    );

    // cập nhật disabled state
    setDisabledButtons((db) => {
      const { [oldName]: old, ...rest } = db;
      return { ...rest, [nn]: old ?? false };
    });

    // cập nhật nếu đang chọn trong form chặt heo
    if (heoVictim === oldName) setHeoVictim(nn);
    if (heoChopper === oldName) setHeoChopper(nn);
    if (bopCoWinner === oldName) setBopCoWinner(nn);

    setEditing(null);
  };

  // --- nhập điểm thường cho ván hiện tại ---
  const addScore = (player, type, custom = 0) => {
    if (disabledButtons[player]) return;

    const delta = custom || pointMap[type] || 0;
    const nextCurrentRound = { ...currentRound };
    const nextDisabledButtons = { ...disabledButtons };

    if (type === "toiTrang") {
      // Người tới trắng được +12, 3 người còn lại mỗi người -4
      players.forEach((p) => {
        if (p !== player) {
          nextCurrentRound[p] = (nextCurrentRound[p] || 0) + pointMap[type];
          nextDisabledButtons[p] = true;
        } else {
          nextCurrentRound[p] = (nextCurrentRound[p] || 0) + 12;
          nextDisabledButtons[p] = true;
        }
      });
    } else {
      // Cộng dồn điểm thay vì thay thế
      nextCurrentRound[player] = (nextCurrentRound[player] || 0) + delta;
      nextDisabledButtons[player] = true;
    }

    setCurrentRound(nextCurrentRound);
    setDisabledButtons(nextDisabledButtons);
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

    // Lưu vào lịch sử heo của ván hiện tại
    setCurrentRoundHeos((prev) => [
      ...prev,
      {
        victim: heoVictim,
        chopper: heoChopper,
        color: heoColor,
      },
    ]);

    // reset chọn cho lần sau
    setHeoVictim("");
    setHeoChopper("");
    setHeoColor("den");
  };

  // --- bóp cổ - UPDATED ---
  const openBopCo = (player) => {
    setBopCoWinner(player);
    // Khởi tạo state cho các người chơi còn lại
    const initialHeos = {};
    players.forEach((p) => {
      if (p !== player) {
        initialHeos[p] = { den: 0, do: 0 };
      }
    });
    setBopCoPlayerHeos(initialHeos);
    setShowBopCo(true);
  };

  // UPDATED: toggle với count 0, 1, 2
  const cyclePlayerHeo = (player, heoType) => {
    setBopCoPlayerHeos((prev) => {
      const current = prev[player]?.[heoType] || 0;
      const next = (current + 1) % 3; // 0 -> 1 -> 2 -> 0
      return {
        ...prev,
        [player]: {
          ...prev[player],
          [heoType]: next,
        },
      };
    });
  };

  const recordBopCo = () => {
    if (!bopCoWinner) return;

    const nextCurrentRound = { ...currentRound };
    const nextDisabledButtons = { ...disabledButtons };

    let totalPoints = 0;

    // Tính điểm cho từng người chơi
    players.forEach((p) => {
      if (p !== bopCoWinner) {
        let deduction = -8; // Điểm cơ bản

        const playerHeos = bopCoPlayerHeos[p] || { den: 0, do: 0 };

        // Cộng thêm heo đen (-2 mỗi con)
        deduction -= playerHeos.den * 2;

        // Cộng thêm heo đỏ (-4 mỗi con)
        deduction -= playerHeos.do * 4;

        nextCurrentRound[p] = (nextCurrentRound[p] || 0) + deduction;
        nextDisabledButtons[p] = true;
        totalPoints -= deduction; // Tổng điểm người thắng nhận được
      }
    });

    // Người bóp cổ nhận tất cả điểm
    nextCurrentRound[bopCoWinner] =
      (nextCurrentRound[bopCoWinner] || 0) + totalPoints;
    nextDisabledButtons[bopCoWinner] = true;

    setCurrentRound(nextCurrentRound);
    setDisabledButtons(nextDisabledButtons);

    // Đóng modal
    setShowBopCo(false);
    setBopCoWinner("");
    setBopCoPlayerHeos({});
  };

  const resetRound = () => {
    const reset = {};
    const resetDisabled = {};
    players.forEach((p) => {
      reset[p] = 0;
      resetDisabled[p] = false;
    });
    setCurrentRound(reset);
    setDisabledButtons(resetDisabled);
    setCurrentRoundHeos([]); // Reset heo của ván hiện tại
  };

  // --- hết ván: cộng vào tổng + lưu lịch sử ---
  const endRound = () => {
    if (players.length === 0) return;

    // Kiểm tra xem có điểm nào được ghi chưa
    const hasAnyScore = Object.values(currentRound).some(
      (score) => score !== 0,
    );
    if (!hasAnyScore) {
      alert("Vui lòng ghi điểm trước khi kết thúc ván!");
      return;
    }

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

    // Cập nhật streaks
    updateStreaks(roundSnapshot);

    // Lưu lịch sử heo với index ván
    const roundIndex = logs.length;
    const heosWithRoundIndex = currentRoundHeos.map((h) => ({
      ...h,
      roundIndex,
    }));
    setHeoLogs((prev) => [...prev, ...heosWithRoundIndex]);

    // reset ván hiện tại
    resetRound();
  };

  // Hàm xóa ván cuối cùng
  const undoLastRound = () => {
    if (logs.length === 0) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn hoàn tác ván cuối cùng?",
    );
    if (!confirmed) return;

    const lastRound = logs[logs.length - 1];
    const nextScores = { ...scores };

    // Trừ điểm của ván cuối
    players.forEach((p) => {
      const change = lastRound[p] || 0;
      nextScores[p] = (nextScores[p] || 0) - change;
    });

    setScores(nextScores);
    setLogs(logs.slice(0, -1));

    // Xóa lịch sử heo của ván cuối
    const lastRoundIndex = logs.length - 1;
    setHeoLogs((prev) => prev.filter((h) => h.roundIndex !== lastRoundIndex));
  };

  // Hàm reset toàn bộ game
  const resetGame = () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn reset toàn bộ trò chơi? Mọi dữ liệu sẽ bị xóa!",
    );
    if (!confirmed) return;

    const reset = {};
    const resetDisabled = {};
    players.forEach((p) => {
      reset[p] = 0;
      resetDisabled[p] = false;
    });

    setScores(reset);
    setLogs([]);
    setHeoLogs([]);
    setCurrentRound(reset);
    setCurrentRoundHeos([]);
    setDisabledButtons(resetDisabled);
  };

  // Tính tổng điểm bóp cổ - UPDATED
  const calculateBopCoTotal = () => {
    let total = 0;
    players.forEach((p) => {
      if (p !== bopCoWinner) {
        let deduction = 8;
        const playerHeos = bopCoPlayerHeos[p] || { den: 0, do: 0 };
        deduction += playerHeos.den * 2;
        deduction += playerHeos.do * 4;
        total += deduction;
      }
    });
    return total;
  };

  const maxRounds = logs.length;
  // Chỉ hiển thị 3 ván gần nhất trên bảng
  const visibleRounds = Math.min(3, maxRounds);
  const startRoundIndex = Math.max(0, maxRounds - 3);

  //danh hiệu
  const getSituationTitle = (player) => {
    const streak = playerStreaks[player];
    if (!streak) return "";

    const { current, type, history } = streak;
    const last3 = history
      .slice(-3)
      .map((h) => (h.score > 0 ? "W" : h.score < 0 ? "L" : "D"))
      .join("");
    const last2 = history
      .slice(-2)
      .map((h) => (h.score > 0 ? "W" : h.score < 0 ? "L" : "D"))
      .join("");

    // 1️⃣ Chuỗi thắng dài rồi thua
    if (type === "lose" && current === 1 && history.length >= 6) {
      const prev = history.at(-2);
      if (prev?.streak >= 5 && prev?.type === "win") {
        return "💔 Một đêm thành hèn";
      }
    }

    // 2️⃣ Thua dài rồi thắng
    if (type === "win" && current === 1) {
      const prev = history.at(-2);
      if (prev?.streak >= 5 && prev?.type === "lose") {
        return "🌅 Hồi sinh từ địa ngục";
      }
    }

    // 3️⃣ Thắng – thua – thắng
    if (last3 === "WLW") {
      return "🎭 Tâm lý bất ổn";
    }

    // 4️⃣ Thua – thắng – thua
    if (last3 === "LWL") {
      return "🥲 Le lói hy vọng rồi tắt";
    }

    // 5️⃣ Lên đỉnh rồi tụt
    if (last2 === "WL") {
      return "📉 Lên đỉnh là tụt";
    }

    // 6️⃣ Chuỗi thắng cực dài
    if (type === "win" && current >= 8) {
      return "🔥🔥 Bất khả chiến bại";
    }

    // 7️⃣ Chuỗi thua cực dài
    if (type === "lose" && current >= 7) {
      return "🧊 Đóng băng phong độ";
    }

    // 8️⃣ Thắng đều nhưng không bốc
    if (type === "win" && current === 2) {
      return "🪙 Đánh đều tay";
    }

    // 9️⃣ Thua nhưng lì
    if (type === "lose" && current === 3) {
      return "😤 Càng thua càng lì";
    }

    // 🔟 Thắng sát nút nhiều lần (đơn giản hóa)
    if (type === "win" && current >= 3) {
      return "😬 Thắng trong sợ hãi";
    }

    return "";
  };

  return (
    <div className="app-container" onClick={() => setOpenMenuPlayer(null)}>
      <div className="app-content">
        <h1 className="app-title">🃏 Tính Điểm Tiến Lên Miền Nam 🃏</h1>

        {/* Thêm người chơi */}
        {players.length < 4 && (
          <div className="add-player-section">
            <div className="add-player-form">
              <input
                className="player-input"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPlayer();
                }}
                placeholder="Nhập tên người chơi"
              />
              <button className="add-player-btn" onClick={addPlayer}>
                ➕ Thêm
              </button>
            </div>
          </div>
        )}

        {/* Khối ghi sự kiện chặt heo */}
        {players.length >= 2 && (
          <div className="heo-section">
            <div className="heo-form">
              <span className="heo-title">🐷 CHẶT HEO</span>

              <div className="heo-select-group">
                <label>Người bị chặt:</label>
                <select
                  className="heo-select"
                  value={heoVictim}
                  onChange={(e) => setHeoVictim(e.target.value)}
                >
                  <option value="">-- chọn --</option>
                  {players.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="heo-select-group">
                <label>Người chặt:</label>
                <select
                  className="heo-select"
                  value={heoChopper}
                  onChange={(e) => setHeoChopper(e.target.value)}
                >
                  <option value="">-- chọn --</option>
                  {players.map((p) => (
                    <option key={p} value={p} disabled={p === heoVictim}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="heo-select-group">
                <label>Loại heo:</label>
                <select
                  className="heo-select"
                  value={heoColor}
                  onChange={(e) => setHeoColor(e.target.value)}
                >
                  <option value="den">🖤 Đen (-/+2)</option>
                  <option value="do">❤️ Đỏ (-/+4)</option>
                </select>
              </div>

              <button className="heo-record-btn" onClick={recordHeo}>
                ⚡ Ghi điểm
              </button>
            </div>

            {/* Hiển thị lịch sử heo của ván hiện tại */}
            {currentRoundHeos.length > 0 && (
              <div className="current-round-heos">
                <h4>📋 Heo của ván này:</h4>
                <div className="heo-list">
                  {currentRoundHeos.map((heo, idx) => (
                    <span key={idx} className="heo-item">
                      {heo.color === "den" ? "🖤" : "❤️"} {heo.chopper} chặt{" "}
                      {heo.victim}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bảng chính */}
        {players.length > 0 && (
          <>
            <div className="table-container">
              <table className="score-table">
                <thead>
                  <tr>
                    <th>👤 Người chơi</th>
                    {Array.from({ length: visibleRounds }, (_, i) => {
                      const actualIndex = startRoundIndex + i;
                      return <th key={actualIndex}>Ván {actualIndex + 1}</th>;
                    })}
                    <th
                      style={{
                        background: "linear-gradient(45deg, #ffa500, #ff6b6b)",
                      }}
                    >
                      🎯 Ván hiện tại
                    </th>
                    <th
                      style={{
                        background: "linear-gradient(45deg, #10b981, #06b6d4)",
                      }}
                    >
                      🏆 Tổng điểm
                    </th>
                    <th>⚙️ Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, index) => (
                    <tr key={p}>
                      {/* tên + sửa + xóa */}
                      <td className="player-name-cell">
                        {editing === p ? (
                          <div className="player-actions">
                            <input
                              className="edit-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(p);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              autoFocus
                            />
                            <button
                              className="save-btn"
                              onClick={() => saveEdit(p)}
                            >
                              💾
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => setEditing(null)}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div className="player-actions">
                            <div className="player-name-wrapper">
                              <span
                                className={`player-name ${getStreakClass(playerStreaks[p]?.current || 0, playerStreaks[p]?.type)}`}
                                style={{ color: "#333" }}
                              >
                                {p}
                              </span>
                              {/* xử lí hiển thị danh hiệu */}
                              {getSituationTitle(p) && (
                                <div className="situation-title">
                                  {getSituationTitle(p)}
                                </div>
                              )}

                              {playerStreaks[p]?.current >= 3 && (
                                <div className="streak-badge">
                                  <span className="streak-title">
                                    {getStreakTitle(
                                      playerStreaks[p].current,
                                      playerStreaks[p].type,
                                    )}
                                  </span>
                                  <span className="streak-count">
                                    {playerStreaks[p].current}{" "}
                                    {playerStreaks[p].type === "win"
                                      ? "thắng"
                                      : "thua"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div
                              className="player-menu-wrapper"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="menu-dot-btn"
                                onClick={() =>
                                  setOpenMenuPlayer(
                                    openMenuPlayer === p ? null : p,
                                  )
                                }
                              >
                                ⋮
                              </button>

                              {openMenuPlayer === p && (
                                <div
                                  className="player-menu"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="player-menu-item"
                                    onClick={() => {
                                      startEdit(p);
                                      setOpenMenuPlayer(null);
                                    }}
                                  >
                                    ✏️ Sửa tên
                                  </button>

                                  <button
                                    className="player-menu-item danger"
                                    onClick={() => {
                                      deletePlayer(p);
                                      setOpenMenuPlayer(null);
                                    }}
                                  >
                                    🗑️ Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* lịch sử ván đã chốt - chỉ hiển thị 3 ván gần nhất */}
                      {Array.from({ length: visibleRounds }, (_, i) => {
                        const actualIndex = startRoundIndex + i;
                        const v = logs[actualIndex]?.[p] ?? 0;
                        return (
                          <td
                            key={actualIndex}
                            className="score-cell"
                            style={colorize(v)}
                          >
                            {/* {v ? (v > 0 ? `+${v}` : v) : ""} */}
                            {v > 0 ? `+${v}` : v}
                          </td>
                        );
                      })}

                      {/* ván hiện tại */}
                      <td
                        className="current-round-cell"
                        style={colorize(currentRound[p] || 0)}
                      >
                        {currentRound[p] > 0
                          ? `+${currentRound[p]}`
                          : currentRound[p]}
                      </td>

                      {/* tổng điểm */}
                      <td
                        className="total-score-cell"
                        style={colorize(scores[p] || 0)}
                      >
                        {scores[p] || 0}
                      </td>

                      {/* hành động thường */}
                      <td>
                        <div className="action-buttons">
                          {[
                            { key: "nhat", label: "🥇 Nhất", color: "#fbbf24" },
                            { key: "nhi", label: "🥈 Nhì", color: "#a3a3a3" },
                            { key: "ba", label: "🥉 Ba", color: "#cd7c2f" },
                            { key: "chot", label: "😢 Chót", color: "#ef4444" },
                            ...(players.length === 4
                              ? [
                                  {
                                    key: "toiTrang",
                                    label: "✨ Tới Trắng",
                                    color: "#4c51bf",
                                  },
                                ]
                              : []),
                          ].map(({ key, label, color }) => (
                            <button
                              key={key}
                              className="rank-btn"
                              onClick={() => addScore(p, key)}
                              disabled={disabledButtons[p]}
                              style={{
                                background: color,
                                boxShadow: `0 2px 8px ${color}40`,
                              }}
                            >
                              {label}
                            </button>
                          ))}

                          {/* Nút Bóp Cổ */}
                          {players.length === 4 && (
                            <button
                              className="rank-btn"
                              onClick={() => openBopCo(p)}
                              disabled={disabledButtons[p]}
                              style={{
                                background: "#dc2626",
                                boxShadow: "0 2px 8px #dc262640",
                              }}
                            >
                              💀 Bóp Cổ
                            </button>
                          )}

                          <input
                            className="custom-score-input"
                            type="number"
                            placeholder="+/-"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = Number(e.currentTarget.value);
                                if (!Number.isNaN(v) && v !== 0)
                                  addScore(p, "custom", v);
                                e.currentTarget.value = "";
                              }
                            }}
                            disabled={disabledButtons[p]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="controls">
              <button
                className="control-btn reset-round-btn"
                onClick={resetRound}
              >
                🔄 Reset Ván
              </button>
              <button className="control-btn end-round-btn" onClick={endRound}>
                ✅ Hết Ván
              </button>
              {logs.length > 0 && (
                <>
                  <button
                    className="control-btn history-btn"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    📜 Xem Lịch Sử
                  </button>
                  <button
                    className="control-btn undo-btn"
                    onClick={undoLastRound}
                  >
                    ↩️ Hoàn Tác
                  </button>
                </>
              )}
              {(logs.length > 0 ||
                Object.values(scores).some((s) => s !== 0)) && (
                <button
                  className="control-btn reset-game-btn"
                  onClick={resetGame}
                >
                  🔥 Reset Game
                </button>
              )}
            </div>
          </>
        )}

        {/* Modal Lịch Sử - Tích hợp cả điểm và heo */}
        {showHistory && logs.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title" style={{ color: "#8b5cf6" }}>
                  📜 Lịch Sử Chi Tiết Các Ván
                </h2>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowHistory(false)}
                >
                  ✕
                </button>
              </div>

              <div>
                {/* {logs.map((round, roundIndex) => { */}
                {[...logs]
                  .map((round, index) => ({
                    round,
                    roundIndex: logs.length - 1 - index,
                  }))
                  .map(({ round, roundIndex }) => {
                    const roundHeos = heoLogs.filter(
                      (h) => h.roundIndex === roundIndex,
                    );

                    // Tính thứ hạng cho ván này
                    const playerScores = players.map((player) => ({
                      name: player,
                      score: round[player] || 0,
                    }));

                    // Sắp xếp theo điểm giảm dần
                    const sortedPlayers = [...playerScores].sort(
                      (a, b) => b.score - a.score,
                    );

                    // Gán thứ hạng
                    const rankings = {};
                    const rankLabels = [
                      "🥇 Nhất",
                      "🥈 Nhì",
                      "🥉 Ba",
                      "😢 Chót",
                    ];
                    sortedPlayers.forEach((player, index) => {
                      rankings[player.name] = rankLabels[index] || "";
                    });

                    return (
                      <div key={roundIndex} className="round-card">
                        <h3 style={{ marginBottom: "15px" }}>
                          🎯 Ván {roundIndex + 1}
                        </h3>

                        {/* Điểm của các người chơi với thứ hạng */}
                        <div className="player-scores-grid">
                          {sortedPlayers.map(({ name, score }) => (
                            <div key={name} className="player-score-item">
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                  flex: 1,
                                }}
                              >
                                <span className="player-score-name">
                                  {name}
                                </span>
                                <span className="player-rank-label">
                                  {rankings[name]}
                                </span>
                              </div>
                              <span
                                className="player-score-value"
                                style={colorize(score)}
                              >
                                {score > 0 ? `+${score}` : score}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Hiển thị heo nếu có */}
                        {roundHeos.length > 0 && (
                          <div className="round-heo-summary">
                            <h4>🐷 Chặt heo trong ván này:</h4>
                            <div className="heo-events-inline">
                              {roundHeos.map((heo, idx) => (
                                <div
                                  key={idx}
                                  className={`heo-event-compact ${heo.color}`}
                                >
                                  <span className="heo-icon-small">
                                    {heo.color === "den" ? "🖤" : "❤️"}
                                  </span>
                                  <span className="heo-chopper-compact">
                                    {heo.chopper}
                                  </span>
                                  <span className="heo-arrow">→</span>
                                  <span className="heo-victim-compact">
                                    {heo.victim}
                                  </span>
                                  <span
                                    className={`heo-badge-small ${heo.color}`}
                                  >
                                    {heo.color === "den" ? "±2" : "±4"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bóp Cổ - UPDATED UI */}
        {showBopCo && (
          <div className="modal-overlay" onClick={() => setShowBopCo(false)}>
            <div
              className="modal-content bop-co-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="bop-co-title">💀 BÓP CỔ</h2>

              <div className="bop-co-info">
                <p className="bop-co-winner">
                  🏆 Người thắng: <span>{bopCoWinner}</span>
                </p>

                <h3 className="bop-co-subtitle">
                  Chọn số lượng heo của từng người chơi:
                </h3>

                {/* Hiển thị 3 người chơi còn lại */}
                <div className="bop-co-players">
                  {players
                    .filter((p) => p !== bopCoWinner)
                    .map((player) => {
                      const playerHeos = bopCoPlayerHeos[player] || {
                        den: 0,
                        do: 0,
                      };
                      const denCount = playerHeos.den || 0;
                      const doCount = playerHeos.do || 0;
                      const playerDeduction = 8 + denCount * 2 + doCount * 4;

                      return (
                        <div key={player} className="bop-co-player-card">
                          <div className="bop-co-player-header">
                            <span className="bop-co-player-name">{player}</span>
                            <span className="bop-co-player-score">
                              -{playerDeduction}
                            </span>
                          </div>

                          <div className="bop-co-heo-counters">
                            {/* Heo đen counter */}
                            <div className="heo-counter-group">
                              <span className="heo-counter-label">
                                🖤 Heo Đen
                              </span>
                              <div className="heo-counter-controls">
                                <button
                                  className="heo-counter-btn"
                                  onClick={() => cyclePlayerHeo(player, "den")}
                                >
                                  {denCount === 0
                                    ? "0"
                                    : denCount === 1
                                      ? "1 (-2)"
                                      : "2 (-4)"}
                                </button>
                              </div>
                            </div>

                            {/* Heo đỏ counter */}
                            <div className="heo-counter-group">
                              <span className="heo-counter-label">
                                ❤️ Heo Đỏ
                              </span>
                              <div className="heo-counter-controls">
                                <button
                                  className="heo-counter-btn"
                                  onClick={() => cyclePlayerHeo(player, "do")}
                                >
                                  {doCount === 0
                                    ? "0"
                                    : doCount === 1
                                      ? "1 (-4)"
                                      : "2 (-8)"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Tổng kết */}
                <div className="bop-co-total">
                  <div className="bop-co-total-content">
                    <span className="bop-co-total-label">
                      💰 Tổng điểm {bopCoWinner} nhận:
                    </span>
                    <span className="bop-co-total-value">
                      +{calculateBopCoTotal()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-cancel-btn"
                  onClick={() => setShowBopCo(false)}
                >
                  ❌ Hủy
                </button>
                <button className="modal-confirm-btn" onClick={recordBopCo}>
                  ✅ Xác Nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
