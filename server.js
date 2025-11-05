const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Conexão com o banco
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Desillu2604.',
  database: 'piteste'
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado ao MySQL!');
});

// Servir arquivos HTML
app.use(express.static('public'));

// Rota para buscar dados
app.get('/dados', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
