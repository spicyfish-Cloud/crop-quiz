let currentQuestionIndex = 0;
let images = [];
let answerMode = false; // 默认不在看答案模式

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const toggleButton = document.getElementById('dark-mode-toggle');
    toggleButton.textContent = document.body.classList.contains('dark-mode') ? '☀️' : String.fromCodePoint(127769);
}

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadImages() {
  fetch("images.json")
    .then((response) => response.json())
    .then((data) => {
      images = shuffle(data);
      showQuestion();
    });
}

function showQuestion() {
  if (currentQuestionIndex < images.length) {
    const imgElement = document.getElementById("quiz-image");
    imgElement.src = `images/${images[currentQuestionIndex]}`;
    document.getElementById("answer-input").value = "";
    document.getElementById("result").textContent = "";
    document.getElementById("result").className = "result";

    if (answerMode) {
      const correctAnswer = images[currentQuestionIndex].split(".")[0];
      document.getElementById(
        "result"
      ).textContent = `正确答案: ${correctAnswer}`;
      document.getElementById("result").className = "result correct";
      document.getElementById("submit-button").style.display = "none";
    } else {
      document.getElementById("submit-button").style.display = "inline-block";
    }
  } else {
    document.getElementById("quiz-container").innerHTML =
      "<h2>题目全都做完啦！刷新页面再来一次吧</h2>";
  }
}

function submitAnswer() {
  const userAnswer = document.getElementById("answer-input").value.trim();
  const correctAnswer = images[currentQuestionIndex].split(".")[0]; // answer.ext

  const resultElement = document.getElementById("result");
  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
    resultElement.textContent = "对!";
    resultElement.className = "result correct";
  } else {
    resultElement.textContent = `错! 正确答案: ${correctAnswer}`;
    resultElement.className = "result incorrect";
  }
}

function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

function toggleAnswerMode() {
  answerMode = !answerMode;
  showQuestion(); // 切换模式时重新显示当前问题
}

function closeDonationWindow() {
    document.getElementById('donation-float').style.display = 'none';
}

window.onload = loadImages;
