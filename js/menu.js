document.getElementById('play').onclick=()=>{
  const name=document.getElementById('playerName').value.trim();
  if(!name) return alert('Digite seu nome');
  localStorage.setItem('playerName',name);
  location.href='pages/game.html';
};
