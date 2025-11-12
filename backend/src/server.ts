import express, {Request, Response} from 'express';
import cors from 'cors';
import oracledb from 'oracledb';

const app = express();
const port:number = 3000;

async function initconnection(){ 
try{
    oracledb.initOracleClient({
        libDir : "C:"
    });
} catch (err){
    console.log("já inicializado ou erro");
}

return await oracledb.createPool({
        user: "",
        password: "",
        connectString: "",
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1
    });
}

app.use(express.json());
app.use(cors());

//  ||        ||
//  ||        ||
//--\/CADASTRO\/--

app.post('/cadastrar', async (req : Request, res : Response) => {
    //buscar os dados do front-end
    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;
    const telefone = req.body.telefone;

    let confirm : boolean = false;

    try{
        const con = await oracledb.getConnection();

        const resultado = await con.execute(`INSERT INTO docentes(nome, email, senha, telefone) VALUES(:nome, :email, :senha, :telefone)`, //execução da conexão e do comando sql(oracle)
             {nome, email, senha, telefone}, //foranecer os dados necessarios
            {autoCommit : true}); //salvar a alteração no banco

            confirm = true; //compirmar que deu certo

        res.json({ //enviar para o front-end
            confirm,
            message : "cadastro realizado com sucesso"
        });

        await con.close();//fechar a conexão
    } catch(err){//erro(usuario já cadasstrado)

         res.status(500);

        res.json({
            confirm,
            error : "usuario já cadasstrado"
        });

        
    }

});

//  ||     ||
//  ||     ||
//--\/LOGIN\/--

app.post('/login', async (req:Request, res:Response) => {
    const email = req.body.email;
    const senha = req.body.senha;
        
    try{
        const con = await oracledb.getConnection();

        const resultado = await con.execute(`SELECT * FROM usuarios WHERE email = :email AND senha = :senha`,
            {email, senha});

        if(resultado.rows.length > 0){
            return res.json({ mensagem : "sucesso ao fazer login1",
                usuario : resultado.rows[0]
             });
        }

        res.json({ mensagem : "email ou senha incorretos..."});
    } catch(err){
        console.error(err);
        res.status(500);
        res.json({ error: "Erro ao realizar login" });
    }
});

initconnection().then(
    app.listen(port, () => {
            console.log("servidor criado!-porta 3000");
        })
);

/*
//-----------ANOTAÇÕES-----------//
__códigos de status http:

2xx: requisições bem sucedidas
200: ok, requisição encontrada
201: recurso criado com sucesso
202: recurso aceito para procedimento
204: bem sucedido, mas não tem recursos(por exemplo: get)

4xx: erros ao solicitar requisição, não podem ser processadas
400: requisição encontrada, mas há erros de sintax ou formatação
401: requisição encontrada, mas mas não foi aceita(ex: senha incorreta)
403: requisição encontrada, mas o servidor se recusa a aceitar, diferente de 401(autenticação) o úsuario apenas não tem permissão para entrar
404: a requisição não foi encontrada(não chegou ao servidor por falha na conexão com a internet por exemplo)

5xx: erros do próprio servidor
500: erro genérico(como de sintax)
501: o servidor não possui ou não suporta uma função necessária para a requisição
503: o servidor está em manutenção
*/