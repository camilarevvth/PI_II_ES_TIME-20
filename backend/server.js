const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(json());
app.use(cors());

app.post('/cadastrarusuario', (req, res) => {
    const { nome, email, senha } = req.body;

    //postar no banco
});

app.get('/login', () => {
    const { email, senha } = req.body;

    let existe = false;

    //buscar no banco de dados

    res.body = json({ existe });
});

app.listen(port, () => {
    console.log("servidor rodando na porta 3000");
});