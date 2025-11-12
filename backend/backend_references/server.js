const express = require('express');
const cors = require('cors');
const sql = require('mysql');
const app = express();
const port = 3000;
const database = sql.createConnection({
    host: "",
    user: "",
    password: "",
    database: ""
});

app.use(express.json());
app.use(cors());

database.connect((err) => {
    if(err){
        console.log("erro ao conectar com o banco...");
    } else {
        console.log("banco conectado com sucesso!");
    }
});

app.post('/cadastrarusuario', (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const celular = req.body.celular;
    const senha = req.body.senha;

    let user;

    database.query('INSERT INTO usuarios(nome, email, celular, senha) VALUES(?, ?, ?, ?)', 
        [nome, email, celular, senha],
        (err, result) => {
            if(err){
                res.status(501);
                res.json({message : "não foi possivel cadastrar o úsuario..."});

                return
            }

            res.json({
                message : "úsuario cadastrado com sucesso!"});
        });
});

app.post('/login', () => {
    const email = req.body.email;
    const senha = req.body.senha;

    let existe = false;

    const rows = database.query('SELECT * FROM usuarios');

    for(let i = 0; i < rows.length; i++){
        if(rows[i].email == email){
            if(row[i].senha == senha){
                existe = true;
            } else {
                res.status(500);
                res.json({ message : "senha incorreta" });
            }
        }
    }

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