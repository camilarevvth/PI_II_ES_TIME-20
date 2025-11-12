import express, {Request, Response} from "express";
import bodyparser from "body-parser";
import cors from "cors";
import OracleDB from "oracledb";

const port = 3000;
const walletPath="";
const app = express();

app.use(cors());
app.use(express.json())

OracleDB.initOracleClient({configDir:walletPath});
//formato de saida dos dados
OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
const dbConfig = {
    user:"WEBAPP", 
    password: "notadez",
    connectString: "puc_high"
}




function open(){
    try{
        const connection = OracleDB.getConnection(dbConfig); //ela e assincrona pq o oracle ta em outro servidor, e nos estamos em outro
        console.log("Conexao OCI - aberta");
        return connection; //retorna o objeto connection aberto
        
    } catch(err){
        console.error("erro ao abrir a conexao com oracle", err);
        throw err;
    }
}

app.post('/cadastrarusuario', (req, res) => {
    const { nome, email, senha } = req.body;
    const existe:boolean = `SELECT COUNT(*) FROM DOCENTE WHERE EMAIL_DOCENTE = ${email}`;
    if(existe == true){
        console.log(`O e-mail já foi cadastrado. Tente novamente!`);
    }else{
        const cad = `INSERT INTO DOCENTE (NOME_DOCENTE, EMAIL_DOCENTE, SENHA) 
        VALUES(:${nome}, :${nome}, :${nome})`;
    }

<<<<<<< HEAD
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
=======
    //postar no banco
});

app.get('/login', (req: Request, res: Response) => {
    const { email, senha } = req.body;

    let existe = false;

    //buscar no banco de dados
>>>>>>> 1e5acfa51ff1ce02d053f9e57f8963203b0a5eed

    res.body.json({ existe });
});

app.listen(port, () => {
    console.log("servidor rodando na porta 3000");
});



async function close(connection: OracleDB.Connection){
    try{//tentar fechar a conexao
        await connection.close();
        console.log("Conexao OCI - fechada");


    }catch(err){
        console.log("erro de conexao com o oracle", err);
    }
}

