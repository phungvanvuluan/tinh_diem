export function getPlayerTitle(player, opponent = null) {
  const { winStreak, loseStreak, lastResults, totalWins } = player;

  const justWon = lastResults.at(-1) === "W";
  const justLost = lastResults.at(-1) === "L";

  // 1
  if (winStreak >= 5 && justLost)
    return "💔 Một đêm thành hèn";

  // 2
  if (winStreak >= 4 && opponent?.loseStreak >= 3 && justLost)
    return "🐍 Ngã ngựa trước dân đáy xã hội";

  // 3
  if (
    lastResults.length >= 6 &&
    lastResults.slice(-6).every(
      (r, i, arr) => i === 0 || r !== arr[i - 1]
    )
  )
    return "🎭 Tâm lý yếu – đánh theo cảm xúc";

  // 4
  if (loseStreak >= 5 && justWon)
    return "🌅 Hồi sinh từ địa ngục";

  // 5
  if (loseStreak >= 7)
    return "🧊 Đóng băng phong độ";

  // 6
  if (lastResults.slice(-2).join("") === "WL")
    return "📉 Lên đỉnh là tụt";

  // 7
  if (winStreak === 2 || winStreak === 3)
    return "🧠 Thực dụng – ăn chắc mặc bền";

  // 8
  if (totalWins >= 10 && winStreak <= 2)
    return "🪙 Đánh đều tay – không bốc";

  // 9
  if (winStreak >= 8)
    return "🔥🔥 Bất khả chiến bại";

  // 10
  if (lastResults.slice(-3).join("") === "LWL")
    return "🥲 Le lói hy vọng rồi tắt";

  return null;
}
