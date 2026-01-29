import { useState } from "react";

function App() {
  // --- state chính ---
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [scores, setScores] = useState({}); // tổng điểm
  const [logs, setLogs] = useState([]); // lịch sử các ván: [{A: +2, B: -2, ...}, ...]
  const [currentRound, setCurrentRound] = useState({}); // điểm đang nhập của ván hiện tại
  const [disabledButtons, setDisabledButtons] = useState({}); // Trạng thái disable của các nút theo người chơi

  // đổi tên / xóa
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  // form chặt heo
  const [heoVictim, setHeoVictim] = useState(""); // người bị chặt
  const [heoChopper, setHeoChopper] = useState(""); // người chặt
  const [heoColor, setHeoColor] = useState("den"); // 'den' | 'do'

  // xem lịch sử
  const [showHistory, setShowHistory] = useState(false);

  // bóp cổ
  const [showBopCo, setShowBopCo] = useState(false);
  const [bopCoWinner, setBopCoWinner] = useState("");
  const [bopCoPlayerHeos, setBopCoPlayerHeos] = useState({}); // {playerName: ['den', 'do'] hoặc ['den'] hoặc ['do'] hoặc []}

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

  // --- người chơi ---
  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || players.includes(name)) return;

    setPlayers((ps) => [...ps, name]);
    setScores((s) => ({ ...s, [name]: 0 }));
    setCurrentRound((cr) => ({ ...cr, [name]: 0 }));
    setDisabledButtons((db) => ({ ...db, [name]: false }));
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
    setDisabledButtons(({ [name]: _omit4, ...rest4 }) => rest4);
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
      })
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

    if (type === 'toiTrang') {
      // Người tới trắng được +12, 3 người còn lại mỗi người -4
      players.forEach(p => {
        if (p !== player) {
          nextCurrentRound[p] = (nextCurrentRound[p] || 0) + pointMap[type];
          nextDisabledButtons[p] = true;
        } else {
          nextCurrentRound[p] = (nextCurrentRound[p] || 0) + 12;
          nextDisabledButtons[p] = true;
        }
      });
    } else {
      // FIXED: Cộng dồn điểm thay vì thay thế
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
    // reset chọn cho lần sau
    setHeoVictim("");
    setHeoChopper("");
    setHeoColor("den");
  };

  // --- bóp cổ ---
  const openBopCo = (player) => {
    setBopCoWinner(player);
    // Khởi tạo state cho các người chơi còn lại
    const initialHeos = {};
    players.forEach(p => {
      if (p !== player) {
        initialHeos[p] = [];
      }
    });
    setBopCoPlayerHeos(initialHeos);
    setShowBopCo(true);
  };

  const togglePlayerHeo = (player, heoType) => {
    setBopCoPlayerHeos(prev => {
      const playerHeos = prev[player] || [];
      const newHeos = playerHeos.includes(heoType)
        ? playerHeos.filter(h => h !== heoType)
        : [...playerHeos, heoType];
      return { ...prev, [player]: newHeos };
    });
  };

  const recordBopCo = () => {
    if (!bopCoWinner) return;

    const nextCurrentRound = { ...currentRound };
    const nextDisabledButtons = { ...disabledButtons };

    let totalPoints = 0;

    // Tính điểm cho từng người chơi
    players.forEach(p => {
      if (p !== bopCoWinner) {
        let deduction = -8; // Điểm cơ bản
        
        const playerHeos = bopCoPlayerHeos[p] || [];
        
        // Cộng thêm heo đen (-2)
        if (playerHeos.includes('den')) {
          deduction -= 2;
        }
        
        // Cộng thêm heo đỏ (-4)
        if (playerHeos.includes('do')) {
          deduction -= 4;
        }

        nextCurrentRound[p] = (nextCurrentRound[p] || 0) + deduction;
        nextDisabledButtons[p] = true;
        totalPoints -= deduction; // Tổng điểm người thắng nhận được
      }
    });

    // Người bóp cổ nhận tất cả điểm
    nextCurrentRound[bopCoWinner] = (nextCurrentRound[bopCoWinner] || 0) + totalPoints;
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
    players.forEach(p => {
      reset[p] = 0;
      resetDisabled[p] = false;
    });
    setCurrentRound(reset);
    setDisabledButtons(resetDisabled);
  };

  // --- hết ván: cộng vào tổng + lưu lịch sử ---
  const endRound = () => {
    if (players.length === 0) return;

    // Kiểm tra xem có điểm nào được ghi chưa
    const hasAnyScore = Object.values(currentRound).some(score => score !== 0);
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

    // reset ván hiện tại
    resetRound();
  };

  // Hàm xóa ván cuối cùng
  const undoLastRound = () => {
    if (logs.length === 0) return;
    
    const confirmed = window.confirm("Bạn có chắc muốn hoàn tác ván cuối cùng?");
    if (!confirmed) return;

    const lastRound = logs[logs.length - 1];
    const nextScores = { ...scores };
    
    // Trừ điểm của ván cuối
    players.forEach(p => {
      const change = lastRound[p] || 0;
      nextScores[p] = (nextScores[p] || 0) - change;
    });

    setScores(nextScores);
    setLogs(logs.slice(0, -1));
  };

  // Hàm reset toàn bộ game
  const resetGame = () => {
    const confirmed = window.confirm("Bạn có chắc muốn reset toàn bộ trò chơi? Mọi dữ liệu sẽ bị xóa!");
    if (!confirmed) return;

    const reset = {};
    const resetDisabled = {};
    players.forEach(p => {
      reset[p] = 0;
      resetDisabled[p] = false;
    });
    
    setScores(reset);
    setLogs([]);
    setCurrentRound(reset);
    setDisabledButtons(resetDisabled);
  };

  // Tính tổng điểm bóp cổ
  const calculateBopCoTotal = () => {
    let total = 0;
    players.forEach(p => {
      if (p !== bopCoWinner) {
        let deduction = 8;
        const playerHeos = bopCoPlayerHeos[p] || [];
        if (playerHeos.includes('den')) deduction += 2;
        if (playerHeos.includes('do')) deduction += 4;
        total += deduction;
      }
    });
    return total;
  };

  const maxRounds = logs.length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          marginBottom: '30px',
          animation: 'fadeInDown 0.8s ease-out'
        }}>
          🃏 Tính Điểm Tiến Lên Miền Nam 🃏
        </h1>

        {/* Thêm người chơi */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div className="add-player-form" style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '20px',
            display: 'inline-block',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <input
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addPlayer();
              }}
              placeholder="Nhập tên người chơi"
              style={{
                padding: '12px 16px',
                fontSize: '16px',
                border: 'none',
                borderRadius: '25px',
                outline: 'none',
                width: '250px',
                background: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                marginRight: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.transform = 'translateY(-2px)'}
              onBlur={(e) => e.target.style.transform = 'translateY(0)'}
            />
            <button
              onClick={addPlayer}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255,107,107,0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(255,107,107,0.4)';
              }}
            >
              ➕ Thêm
            </button>
          </div>
        </div>

        {/* Khối ghi sự kiện chặt heo */}
        {players.length >= 2 && (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '25px',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            animation: 'slideInUp 0.6s ease-out'
          }}>
            <div className="heo-form" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginRight: '10px'
              }}>
                🐷 CHẶT HEO
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#555' }}>Người bị chặt:</label>
                <select
                  value={heoVictim}
                  onChange={(e) => setHeoVictim(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '2px solid #ddd',
                    background: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="">-- chọn --</option>
                  {players.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#555' }}>Người chặt:</label>
                <select
                  value={heoChopper}
                  onChange={(e) => setHeoChopper(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '2px solid #ddd',
                    background: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="">-- chọn --</option>
                  {players.map((p) => (
                    <option key={p} value={p} disabled={p === heoVictim}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: '600', color: '#555' }}>Loại heo:</label>
                <select
                  value={heoColor}
                  onChange={(e) => setHeoColor(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '2px solid #ddd',
                    background: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="den">🖤 Đen (-/+2)</option>
                  <option value="do">❤️ Đỏ (-/+4)</option>
                </select>
              </div>

              <button
                onClick={recordHeo}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(139,92,246,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)';
                }}
              >
                ⚡ Ghi điểm
              </button>
            </div>
          </div>
        )}

        {/* Bảng chính */}
        {players.length > 0 && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              marginBottom: '30px',
              animation: 'fadeInUp 0.8s ease-out',
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white'
                  }}>
                    <th style={{
                      padding: '15px 10px',
                      borderRadius: '10px 0 0 0',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      👤 Người chơi
                    </th>
                    {Array.from({ length: maxRounds }, (_, i) => (
                      <th key={i} style={{
                        padding: '15px 10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Ván {i + 1}
                      </th>
                    ))}
                    <th style={{
                      padding: '15px 10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      background: 'linear-gradient(45deg, #ffa500, #ff6b6b)'
                    }}>
                      🎯 Ván hiện tại
                    </th>
                    <th style={{
                      padding: '15px 10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      background: 'linear-gradient(45deg, #10b981, #06b6d4)'
                    }}>
                      🏆 Tổng điểm
                    </th>
                    <th style={{
                      padding: '15px 10px',
                      borderRadius: '0 10px 0 0',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      ⚙️ Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, index) => (
                    <tr key={p} style={{
                      background: index % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(248,250,252,0.8)',
                      transition: 'all 0.3s ease'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(248,250,252,0.8)'}
                    >
                      {/* tên + sửa + xóa */}
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>
                        {editing === p ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(p);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              autoFocus
                              style={{
                                width: '100px',
                                padding: '4px 8px',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => saveEdit(p)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              💾
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#333' }}>{p}</span>
                            <button
                              onClick={() => startEdit(p)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(139,92,246,0.2)'}
                              onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deletePlayer(p)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.2)'}
                              onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>

                      {/* lịch sử ván đã chốt */}
                      {Array.from({ length: maxRounds }, (_, i) => {
                        const v = logs[i]?.[p] ?? 0;
                        return (
                          <td key={i} style={{
                            padding: '12px 10px',
                            textAlign: 'center',
                            fontWeight: '600',
                            fontSize: '16px',
                            ...colorize(v)
                          }}>
                            {v ? (v > 0 ? `+${v}` : v) : ""}
                          </td>
                        );
                      })}

                      {/* ván hiện tại */}
                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        background: 'rgba(255,165,0,0.1)',
                        ...colorize(currentRound[p] || 0)
                      }}>
                        {currentRound[p] ? (currentRound[p] > 0 ? `+${currentRound[p]}` : currentRound[p]) : ""}
                      </td>

                      {/* tổng điểm */}
                      <td style={{
                        padding: '12px 10px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        background: 'rgba(16,185,129,0.1)',
                        ...colorize(scores[p] || 0)
                      }}>
                        {scores[p] || 0}
                      </td>

                      {/* hành động thường */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {[
                            { key: 'nhat', label: '🥇 Nhất', color: '#fbbf24' },
                            { key: 'nhi', label: '🥈 Nhì', color: '#a3a3a3' },
                            { key: 'ba', label: '🥉 Ba', color: '#cd7c2f' },
                            { key: 'chot', label: '😢 Chót', color: '#ef4444' },
                            ...(players.length === 4 ? [{ key: 'toiTrang', label: '✨ Tới Trắng', color: '#4c51bf' }] : [])
                          ].map(({ key, label, color }) => (
                            <button
                              key={key}
                              onClick={() => addScore(p, key)}
                              disabled={disabledButtons[p]}
                              style={{
                                background: color,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                boxShadow: `0 2px 8px ${color}40`,
                                opacity: disabledButtons[p] ? 0.6 : 1,
                                pointerEvents: disabledButtons[p] ? 'none' : 'auto'
                              }}
                              onMouseEnter={(e) => {
                                if (!disabledButtons[p]) {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = `0 4px 12px ${color}60`;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!disabledButtons[p]) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = `0 2px 8px ${color}40`;
                                }
                              }}
                            >
                              {label}
                            </button>
                          ))}
                          
                          {/* Nút Bóp Cổ */}
                          {players.length === 4 && (
                            <button
                              onClick={() => openBopCo(p)}
                              disabled={disabledButtons[p]}
                              style={{
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px #dc262640',
                                opacity: disabledButtons[p] ? 0.6 : 1,
                                pointerEvents: disabledButtons[p] ? 'none' : 'auto'
                              }}
                              onMouseEnter={(e) => {
                                if (!disabledButtons[p]) {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 12px #dc262660';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!disabledButtons[p]) {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px #dc262640';
                                }
                              }}
                            >
                              💀 Bóp Cổ
                            </button>
                          )}
                          
                          <input
                            type="number"
                            placeholder="+/-"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = Number(e.currentTarget.value);
                                if (!Number.isNaN(v) && v !== 0) addScore(p, "custom", v);
                                e.currentTarget.value = "";
                              }
                            }}
                            disabled={disabledButtons[p]}
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              border: `2px solid ${disabledButtons[p] ? '#e5e7eb' : '#ddd'}`,
                              borderRadius: '8px',
                              outline: 'none',
                              textAlign: 'center',
                              fontSize: '14px',
                              transition: 'all 0.3s ease',
                              background: disabledButtons[p] ? '#f3f4f6' : 'white',
                              pointerEvents: disabledButtons[p] ? 'none' : 'auto'
                            }}
                            onFocus={(e) => !disabledButtons[p] && (e.target.style.borderColor = '#8b5cf6')}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={resetRound}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #ef4444, #f97316)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = '0 6px 20px rgba(239,68,68,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(239,68,68,0.4)';
                }}
              >
                🔄 Reset Ván
              </button>
              <button
                onClick={endRound}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #10b981, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16,185,129,0.4)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(16,185,129,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(16,185,129,0.4)';
                }}
              >
                ✅ Hết Ván
              </button>
              {logs.length > 0 && (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                      padding: '12px 30px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px) scale(1.05)';
                      e.target.style.boxShadow = '0 6px 20px rgba(139,92,246,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)';
                    }}
                  >
                    📜 {showHistory ? 'Ẩn' : 'Xem'} Lịch Sử
                  </button>
                  <button
                    onClick={undoLastRound}
                    style={{
                      padding: '12px 30px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(251,191,36,0.4)',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px) scale(1.05)';
                      e.target.style.boxShadow = '0 6px 20px rgba(251,191,36,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(251,191,36,0.4)';
                    }}
                  >
                    ↩️ Hoàn Tác
                  </button>
                </>
              )}
              {(logs.length > 0 || Object.values(scores).some(s => s !== 0)) && (
                <button
                  onClick={resetGame}
                  style={{
                    padding: '12px 30px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #6b7280, #4b5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(107,114,128,0.4)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px) scale(1.05)';
                    e.target.style.boxShadow = '0 6px 20px rgba(107,114,128,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(107,114,128,0.4)';
                  }}
                >
                  🔥 Reset Game
                </button>
              )}
            </div>

            {/* Lịch sử chi tiết */}
            {showHistory && logs.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                marginBottom: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'slideInUp 0.6s ease-out'
              }}>
                <h2 style={{
                  textAlign: 'center',
                  color: '#333',
                  marginBottom: '20px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📜 Lịch Sử Chi Tiết Các Ván
                </h2>
                
                <div style={{ overflowX: 'auto' }}>
                  {logs.map((round, roundIndex) => (
                    <div key={roundIndex} style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '15px',
                      padding: '20px',
                      marginBottom: '15px',
                      border: '2px solid #8b5cf6'
                    }}>
                      <h3 style={{
                        color: '#8b5cf6',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        fontSize: '18px'
                      }}>
                        🎯 Ván {roundIndex + 1}
                      </h3>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                      }}>
                        {players.map(player => {
                          const score = round[player] || 0;
                          return (
                            <div key={player} style={{
                              background: 'white',
                              borderRadius: '10px',
                              padding: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                              <span style={{ fontWeight: '600', color: '#333' }}>
                                {player}
                              </span>
                              <span style={{
                                fontWeight: 'bold',
                                fontSize: '18px',
                                ...colorize(score)
                              }}>
                                {score > 0 ? `+${score}` : score}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Bóp Cổ */}
        {showBopCo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out',
            padding: '20px'
          }}
            onClick={() => setShowBopCo(false)}
          >
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.3s ease-out'
            }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                textAlign: 'center',
                color: '#dc2626',
                marginBottom: '25px',
                fontSize: '28px',
                fontWeight: 'bold'
              }}>
                💀 BÓP CỔ
              </h2>

              <div style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px',
                border: '2px solid #dc2626'
              }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  🏆 Người thắng: <span style={{ color: '#dc2626' }}>{bopCoWinner}</span>
                </p>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  Chọn heo của từng người chơi:
                </h3>

                {/* Hiển thị 3 người chơi còn lại */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {players.filter(p => p !== bopCoWinner).map(player => {
                    const playerHeos = bopCoPlayerHeos[player] || [];
                    const hasDen = playerHeos.includes('den');
                    const hasDo = playerHeos.includes('do');
                    const playerDeduction = 8 + (hasDen ? 2 : 0) + (hasDo ? 4 : 0);

                    return (
                      <div key={player} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '15px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            fontSize: '16px',
                            color: '#333'
                          }}>
                            {player}
                          </span>
                          <span style={{
                            fontWeight: 'bold',
                            fontSize: '18px',
                            color: '#ef4444'
                          }}>
                            -{playerDeduction}
                          </span>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <label style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            background: hasDen ? '#374151' : '#f3f4f6',
                            color: hasDen ? 'white' : '#333',
                            borderRadius: '8px',
                            border: `2px solid ${hasDen ? '#374151' : '#e5e7eb'}`,
                            transition: 'all 0.3s ease',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            <input
                              type="checkbox"
                              checked={hasDen}
                              onChange={() => togglePlayerHeo(player, 'den')}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span>🖤 Heo Đen (-2)</span>
                          </label>

                          <label style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            background: hasDo ? '#dc2626' : '#f3f4f6',
                            color: hasDo ? 'white' : '#333',
                            borderRadius: '8px',
                            border: `2px solid ${hasDo ? '#dc2626' : '#e5e7eb'}`,
                            transition: 'all 0.3s ease',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            <input
                              type="checkbox"
                              checked={hasDo}
                              onChange={() => togglePlayerHeo(player, 'do')}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span>❤️ Heo Đỏ (-4)</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tổng kết */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '15px',
                  border: '2px solid #10b981'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      💰 Tổng điểm {bopCoWinner} nhận:
                    </span>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#10b981'
                    }}>
                      +{calculateBopCoTotal()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowBopCo(false)}
                  style={{
                    padding: '12px 30px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #6b7280, #4b5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(107,114,128,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(107,114,128,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(107,114,128,0.4)';
                  }}
                >
                  ❌ Hủy
                </button>
                <button
                  onClick={recordBopCo}
                  style={{
                    padding: '12px 30px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #dc2626, #b91c1c)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(220,38,38,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(220,38,38,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(220,38,38,0.4)';
                  }}
                >
                  ✅ Xác Nhận
                </button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translate3d(0, -100%, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }

            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translate3d(0, 100%, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translate3d(0, 30px, 0);
              }
              to {
                opacity: 1;
                transform: translate3d(0, 0, 0);
              }
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            * {
              box-sizing: border-box;
            }

            button:active {
              transform: scale(0.95) !important;
            }

            input:hover {
              box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
            }

            select:hover {
              box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
            }
            
            /* Tối ưu cho di động */
            @media (max-width: 768px) {
              h1 {
                font-size: 1.8rem !important;
              }
              .add-player-form {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
              }
              .add-player-form input, .add-player-form button {
                width: 100% !important;
                margin: 0 !important;
              }
              .heo-form {
                display: flex;
                flex-direction: column;
                gap: 15px !important;
              }
              .heo-form > div {
                width: 100%;
                justify-content: space-between;
              }
              table {
                font-size: 12px;
                display: block;
                overflow-x: auto;
                white-space: nowrap;
              }
              td, th {
                padding: 8px 6px !important;
              }
              button {
                font-size: 14px !important;
                padding: 10px 20px !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default App;
