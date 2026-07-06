// Global state
let currentUser = null;
let token = null;
let game = null;
let board = null;
let isGameStarted = false;
let isPlayerTurn = true; // true = white (player), false = black (AI)

// DOM refs
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const gameSection = document.getElementById('game-section');
const usernameDisplay = document.getElementById('username-display');
const startGameBtn = document.getElementById('start-game-btn');
const boardContainer = document.getElementById('board-container');
const statusDiv = document.getElementById('status');
const newGameBtn = document.getElementById('new-game-btn');

// API base – Kubernetes internal service name
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'http://backend-service:5000';

// Toggle forms
document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});
document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// Register
document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  if (!username || !email || !password) {
    alert('All fields required');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Registered! Please login.');
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (err) {
    alert('Cannot reach server');
  }
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!username || !password) {
    alert('Username and password required');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUser = data.username;
      usernameDisplay.textContent = currentUser;
      loginForm.style.display = 'none';
      registerForm.style.display = 'none';
      gameSection.style.display = 'block';
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Cannot reach server');
  }
});

// Start / New Game
startGameBtn.addEventListener('click', () => {
  startGameBtn.style.display = 'none';
  boardContainer.style.display = 'block';
  initGame();
});
newGameBtn.addEventListener('click', initGame);

function initGame() {
  game = new Chess();
  isGameStarted = true;
  isPlayerTurn = true;
  statusDiv.textContent = 'Your turn (White)';
  if (board) board.destroy();
  board = ChessBoard('board', {
    position: 'start',
    draggable: true,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  });
}

function onDrop(source, target) {
  if (!isGameStarted || game.game_over() || !isPlayerTurn) return 'snapback';

  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });
  if (move === null) return 'snapback';

  board.position(game.fen());
  updateStatus();

  isPlayerTurn = false;
  setTimeout(makeAIMove, 300);
}

function onSnapEnd() {}

function updateStatus() {
  if (game.in_checkmate()) {
    const msg = game.turn() === 'w' ? 'You lost!' : 'You won!';
    statusDiv.textContent = `Checkmate! ${msg}`;
    alert(msg === 'You won!' ? '🎉 You won the match!' : '😞 You lost the match, try again.');
    isGameStarted = false;
    return;
  } else if (game.in_draw()) {
    statusDiv.textContent = 'Draw!';
    alert('Draw!');
    isGameStarted = false;
    return;
  } else if (game.in_check()) {
    statusDiv.textContent = (game.turn() === 'w' ? 'White' : 'Black') + ' is in check.';
  } else {
    statusDiv.textContent = (game.turn() === 'w' ? 'White' : 'Black') + ' to move.';
  }
}

// AI – random legal move
function makeAIMove() {
  if (!isGameStarted || game.game_over()) return;
  if (isPlayerTurn) return;

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return;

  const randomIdx = Math.floor(Math.random() * moves.length);
  const aiMove = moves[randomIdx];
  game.move(aiMove);
  board.position(game.fen());
  updateStatus();

  isPlayerTurn = true;
  if (!game.game_over()) {
    statusDiv.textContent = 'Your turn (White)';
  }
}
