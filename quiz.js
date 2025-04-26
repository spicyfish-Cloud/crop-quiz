let currentQuestionIndex = 0;
let questions = [];
let answerMode = false;
let timerMode = false;
let timer = null;
let timeLeft = 15; // 每题15秒
let score = 0;
let combo = 0; // 连对数
let wrongBook = JSON.parse(localStorage.getItem("wrongBook") || "[]");
let collectBook = JSON.parse(localStorage.getItem("collectBook") || "[]");
let rankList = JSON.parse(localStorage.getItem("rankList") || "[]");
let highestScore = localStorage.getItem("highestScore") || 0;

// 每日挑战相关
let isDailyMode = false;
let dailySeed = getTodaySeed();
let dailyRecord = JSON.parse(localStorage.getItem("dailyRecord") || "{}");

// 提示卡相关
let hintUsed = parseInt(
  localStorage.getItem("hintUsed_" + dailySeed) || "0",
  10
);

function shuffle(array, seed = null) {
  // 支持伪随机，用于每日挑战
  let random = seed ? mulberry32(seed) : Math.random;
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 伪随机生成器（用于每日挑战固定题目）
function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getTodaySeed() {
  let d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function loadImages() {
  fetch("images.json")
    .then((response) => response.json())
    .then((data) => {
      questions = shuffle(data);
      score = 0;
      combo = 0;
      currentQuestionIndex = 0;
      isDailyMode = false;
      showQuestion();
      updateScore();
      renderExtraPanel();
    });
}

// --------- 创新1：连对加分机制 ---------
function submitAnswer() {
  clearTimer();
  const userAnswer = document.getElementById("answer-input").value.trim();
  const q = questions[currentQuestionIndex];
  const resultElement = document.getElementById("result");
  if (userAnswer.toLowerCase() === q.answer.toLowerCase()) {
    combo++;
    let addScore = combo;
    resultElement.textContent = `对! +${addScore}分（连对${combo}）`;
    resultElement.className = "result correct";
    score += addScore;
    updateScore();
  } else {
    resultElement.textContent = `错! 正确答案: ${q.answer}`;
    resultElement.className = "result incorrect";
    addWrongBook(q);
    combo = 0; // 连对断了
  }
  document.getElementById("desc").textContent = q.desc || "";
}

function nextQuestion() {
  clearTimer();
  currentQuestionIndex++;
  showQuestion();
}

// --------- 创新2：每日挑战模式 ---------
function startDailyChallenge() {
  fetch("images.json")
    .then((response) => response.json())
    .then((data) => {
      // 检查是否已挑战
      if (dailyRecord[dailySeed]) {
        alert("今天已挑战过啦！明天再来~");
        return;
      }
      isDailyMode = true;
      questions = shuffle([...data], dailySeed).slice(0, 5); // 每日5题
      score = 0;
      combo = 0;
      currentQuestionIndex = 0;
      showQuestion();
      updateScore();
      renderExtraPanel();
    });
}

// --------- 创新3：提示卡道具 ---------
function useHintCard() {
  if (hintUsed >= 3) {
    alert("今天的提示卡已用完！");
    return;
  }
  const q = questions[currentQuestionIndex];
  let hintLen = q.answer.length >= 2 ? 2 : 1;
  let hint = q.answer.slice(0, hintLen);
  document.getElementById("result").textContent = `提示：${hint}...`;
  document.getElementById("result").className = "result";
  hintUsed++;
  localStorage.setItem("hintUsed_" + dailySeed, hintUsed);
  renderExtraPanel();
}

// --------- 其他基础功能 ---------
function showQuestion() {
  clearTimer();
  if (currentQuestionIndex < questions.length) {
    const q = questions[currentQuestionIndex];
    document.getElementById("quiz-image").src = `images/${q.file}`;
    document.getElementById("answer-input").value = "";
    document.getElementById("result").textContent = "";
    document.getElementById("desc").textContent = "";
    document.getElementById("collect-button").textContent = isCollected(q)
      ? "已收藏"
      : "收藏";
    if (answerMode) {
      document.getElementById("result").textContent = `正确答案: ${q.answer}`;
      document.getElementById("result").className = "result correct";
      document.getElementById("submit-button").style.display = "none";
      document.getElementById("desc").textContent = q.desc || "";
    } else {
      document.getElementById("submit-button").style.display = "inline-block";
    }
    if (timerMode) startTimer();
    else document.getElementById("timer").textContent = "";
    renderExtraPanel();
  } else {
    endQuiz();
  }
}

function toggleAnswerMode() {
  answerMode = !answerMode;
  showQuestion();
}

function toggleTimerMode() {
  timerMode = !timerMode;
  showQuestion();
}

function startTimer() {
  timeLeft = 15;
  document.getElementById("timer").textContent = `剩余时间: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `剩余时间: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearTimer();
      document.getElementById("result").textContent = "超时！";
      document.getElementById("result").className = "result incorrect";
      addWrongBook(questions[currentQuestionIndex]);
      combo = 0;
    }
  }, 1000);
}

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  document.getElementById("timer").textContent = "";
}

function updateScore() {
  let scoreDiv = document.getElementById("score-info");
  scoreDiv.innerHTML = `当前得分: <b>${score}</b> | 历史最高分: <b>${highestScore}</b> ${
    isDailyMode ? '<span style="color:#e67e22;">[每日挑战]</span>' : ""
  }`;
}

function endQuiz() {
  // 更新最高分
  if (!isDailyMode && score > highestScore) {
    highestScore = score;
    localStorage.setItem("highestScore", highestScore);
  }
  // 排行榜
  if (isDailyMode) {
    dailyRecord[dailySeed] = { score, time: new Date().toLocaleString() };
    localStorage.setItem("dailyRecord", JSON.stringify(dailyRecord));
    rankList.push({
      time: `每日挑战 ${new Date().toLocaleDateString()}`,
      score,
    });
  } else {
    rankList.push({ time: new Date().toLocaleString(), score });
  }
  if (rankList.length > 10) rankList.shift();
  localStorage.setItem("rankList", JSON.stringify(rankList));
  // 展示结果
  document.getElementById(
    "quiz-container"
  ).innerHTML = `<h2>题目全都做完啦！</h2>
    <p>你的得分: <b>${score}</b> / ${questions.length}</p>
    <p>历史最高分: <b>${highestScore}</b></p>
    <button onclick="location.reload()">再来一次</button>
    <button onclick="showWrongBook()">错题本</button>
    <button onclick="showRank()">排行榜</button>
    <button onclick="showCollectBook()">我的收藏</button>
    <div id="extra-panel"></div>`;
}

function addWrongBook(q) {
  if (!wrongBook.find((item) => item.file === q.file)) {
    wrongBook.push(q);
    localStorage.setItem("wrongBook", JSON.stringify(wrongBook));
  }
}

function showWrongBook() {
  if (wrongBook.length === 0) {
    document.getElementById("extra-panel").innerHTML =
      "<p>错题本空空如也！</p>";
    return;
  }
  let html = "<h3>错题本</h3>";
  wrongBook.forEach((q, i) => {
    html += `<div>
      <img src="images/${q.file}" style="height:60px;">
      <b>${q.answer}</b> <button onclick="removeWrong(${i})">移除</button>
      <div style="font-size:12px;color:#666;">${q.desc || ""}</div>
    </div>`;
  });
  html += `<button onclick="startWrongBook()">错题再练</button>`;
  document.getElementById("extra-panel").innerHTML = html;
}

function removeWrong(idx) {
  wrongBook.splice(idx, 1);
  localStorage.setItem("wrongBook", JSON.stringify(wrongBook));
  showWrongBook();
}

function startWrongBook() {
  questions = shuffle([...wrongBook]);
  currentQuestionIndex = 0;
  score = 0;
  combo = 0;
  showQuestion();
  updateScore();
}

function toggleCollect() {
  const q = questions[currentQuestionIndex];
  if (isCollected(q)) {
    collectBook = collectBook.filter((item) => item.file !== q.file);
  } else {
    collectBook.push(q);
  }
  localStorage.setItem("collectBook", JSON.stringify(collectBook));
  document.getElementById("collect-button").textContent = isCollected(q)
    ? "已收藏"
    : "收藏";
}

function isCollected(q) {
  return collectBook.some((item) => item.file === q.file);
}

function showCollectBook() {
  if (collectBook.length === 0) {
    document.getElementById("extra-panel").innerHTML = "<p>暂无收藏！</p>";
    return;
  }
  let html = "<h3>我的收藏</h3>";
  collectBook.forEach((q, i) => {
    html += `<div>
      <img src="images/${q.file}" style="height:60px;">
      <b>${q.answer}</b>
      <div style="font-size:12px;color:#666;">${q.desc || ""}</div>
    </div>`;
  });
  document.getElementById("extra-panel").innerHTML = html;
}

function showRank() {
  let html = "<h3>排行榜（最近10次）</h3><ol>";
  rankList
    .slice(-10)
    .reverse()
    .forEach((item) => {
      html += `<li>${item.time} 得分: <b>${item.score}</b></li>`;
    });
  html += "</ol>";
  // 展示每日挑战成绩
  if (Object.keys(dailyRecord).length > 0) {
    html += `<h4 style="margin-top:10px;">每日挑战历史</h4><ul>`;
    Object.entries(dailyRecord)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 7)
      .forEach(([k, v]) => {
        html += `<li>${v.time} 得分: <b>${v.score}</b></li>`;
      });
    html += "</ul>";
  }
  document.getElementById("extra-panel").innerHTML = html;
}

// --------- 创新按钮区 ---------
function renderExtraPanel() {
  let html = "";
  // 每日挑战按钮
  html += `<button onclick="startDailyChallenge()" ${
    dailyRecord[dailySeed] ? "disabled" : ""
  } style="margin:5px 0 10px 0;background:#e67e22;">每日挑战</button>`;
  // 提示卡
  html += ` <button onclick="useHintCard()" ${
    hintUsed >= 3 ? "disabled" : ""
  } style="background:#16a085;">提示卡(${3 - hintUsed}次)</button>`;
  // 连对提示
  if (combo > 1) {
    html += `<div style="color:#e67e22;margin-top:8px;">当前连对：${combo}</div>`;
  }
  document.getElementById("extra-panel").innerHTML = html;
}

// 夜间模式
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const toggleButton = document.getElementById("dark-mode-toggle");
  toggleButton.textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : String.fromCodePoint(127769);
}

// 页面加载
window.onload = loadImages;
