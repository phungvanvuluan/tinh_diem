import { useState } from "react";
import "./App.css";

function App() {
  // --- state chính ---
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [scores, setScores] = useState({}); // tổng điểm
  const [logs, setLogs] = useState([]); // lịch sử các ván
  const [heoLogs, setHeoLogs] = useState([]); // lịch sử chặt heo
  const [currentRound, setCurrentRound] = useState({}); // điểm đang nhập của ván hiện tại
  const [customScoreDrafts, setCustomScoreDrafts] = useState({});
  const [currentRoundHeos, setCurrentRoundHeos] = useState([]); // heo của ván hiện tại
  const [disabledButtons, setDisabledButtons] = useState({}); // Trạng thái disable của các nút
  const [openMenuPlayer, setOpenMenuPlayer] = useState(null); // menu người chơi

  // Hệ thống streak và achievement
  const [playerStreaks, setPlayerStreaks] = useState({});

  // đổi tên / xóa
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  // form chặt heo
  const [heoVictim, setHeoVictim] = useState("");
  const [heoChopper, setHeoChopper] = useState("");
  const [heoColor, setHeoColor] = useState("den");

  // xem lịch sử
  const [showHistory, setShowHistory] = useState(false);

  // bóp cổ
  const [showBopCo, setShowBopCo] = useState(false);
  const [bopCoWinner, setBopCoWinner] = useState("");
  const [bopCoPlayerHeos, setBopCoPlayerHeos] = useState({});

  const pointMap = {
    nhat: 4,
    nhi: 2,
    ba: -2,
    chot: -4,
    toiTrang: -4,
  };

  // --- helper ---
  const colorize = (n) => ({
    color: n > 0 ? "#10b981" : n < 0 ? "#ef4444" : "#6b7280",
    fontWeight: 600,
  });

  // Hàm tính streak title
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

      if (playerScore > 0) {
        if (newStreaks[player].type === "win") {
          newStreaks[player].current += 1;
        } else {
          newStreaks[player].current = 1;
          newStreaks[player].type = "win";
        }
      } else if (playerScore < 0) {
        if (newStreaks[player].type === "lose") {
          newStreaks[player].current += 1;
        } else {
          newStreaks[player].current = 1;
          newStreaks[player].type = "lose";
        }
      } else {
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
    setScores(({ [name]: _, ...rest }) => rest);
    setCurrentRound(({ [name]: _, ...rest }) => rest);
    setLogs((L) =>
      L.map((round) => {
        const { [name]: _, ...rest } = round;
        return rest;
      }),
    );
    setDisabledButtons(({ [name]: _, ...rest }) => rest);
    setPlayerStreaks(({ [name]: _, ...rest }) => rest);
    setHeoLogs((logs) =>
      logs.filter((h) => h.victim !== name && h.chopper !== name),
    );
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
    setScores((s) => {
      const { [oldName]: old, ...rest } = s;
      return { ...rest, [nn]: old ?? 0 };
    });
    setCurrentRound((cr) => {
      const { [oldName]: old, ...rest } = cr;
      return { ...rest, [nn]: old ?? 0 };
    });
    setLogs((L) =>
      L.map((round) => {
        const { [oldName]: old, ...rest } = round;
        return { ...rest, [nn]: old ?? 0 };
      }),
    );
    setHeoLogs((logs) =>
      logs.map((h) => ({
        ...h,
        victim: h.victim === oldName ? nn : h.victim,
        chopper: h.chopper === oldName ? nn : h.chopper,
      })),
    );
    setDisabledButtons((db) => {
      const { [oldName]: old, ...rest } = db;
      return { ...rest, [nn]: old ?? false };
    });
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
      nextCurrentRound[player] = (nextCurrentRound[player] || 0) + delta;
      nextDisabledButtons[player] = true;
    }

    setCurrentRound(nextCurrentRound);
    setDisabledButtons(nextDisabledButtons);
  };

  // Điểm tùy chỉnh là điểm cuối cùng của người chơi trong ván, để có thể sửa nhanh.
  const commitCustomScore = (player, value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setCurrentRound((round) => ({ ...round, [player]: parsed }));
    setDisabledButtons((buttons) => ({ ...buttons, [player]: true }));
    setCustomScoreDrafts((drafts) => ({ ...drafts, [player]: "" }));
  };

  // --- ghi sự kiện chặt heo ---
  const recordHeo = () => {
    if (!heoVictim || !heoChopper || heoVictim === heoChopper) return;
    const abs = heoColor === "den" ? 2 : 4;
    setCurrentRound((cr) => ({
      ...cr,
      [heoVictim]: (cr[heoVictim] || 0) - abs,
      [heoChopper]: (cr[heoChopper] || 0) + abs,
    }));

    setCurrentRoundHeos((prev) => [
      ...prev,
      {
        victim: heoVictim,
        chopper: heoChopper,
        color: heoColor,
      },
    ]);

    setHeoVictim("");
    setHeoChopper("");
    setHeoColor("den");
  };

  // --- bóp cổ ---
  const openBopCo = (player) => {
    setBopCoWinner(player);
    const initialHeos = {};
    players.forEach((p) => {
      if (p !== player) {
        initialHeos[p] = { den: 0, do: 0 };
      }
    });
    setBopCoPlayerHeos(initialHeos);
    setShowBopCo(true);
  };

  const cyclePlayerHeo = (player, heoType) => {
    setBopCoPlayerHeos((prev) => {
      const current = prev[player]?.[heoType] || 0;
      const next = (current + 1) % 3;
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

    players.forEach((p) => {
      if (p !== bopCoWinner) {
        let deduction = -8;
        const playerHeos = bopCoPlayerHeos[p] || { den: 0, do: 0 };
        deduction -= playerHeos.den * 2;
        deduction -= playerHeos.do * 4;

        nextCurrentRound[p] = (nextCurrentRound[p] || 0) + deduction;
        nextDisabledButtons[p] = true;
        totalPoints -= deduction;
      }
    });

    nextCurrentRound[bopCoWinner] =
      (nextCurrentRound[bopCoWinner] || 0) + totalPoints;
    nextDisabledButtons[bopCoWinner] = true;

    setCurrentRound(nextCurrentRound);
    setDisabledButtons(nextDisabledButtons);

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
    setCustomScoreDrafts({});
    setDisabledButtons(resetDisabled);
    setCurrentRoundHeos([]);
  };

  // --- hết ván: cộng vào tổng + lưu lịch sử ---
  const endRound = () => {
    if (players.length === 0) return;

    const hasAnyScore = Object.values(currentRound).some(
      (score) => score !== 0,
    );
    if (!hasAnyScore) {
      alert("Vui lòng ghi điểm trước khi kết thúc ván!");
      return;
    }

    const totalScore = Object.values(currentRound).reduce(
      (sum, score) => sum + score,
      0,
    );
    if (totalScore !== 0) {
      alert(
        `⚠️ CẢNH BÁO: Tổng điểm không bằng 0!\n\nTổng hiện tại: ${totalScore > 0 ? "+" : ""}${totalScore}\n\nVui lòng kiểm tra lại điểm trước khi kết thúc ván.`,
      );
      return;
    }

    const nextScores = { ...scores };
    const roundSnapshot = {};
    players.forEach((p) => {
      const change = currentRound[p] || 0;
      nextScores[p] = (nextScores[p] || 0) + change;
      roundSnapshot[p] = change;
    });

    setScores(nextScores);
    setLogs((L) => [...L, roundSnapshot]);

    updateStreaks(roundSnapshot);

    const roundIndex = logs.length;
    const heosWithRoundIndex = currentRoundHeos.map((h) => ({
      ...h,
      roundIndex,
    }));
    setHeoLogs((prev) => [...prev, ...heosWithRoundIndex]);

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

    players.forEach((p) => {
      const change = lastRound[p] || 0;
      nextScores[p] = (nextScores[p] || 0) - change;
    });

    setScores(nextScores);
    setLogs(logs.slice(0, -1));

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

  // Tính tổng điểm bóp cổ
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

  // Danh hiệu tình huống
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

    if (type === "lose" && current === 1 && history.length >= 6) {
      const prev = history.at(-2);
      if (prev?.streak >= 5 && prev?.type === "win") {
        return "💔 Một đêm thành hèn";
      }
    }

    if (type === "win" && current === 1) {
      const prev = history.at(-2);
      if (prev?.streak >= 5 && prev?.type === "lose") {
        return "🌅 Hồi sinh từ địa ngục";
      }
    }

    if (last3 === "WLW") return "🎭 Tâm lý bất ổn";
    if (last3 === "LWL") return "🥲 Le lói hy vọng rồi tắt";
    if (last2 === "WL") return "📉 Lên đỉnh là tụt";
    if (type === "win" && current >= 8) return "🔥🔥 Bất khả chiến bại";
    if (type === "lose" && current >= 7) return "🧊 Đóng băng phong độ";
    if (type === "win" && current === 2) return "🪙 Đánh đều tay";
    if (type === "lose" && current === 3) return "😤 Càng thua càng lì";
    if (type === "win" && current >= 3) return "😬 Thắng trong sợ hãi";

    return "";
  };

  return (
    <div className="app-container" onClick={() => setOpenMenuPlayer(null)}>
      <div className="app-content">
        <h1 className="app-title">🃏 Tính Điểm Tiến Lên 🃏</h1>

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

        {/* Phần nhập điểm cho từng người chơi */}
        {players.length > 0 && (
          <>
            <div className="players-input-section">
              {players.map((p) => (
                <div key={p} className="player-card">
                  <div className="player-card-header">
                    {editing === p ? (
                      <div className="player-edit-mode">
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
                      <>
                        <div className="player-card-name">
                          <span className="player-name-text">{p}</span>
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
                      </>
                    )}
                  </div>

                  <div className="player-card-score">
                    <span
                      className="score-value"
                      style={colorize(currentRound[p] || 0)}
                    >
                      {currentRound[p] > 0
                        ? `+${currentRound[p]}`
                        : currentRound[p] || 0}
                    </span>
                  </div>

                  <div className="player-card-actions">
                    {[
                      { key: "nhat", label: "🥇", color: "#fbbf24" },
                      { key: "nhi", label: "🥈", color: "#a3a3a3" },
                      { key: "ba", label: "🥉", color: "#cd7c2f" },
                      { key: "chot", label: "😢", color: "#ef4444" },
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        className="action-btn-compact"
                        onClick={() => addScore(p, key)}
                        disabled={disabledButtons[p]}
                        title={`${label} ${pointMap[key] > 0 ? "+" : ""}${pointMap[key]} điểm`}
                        aria-label={`${p}: ${label}, ${pointMap[key] > 0 ? "cộng " : ""}${pointMap[key]} điểm`}
                        style={{
                          background: color,
                          boxShadow: `0 2px 8px ${color}40`,
                        }}
                      >
                        <span>{label}</span>
                        <small>{pointMap[key] > 0 ? "+" : ""}{pointMap[key]}</small>
                      </button>
                    ))}
                  </div>

                  {players.length === 4 && (
                    <div className="player-card-special">
                      <button
                        className="special-btn"
                        onClick={() => addScore(p, "toiTrang")}
                        disabled={disabledButtons[p]}
                      >
                        ✨ Tới Trắng
                      </button>
                      <button
                        className="special-btn bop-co"
                        onClick={() => openBopCo(p)}
                        disabled={disabledButtons[p]}
                      >
                        💀 Bóp Cổ
                      </button>
                    </div>
                  )}

                  <input
                    className="custom-score-input-compact"
                    type="number"
                    value={customScoreDrafts[p] ?? ""}
                    placeholder={`Điểm: ${currentRound[p] || 0} · nhập để sửa`}
                    aria-label={`Nhập điểm cho ${p}`}
                    onChange={(e) =>
                      setCustomScoreDrafts((drafts) => ({
                        ...drafts,
                        [p]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (e.currentTarget.value.trim() !== "") {
                          commitCustomScore(p, e.currentTarget.value);
                          e.currentTarget.blur();
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (e.currentTarget.value.trim() !== "") {
                        commitCustomScore(p, e.currentTarget.value);
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Bảng xếp hạng - Podium Style */}
            <div className="leaderboard-section">
              <div className="leaderboard-header">
                <h3 className="leaderboard-title">🏆 BẢNG XẾP HẠNG</h3>
                {Object.values(currentRound).some((score) => score !== 0) && (
                  <div
                    className={`current-round-total ${
                      Object.values(currentRound).reduce(
                        (sum, score) => sum + score,
                        0,
                      ) !== 0
                        ? "total-error"
                        : "total-ok"
                    }`}
                  >
                    <span className="total-label">Tổng ván này:</span>
                    <span className="total-value">
                      {Object.values(currentRound).reduce(
                        (sum, score) => sum + score,
                        0,
                      ) > 0
                        ? "+"
                        : ""}
                      {Object.values(currentRound).reduce(
                        (sum, score) => sum + score,
                        0,
                      )}
                    </span>
                    {Object.values(currentRound).reduce(
                      (sum, score) => sum + score,
                      0,
                    ) !== 0 && <span className="warning-icon">⚠️</span>}
                  </div>
                )}
              </div>

              <div className="podium-container">
                {(() => {
                  const sortedPlayers = players
                    .map((p) => ({
                      name: p,
                      score: scores[p] || 0,
                      currentScore: currentRound[p] || 0,
                      streak: playerStreaks[p],
                    }))
                    .sort((a, b) => b.score - a.score);

                  const podiumOrder = [
                    sortedPlayers[1],
                    sortedPlayers[0],
                    sortedPlayers[2],
                    sortedPlayers[3],
                  ].filter(Boolean);

                  return (
                    <>
                      <div className="podium-top3">
                        {podiumOrder.slice(0, 3).map((player, idx) => {
                          const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                          const streakClass = getStreakClass(
                            player.streak?.current || 0,
                            player.streak?.type,
                          );

                          return (
                            <div
                              key={player.name}
                              className={`podium-column rank-${actualRank} ${streakClass}`}
                            >
                              <div className="podium-player-info">
                                <div className="podium-rank-badge">
                                  {actualRank === 1 && "🥇"}
                                  {actualRank === 2 && "🥈"}
                                  {actualRank === 3 && "🥉"}
                                </div>
                                <div className="podium-player-name">
                                  {player.name}
                                </div>
                                {getSituationTitle(player.name) && (
                                  <div className="podium-situation">
                                    {getSituationTitle(player.name)}
                                  </div>
                                )}
                                {player.streak?.current >= 3 && (
                                  <div className="podium-streak">
                                    {getStreakTitle(
                                      player.streak.current,
                                      player.streak.type,
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="podium-bar">
                                <div className="podium-score-display">
                                  <span
                                    className="podium-total"
                                    style={colorize(player.score)}
                                  >
                                    {player.score}
                                  </span>
                                  {player.currentScore !== 0 && (
                                    <span
                                      className="podium-change"
                                      style={colorize(player.currentScore)}
                                    >
                                      ({player.currentScore > 0 ? "+" : ""}
                                      {player.currentScore})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {podiumOrder[3] && (
                        <div className="podium-last">
                          <div
                            className={`podium-last-item ${getStreakClass(
                              podiumOrder[3].streak?.current || 0,
                              podiumOrder[3].streak?.type,
                            )}`}
                          >
                            <div className="podium-last-badge">😢</div>
                            <div className="podium-last-info">
                              <div className="podium-last-name">
                                {podiumOrder[3].name}
                              </div>
                              {getSituationTitle(podiumOrder[3].name) && (
                                <div className="podium-last-situation">
                                  {getSituationTitle(podiumOrder[3].name)}
                                </div>
                              )}
                              {podiumOrder[3].streak?.current >= 3 && (
                                <div className="podium-last-streak">
                                  {getStreakTitle(
                                    podiumOrder[3].streak.current,
                                    podiumOrder[3].streak.type,
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="podium-last-score">
                              <span
                                className="podium-last-total"
                                style={colorize(podiumOrder[3].score)}
                              >
                                {podiumOrder[3].score}
                              </span>
                              {podiumOrder[3].currentScore !== 0 && (
                                <span
                                  className="podium-last-change"
                                  style={colorize(podiumOrder[3].currentScore)}
                                >
                                  ({podiumOrder[3].currentScore > 0 ? "+" : ""}
                                  {podiumOrder[3].currentScore})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="controls">
              <button
                className="control-btn reset-round-btn"
                onClick={resetRound}
                disabled={
                  Object.values(currentRound).every((score) => score === 0)
                }
              >
                🔄 Reset Điểm
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
                    📜 Lịch Sử
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

        {/* Modal Lịch Sử - ĐÃ SỬA: Hiển thị đúng thứ tự từ cũ đến mới */}
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
                {logs.map((round, roundIndex) => {
                  const roundHeos = heoLogs.filter(
                    (h) => h.roundIndex === roundIndex,
                  );

                  const playerScores = players.map((player) => ({
                    name: player,
                    score: round[player] || 0,
                  }));

                  const sortedPlayers = [...playerScores].sort(
                    (a, b) => b.score - a.score,
                  );

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
                              <span className="player-score-name">{name}</span>
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
                                <span className={`heo-badge-small ${heo.color}`}>
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

        {/* Modal Bóp Cổ */}
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
