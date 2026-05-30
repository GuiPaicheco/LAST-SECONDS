firebase.initializeApp({
  apiKey: "AIzaSyDl0JlnyPw6zSVn-C6JWnp_rEJh1ZfcoSE",
  authDomain: "last-seconds.firebaseapp.com",
  projectId: "last-seconds"
});

const db = firebase.firestore();
const list = document.getElementById('rankingList');

function carregarRanking() {
  list.innerHTML = '';

  db.collection('ranking')
    .orderBy('tempo', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      let pos = 1;

      snapshot.forEach(doc => {
        const d = doc.data();
        const li = document.createElement('li');

        li.innerHTML = `
          <span>${String(pos).padStart(2, '0')}</span>
          <span>${(d.nome || 'SEM NOME').toUpperCase()}</span>
          <span>${Number(d.tempo || 0).toFixed(2)}s</span>
        `;

        list.appendChild(li);
        pos++;
      });
    })
    .catch(error => {
      console.error('Erro ao carregar ranking:', error);
    });
}

carregarRanking();
setInterval(carregarRanking, 10000);