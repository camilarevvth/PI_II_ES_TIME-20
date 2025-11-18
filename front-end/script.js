/*
    Autor: Gustavo Santos de Oliveira
    Arquivo: server.ts
    Descrição: API RESTful utilizando Express e TypeScript para conectar-se ao Oracle DB,
               gerenciando autenticação de docentes e a estrutura de Instituições, Cursos e Disciplinas.
*/

// Importa o framework Express para criar o servidor web e as tipagens Request e Response
import express, { Request, Response } from 'express';

// Importa o CORS para permitir requisições de origens diferentes
import cors from 'cors';

// Importa o driver OracleDB para conectar ao banco Oracle
import * as oracledb from 'oracledb';

// Cria a aplicação Express
const app = express();

// Define a porta onde o servidor vai rodar
const port: number = 3000;

// Função assíncrona para inicializar a conexão com o Oracle e criar o Pool de Conexões
async function initconnection() {
    try {
        // Inicializa o cliente Oracle no caminho especificado localmente
        oracledb.initOracleClient({
            libDir: "C:/client_oracle/instantclient-basiclite-windows.x64-23.9.0.25.07/instantclient_23_9"
        });
    } catch (err) {
        // Se o cliente já estiver inicializado ou ocorrer outro erro, apenas loga
        console.log("já inicializado ou erro");
        console.log(err);
    }

    // Cria e retorna o pool de conexões com as credenciais e parâmetros de conexão
    return await oracledb.createPool({
        user: "NOTADEZ",               // Usuário do banco
        password: "secretmypass",      // Senha (em produção, deve vir de variáveis de ambiente)
        connectString: "localhost:1521/XEPDB1", // String de conexão
        poolMin: 1,                    // Número mínimo de conexões
        poolMax: 5,                    // Número máximo de conexões
        poolIncrement: 1               // Incremento de conexões quando necessário
    });
}

// ------------------ MIDDLEWARES ------------------

// Permite que a API processe corpos de requisição JSON
app.use(express.json());

// Habilita o CORS para permitir requisições de outras origens
app.use(cors());

// ------------------ ROTAS DE USUÁRIO ------------------

// Rota de Cadastro de Docente
app.post('/cadastrar', async (req, res) => {
    // Recebe dados do corpo da requisição
    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;
    const telefone = req.body.telefone;

    // Inicializa flag de confirmação e conexão
    let confirm: boolean = false;
    let con = null;

    try {
        // Obtém uma conexão do pool
        con = await oracledb.getConnection();

        // Executa a query de inserção do docente
        const resultado = await con.execute(
            `INSERT INTO NOTADEZ.DOCENTES(NOME_DOCENTE, EMAIL_DOCENTE, SENHA, TELEFONE_DOCENTE) VALUES(:nome, :email, :senha, :telefone)`,
            { nome, email, senha, telefone }, // Parâmetros da query
            { autoCommit: true }              // Commit automático
        );

        // Marca cadastro como realizado
        confirm = true;

        // Retorna resposta JSON para o front-end
        res.json({
            confirm,
            message: "cadastro realizado com sucesso"
        });

    } catch (err) {
        // Em caso de erro, loga no console e retorna status 500
        console.error("Erro no cadastro:", err);
        res.status(500);
        res.json({
            confirm,
            message: "erro ao cadastrar: " + (err instanceof Error ? err.message : "usuario já cadastrado")
        });
    } finally {
        // Sempre fecha a conexão
        if (con) {
            await con.close();
        }
    }
});

// Rota de Login de Docente
app.post('/login', async (req: Request, res: Response) => {
    const email = req.body.email;
    const senha = req.body.senha;
    let con = null;

    try {
        // Obtém conexão do pool
        con = await oracledb.getConnection();

        // Executa query para verificar se usuário existe
        const result = await con.execute(
            `SELECT * FROM NOTADEZ.DOCENTES WHERE EMAIL_DOCENTE = :email AND SENHA = :senha`,
            { email, senha }
        );

        // Se encontrou algum usuário, retorna sucesso
        if (result.rows!.length > 0) {
            return res.json({
                mensagem: "sucesso ao fazer login",
                confirm: true,
                usuario: result.rows![0] // Retorna o primeiro usuário encontrado
            });
        }

        // Se não encontrou usuário
        res.json({
            confirm: false,
            mensagem: "email ou senha incorretos..."
        });
    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500);
        res.json({ error: "Erro ao realizar login" });
    }
});
