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

    setEditing(null);
  };

  // --- nhập điểm thường cho ván hiện tại ---
  const addScore = (player, type, custom = 0) => {
    if (disabledButtons[player]) return;

    const delta = custom || pointMap[type] || 0;
    const nextCurrentRound = { ...currentRound, [player]: delta };
    const nextDisabledButtons = { ...disabledButtons, [player]: true };

    if (type === 'toiTrang') {
      players.forEach(p => {
        if (p !== player) {
          nextCurrentRound[p] = pointMap[type];
          nextDisabledButtons[p] = true;
        } else {
          nextCurrentRound[p] = 12; // người tới trắng không cộng trừ điểm
        }
      });
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
    // reset chọn cho lần sau (tuỳ thích)
    setHeoVictim("");
    setHeoChopper("");
    setHeoColor("den");
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
          <div style={{
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
            <div style={{
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
                          <input
                            type="number"
                            placeholder="+/-"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = Number(e.currentTarget.value);
                                if (!Number.isNaN(v)) addScore(p, "custom", v);
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
                            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                  letterSpacing: '1px',
                  marginRight: '15px'
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
            </div>
          </>
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
          `}
        </style>
      </div>
    </div>
  );
}

export default App;