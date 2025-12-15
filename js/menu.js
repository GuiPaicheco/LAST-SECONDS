const playBtn = document.getElementById('play');
const rankingBtn = document.getElementById('ranking');
const aboutBtn = document.getElementById('about');
const input = document.getElementById('playerName');

playBtn.addEventListener('click', () => {
  const name = input.value.trim();

  if (!name) {
    alert('Digite seu nome');
    return;
  }

  localStorage.setItem('playerName', name);
  location.href = 'pages/game.html';
});

rankingBtn.addEventListener('click', () => {
  location.href = 'pages/ranking.html';
});

aboutBtn.addEventListener('click', () => {
  location.href = 'pages/about.html';
});
