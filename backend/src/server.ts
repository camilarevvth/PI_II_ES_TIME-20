import express, {Request, Response} from 'express';
import cors from 'cors';
import oracledb from 'oracledb';
import OracleDB from 'oracledb';

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

//  ||                    ||
//  ||                    ||
//--\/REGISTRO DE USUÁRIOS\/--

//cadastro
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

            confirm = true; //comfirmar que deu certo

        res.json({ //enviar para o front-end
            confirm,
            message : "cadastro realizado com sucesso"
        });

        await con.close();//fechar a conexão
    } catch(err){//erro(usuario já cadasstrado)

         res.status(500);

        res.json({
            confirm,
            message : "usuario já cadasstrado"
        });

        
    }

});

//login
app.post('/login', async (req:Request, res:Response) => {
    const email = req.body.email;
    const senha = req.body.senha;
        
    try{
        const con = await oracledb.getConnection();

        const result = await con.execute(`SELECT * FROM docentes WHERE email = :email AND senha = :senha`,
            {email, senha});

        if(result.rows.length > 0){
            return res.json({ mensagem : "sucesso ao fazer login1",
                usuario : result.rows[0]
             });
        }

        res.json({ mensagem : "email ou senha incorretos..."});
    } catch(err){
        console.error(err);
        res.status(500);
        res.json({ error: "Erro ao realizar login" });
    }
});

//  ||                             ||
//  ||                             ||
//--\/GERENCIAMENTO DE INSTITUIÇÕES\/--

//buscar todas as instituições
app.post('/buscartodasinstituicoes', async (req:Request, res:Response) => {
    const id_docente = req.body.id_docente;

    const con = await oracledb.getConnection();
    try{
        //obs: não sei o nome da tabela assosiativa de instituições para docentes(então substitui por doc_ins)
        const code:string = 'SELECT i.* FROM DOCENTES AS D INNER JOIN CADASTROS AS C ON D.ID_DOCENTE = C.ID_DOCENTE INNER JOIN INSTITUICOES AS I ON C.ID_INSTITUICAO = I.ID_INSTITUICAO WHERE D.ID_DOCENTE = :id_docente';
        const result = await con.execute(code, { id_docente });

        res.json({ instituicoes : result.rows });

    } catch(err){
        res.json({ message : "algo deu errado ao buscar instituições" });
    } finally{
        if(con){
            con.close();
        }
    }
});

//adicionar uma instituição
app.post('/adicionarinstituicao', async (req:Request, res:Response) => {
    const nome_instituicao = req.body.nome_instituicao;
    const con =  await oracledb.getConnection();
    let confirm:boolean = false;

    try{
        const code:string = 'INSERT INTO INSTITUICOES(NOME_INSTITUICAO) VALUES(:nome_instituicoes)'; 
        const result = await con.execute(code, { nome_instituicao });

        confirm = true;
        res.json({ confirm });
    } catch(err){

        res.json({ confirm });
    } finally{
        if(con){
            await con.close();
        }
    }
});

//excluir uma instituição
app.post('/excluirinstituicao', (req:Request, res:Response) => {
    
});

initconnection().then(() =>{
    app.listen(port, () => {
            console.log("servidor criado!-porta 3000");
        })
});

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