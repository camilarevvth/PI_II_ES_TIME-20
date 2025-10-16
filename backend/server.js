const express = require('express');
const cors = require('cors');
const sql = require('mysql');
const app = express();
const port = 3000;
const conection = sql.createConnection({
    host: "",
    user: "",
    password: "",
    database: ""
});

app.use(express.json());
app.use(cors());

app.post('/cadastrarusuario', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const celular = req.body.celular;
    const senha = req.body.senha;

    
});

app.get('/login', () => {
    const email = req.body.email;

    let existe = false;

    //buscar

    res.json({ existe });
});

app.listen(port, () => {
    console.log(`servidor rodando na porta ${port}`);
});

//front
const email = '';
const senha = '';

const data = await fetch('/cadastro', {
    method: 'POST',
    headers: {
        'content-type': 'application.json'
    },
    body: JSON.stringify({email, senha})
});