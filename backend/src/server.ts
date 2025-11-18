
/*
    Autor: Gustavo Santos de Oliveira
    Arquivo: server.ts
    Descrição: API RESTful utilizando Express e TypeScript para conectar-se ao Oracle DB,
               gerenciando autenticação de docentes e a estrutura de Instituições, Cursos e Disciplinas.
*/

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as oracledb from 'oracledb';

const app = express();
const port: number = 3000;

// Função assíncrona para inicializar a conexão com o Oracle e criar o Pool de Conexões
async function initconnection() {
    try {
        // Inicializa o cliente Oracle no caminho local especificado
        oracledb.initOracleClient({
            libDir: "C:/client_oracle/instantclient-basiclite-windows.x64-23.9.0.25.07/instantclient_23_9"
        });
    } catch (err) {
        // Captura e loga erro se o cliente já estiver inicializado ou se houver outro erro
        console.log("já inicializado ou erro");
        console.log(err);
    }

    // Cria e retorna o pool de conexões com as credenciais especificadas
    return await oracledb.createPool({
        user: "NOTADEZ",
        password: "secretmypass", // Mantenha senhas em variáveis de ambiente em produção!
        connectString: "localhost:1521/XEPDB1",
        poolMin: 1, // Mínimo de conexões no pool
        poolMax: 5, // Máximo de conexões no pool
        poolIncrement: 1 // Conexões a adicionar quando necessário
    });
}

// Middlewares:
app.use(express.json()); // Permite que a API processe corpos de requisição JSON
app.use(cors()); // Habilita o CORS para permitir requisições de outras origens

//  ||                       ||
//  ||                       ||
//--\/ REGISTRO DE USUÁRIOS \/--

// Rota de Cadastro de Docente
app.post('/cadastrar', async (req, res) => {
    // Buscar os dados do front-end
    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;
    const telefone = req.body.telefone;

    let confirm: boolean = false;
    let con = null;

    try {
        // Obtém uma conexão do Pool
        con = await oracledb.getConnection();

        const resultado = await con.execute(`INSERT INTO NOTADEZ.DOCENTES(NOME_DOCENTE, EMAIL_DOCENTE, SENHA, TELEFONE_DOCENTE) VALUES(:nome, :email, :senha, :telefone)`, //execução da conexão e do comando sql(oracle)
            { nome, email, senha, telefone }, //foranecer os dados necessarios
            { autoCommit: true }); //salvar a alteração no banco

        confirm = true;

        res.json({
            confirm,
            message: "cadastro realizado com sucesso"
        });

    } catch (err) {
        console.error("Erro no cadastro:", err);
        res.status(500); // Retorna status de erro interno do servidor
        res.json({
            confirm,
            message: "erro ao cadastrar: " + (err instanceof Error ? err.message : "usuario já cadastrado")
        });
    } finally {
        // SEMPRE fecha a conexão no final
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
        con = await oracledb.getConnection();

        const result = await con.execute(`SELECT * FROM NOTADEZ.DOCENTES WHERE EMAIL_DOCENTE = :email AND SENHA = :senha`,
            { email, senha });

        // Verifica se algum registro foi retornado
        if (result.rows!.length > 0) {
            return res.json({
                mensagem: "sucesso ao fazer login",
                confirm: true,
                usuario: result.rows![0] // Retorna o primeiro (e único) usuário encontrado
            });
        }

        // Se nenhum registro for encontrado
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

//  ||                             ||
//  ||                             ||
//--\/GERENCIAMENTO DE INSTITUIÇÕES\/--

//adicionar instituição
app.post('/adicionarinstituicao', async (req: Request, res: Response) => {
    const { nome_instituicao, id_usuario } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Inserir instituição
        const insertSQL = `
            INSERT INTO NOTADEZ.INSTITUICOES (NOME_INSTITUICAO)
            VALUES (:nome_instituicao)
        `;

        await con.execute(insertSQL, { nome_instituicao }, { autoCommit: true });

        // Buscar ID da instituição criada
        const selectSQL = `
            SELECT ID_INSTITUICAO
            FROM NOTADEZ.INSTITUICOES
            WHERE NOME_INSTITUICAO = :nome_instituicao
        `;

        const idResult = await con.execute(selectSQL, { nome_instituicao });
        const rows = idResult.rows as any[];

        if (!rows || rows.length === 0) {
            throw new Error("Erro ao recuperar ID da instituição recém criada");
        }

        const id_instituicao = rows[0][0];

        // Criar relacionamento com docente
        const relationSQL = `
            INSERT INTO NOTADEZ.CADASTRO (ID_INSTITUICAO, ID_DOCENTE)
            VALUES (:id_instituicao, :id_usuario)
        `;

        await con.execute(relationSQL, { id_instituicao, id_usuario }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Instituição adicionada com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar instituição:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar instituição ou instituição já existe" });
    } finally {
        if (con) await con.close();
    }
});

//excluir instituição
app.post('/excluirinstituicao', async (req: Request, res: Response) => {
    const { nome_instituicao, id_usuario } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar ID da instituição
        const selectSQL = `
            SELECT ID_INSTITUICAO
            FROM NOTADEZ.INSTITUICOES
            WHERE NOME_INSTITUICAO = :nome_instituicao
        `;

        const idResult = await con.execute(selectSQL, { nome_instituicao });
        const rows = idResult.rows as any[];

        if (!rows || rows.length === 0) {
            return res.json({ confirm: false, message: "Instituição não encontrada" });
        }

        const id_instituicao = rows[0][0];

        // Verificar se tem cursos cadastrados
        const verificarSQL = `
            SELECT COUNT(*) FROM NOTADEZ.CURSOS
            WHERE ID_INSTITUICAO = :id_instituicao
        `;

        const verificarCursos = await con.execute(verificarSQL, { id_instituicao });
        const cursosRows = verificarCursos.rows as any[];

        if (cursosRows[0][0] > 0) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir instituição que possui cursos cadastrados"
            });
        }

        // Remover relacionamento
        await con.execute(
            `DELETE FROM NOTADEZ.CADASTRO WHERE ID_INSTITUICAO = :id_instituicao AND ID_DOCENTE = :id_usuario`,
            { id_instituicao, id_usuario },
            { autoCommit: true }
        );

        // Remover instituição
        await con.execute(
            `DELETE FROM NOTADEZ.INSTITUICOES WHERE ID_INSTITUICAO = :id_instituicao`,
            { id_instituicao },
            { autoCommit: true }
        );

        confirm = true;
        res.json({ confirm, message: "Instituição excluída com sucesso" });

    } catch (err) {
        console.error("Erro ao excluir instituição:", err);
        res.status(500).json({ confirm, message: "Erro ao excluir instituição" });
    } finally {
        if (con) await con.close();
    }
});

//buscar instituições
app.post('/buscarinstituicoes', async (req: Request, res: Response) => {
    const id_docente = req.body.id_docente;
    let con: oracledb.Connection | null = null;

    try{
        con = await oracledb.getConnection();
        const sql = `SELECT * FROM NOTADEZ.INSTITUICOES I
        JOIN NOTADEZ.CADASTRO C ON I.id_instituicao = C.id_instituicao
        JOIN NOTADEZ.DOCENTES D ON C.id_docente = D.id_docente
        WHERE C.id_docente = :id_docente`;

        const resultado = await con.execute(sql, { id_docente });
        res.json({ rows: resultado.rows });
    } catch(err){
        console.log(err);
        res.status(500).json({ message: "Erro ao buscar instituições" });
    } finally{
        if(con){
            await con.close();
        }
    }
});

//  ||                           ||
//  ||                           ||
//--\/ GERENCIAMENTO DE INSTITUIÇÕES \/--

// Rota para buscar todas as instituições associadas a um docente
app.post('/buscartodasinstituicoes', async (req: Request, res: Response) => {
    const id_docente = req.body.id_docente;
    let con = null;

    try {
        con = await oracledb.getConnection();

        // Comando SQL que faz JOIN entre DOCENTE, CADASTROS e INSTITUICOES para retornar
        // todas as instituições onde o docente está cadastrado.
        const comando: string = `SELECT I.* FROM NOTADEZ.DOCENTE D 
                                     INNER JOIN NOTADEZ.CADASTROS C ON D.ID_DOCENTE = C.ID_DOCENTE 
                                     INNER JOIN NOTADEZ.INSTITUICOES I ON C.ID_INSTITUICAO = I.ID_INSTITUICAO 
                                     WHERE D.ID_DOCENTE = :id_docente`;
        const result = await con.execute(comando, { id_docente });

        res.json({ rows: result.rows });

    } catch (err) {
        console.error("Erro ao buscar instituições:", err);
        res.status(500);
        res.json({ message: "algo deu errado ao buscar instituições" });
    } finally {
        if (con) {
            await con.close();
        }
    }
});


// Rota para adicionar uma nova instituição e relacioná-la ao docente
app.post('/adicionarinstituicao', async (req: Request, res: Response) => {
    // Desestruturação dos dados recebidos
    const { nome_instituicao, id_usuario: id_docente } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Inserir a instituição diretamente
        const insertSQL = `
            INSERT INTO NOTADEZ.INSTITUICOES (NOME_INSTITUICAO, ID_DOCENTE)
            VALUES (:nome_instituicao, :id_docente)
        `;

        await con.execute(insertSQL, { nome_instituicao, id_docente }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Instituição adicionada com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar curso:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar curso" });

    } finally {
        if (con) await con.close();
    }
});


// Rota para excluir um curso
app.post('/excluircurso', async (req: Request, res: Response) => {
    const { nome_cur, id_ins } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar ID do curso pelo nome
        const selectSQL = `
            SELECT ID_CURSO FROM NOTADEZ.CURSOS
            WHERE NOME_CURSO = :nome_cur
        `;

        const idResult = await con.execute(selectSQL, { nome_cur });
        const idRows = idResult.rows as any[];

        if (!idRows || idRows.length === 0) {
            return res.json({ confirm: false, message: "Curso não encontrado" });
        }

        const id_curso = idRows[0][0];

        const verificarSQL = `
            SELECT COUNT(*) FROM NOTADEZ.DISCIPLINAS
            WHERE ID_CURSO = :id_curso
        `;

        const verificarDisciplinas = await con.execute(verificarSQL, { id_curso });
        const rows = verificarDisciplinas.rows as any[];

        const temDisciplinas = rows[0][0] > 0;

        if (temDisciplinas) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir curso que possui disciplinas cadastradas"
            });
        }

        // Verificar se o curso pertence à instituição antes de excluir
        const verificarInstSQL = `
            SELECT COUNT(*) FROM NOTADEZ.CURSOS
            WHERE ID_CURSO = :id_curso AND ID_INSTITUICAO = :id_ins
        `;
        const verificarInst = await con.execute(verificarInstSQL, { id_curso, id_ins });
        const instRows = verificarInst.rows as any[];
        
        if (instRows[0][0] === 0) {
            return res.json({ confirm: false, message: "Curso não pertence a esta instituição" });
        }

        // 3. Remove o curso da tabela CURSOS
        const deleteSQL = `
            DELETE FROM NOTADEZ.CURSOS
            WHERE ID_CURSO = :id_curso
        `;

        await con.execute(deleteSQL, { id_curso }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Curso excluído com sucesso" });

    } catch (err) {
        console.error("Erro ao excluir curso:", err);
        res.status(500).json({ confirm, message: "Erro ao excluir curso" });

    } finally {
        if (con) await con.close();
    }
});

//buscar cursos
app.post('/buscarcursos', async (req: Request, res: Response) => {
    const { id_ins } = req.body;
    let con: oracledb.Connection | null = null;

    try {
        con = await oracledb.getConnection();

        const sql = `
            SELECT C.* FROM NOTADEZ.CURSOS C
            WHERE C.ID_INSTITUICAO = :id_ins
        `;

        const resultado = await con.execute(sql, { id_ins });
        res.json({ rows: resultado.rows });

    } catch (err) {
        console.error("Erro ao buscar cursos:", err);
        res.status(500).json({ message: "Erro ao buscar cursos" });
    } finally {
        if (con) await con.close();
    }
});

//apagar curso (alias para compatibilidade)
app.post('/apagarcurso', async (req: Request, res: Response) => {
    // Chama a mesma lógica de excluircurso
    const { nome_cur, id_ins } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        const selectSQL = `
            SELECT ID_CURSO FROM NOTADEZ.CURSOS
            WHERE NOME_CURSO = :nome_cur
        `;

        const idResult = await con.execute(selectSQL, { nome_cur });
        const idRows = idResult.rows as any[];

        if (!idRows || idRows.length === 0) {
            return res.json({ confirm: false, message: "Curso não encontrado" });
        }

        const id_curso = idRows[0][0];

        const verificarSQL = `
            SELECT COUNT(*) FROM NOTADEZ.DISCIPLINAS
            WHERE ID_CURSO = :id_curso
        `;

        const verificarDisciplinas = await con.execute(verificarSQL, { id_curso });
        const rows = verificarDisciplinas.rows as any[];

        if (rows[0][0] > 0) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir curso que possui disciplinas cadastradas"
            });
        }

        // Verificar se o curso pertence à instituição antes de excluir
        const verificarInstSQL = `
            SELECT COUNT(*) FROM NOTADEZ.CURSOS
            WHERE ID_CURSO = :id_curso AND ID_INSTITUICAO = :id_ins
        `;
        const verificarInst = await con.execute(verificarInstSQL, { id_curso, id_ins });
        const instRows = verificarInst.rows as any[];
        
        if (instRows[0][0] === 0) {
            return res.json({ confirm: false, message: "Curso não pertence a esta instituição" });
        }

        const deleteSQL = `
            DELETE FROM NOTADEZ.CURSOS
            WHERE ID_CURSO = :id_curso
        `;

        await con.execute(deleteSQL, { id_curso }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Curso excluído com sucesso" });

    } catch (err) {
        console.error("Erro ao excluir curso:", err);
        res.status(500).json({ confirm, message: "Erro ao excluir curso" });
    } finally {
        if (con) await con.close();
    }
});


//buscar disciplinas
app.post('/buscardisciplinas', async (req: Request, res: Response) => {
    const { id_cur, nome_dis } = req.body;
    let con: oracledb.Connection | null = null;

    try {
        con = await oracledb.getConnection();

        let comando: string = `SELECT D.* FROM NOTADEZ.DISCIPLINAS D 
                                 WHERE D.ID_CURSO = :id_cur`;
        
        const binds: any = { id_cur };
        
        if (nome_dis) {
            comando += ` AND D.NOME_DISCIPLINA = :nome_dis`;
            binds.nome_dis = nome_dis;
        }
        
        const resultado = await con.execute(comando, binds);

        res.json({ disciplinas: resultado.rows, rows: resultado.rows });

    } catch (err) {
        console.error("Erro ao buscar disciplinas:", err);
        res.status(500).json({ message: "Erro ao buscar disciplinas" });
    } finally {
        if (con) {
            await con.close();
        }
    }
});

// Rota para adicionar uma nova disciplina
app.post('/adicionardisciplina', async (req: Request, res: Response) => {
    const { id_cur, nome_dis, sigla_dis = '', codigo_dis = '', periodo_dis = '' } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar id_instituicao do curso
        const selectCursoSQL = `
            SELECT ID_INSTITUICAO
            FROM NOTADEZ.CURSOS
            WHERE ID_CURSO = :id_cur
        `;
        const cursoResult = await con.execute(selectCursoSQL, { id_cur });
        const cursoRows = cursoResult.rows as any[];

        if (!cursoRows || cursoRows.length === 0) {
            throw new Error("Curso não encontrado");
        }

        // Inserir disciplina diretamente com id_curso
        const insertSQL = `
            INSERT INTO NOTADEZ.DISCIPLINAS (NOME_DISCIPLINA, SIGLA_DISCIPLINA, PERIODO, ID_CURSO)
            VALUES (:nome_dis, :sigla_dis, :periodo_dis, :id_cur)
        `;

        await con.execute(insertSQL, { nome_dis, sigla_dis, periodo_dis, id_cur }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Disciplina adicionada com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar disciplina:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar disciplina ou disciplina já existe" });

    } finally {
        if (con) await con.close();
    }
});

// Rota para excluir uma disciplina
app.post('/excluirdisciplina', async (req: Request, res: Response) => {
    const { nome_dis, id_cur } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar ID da disciplina pelo nome
        const selectSQL = `
            SELECT ID_DISCIPLINA FROM NOTADEZ.DISCIPLINAS
            WHERE NOME_DISCIPLINA = :nome_dis AND ID_CURSO = :id_cur
        `;

        const idResult = await con.execute(selectSQL, { nome_dis, id_cur });
        const idRows = idResult.rows as any[];

        if (!idRows || idRows.length === 0) {
            return res.json({ confirm: false, message: "Disciplina não encontrada" });
        }

        const id_disciplina = idRows[0][0];

        // Verifica se a disciplina tem turmas cadastradas
        const verificarTurmasSQL = `
            SELECT COUNT(*) 
            FROM NOTADEZ.TURMA_DISCIPLINA 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;

        const verificarTurmas = await con.execute(verificarTurmasSQL, { id_disciplina });
        const rows = verificarTurmas.rows as any[];

        const temTurmas = rows && rows.length > 0 && rows[0][0] > 0;

        if (temTurmas) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir disciplina que possui turmas cadastradas"
            });
        }

        // Remove disciplina (a foreign key id_curso já garante a relação)
        const deleteDisciplinaSQL = `
            DELETE FROM NOTADEZ.DISCIPLINAS 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;
        await con.execute(deleteDisciplinaSQL, { id_disciplina }, { autoCommit: true });

        confirm = true;
        return res.json({ confirm, message: "Disciplina excluída com sucesso" });

    } catch (err) {
        console.error("Erro ao excluir disciplina:", err);
        return res.status(500).json({ confirm, message: "Erro ao excluir disciplina" });

    } finally {
        if (con) await con.close();
    }
});

//apagar disciplina (alias para compatibilidade)
app.post('/apagardisciplina', async (req: Request, res: Response) => {
    // Chama a mesma lógica de excluirdisciplina
    const { nome_dis, id_cur } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        const selectSQL = `
            SELECT ID_DISCIPLINA FROM NOTADEZ.DISCIPLINAS
            WHERE NOME_DISCIPLINA = :nome_dis AND ID_CURSO = :id_cur
        `;

        const idResult = await con.execute(selectSQL, { nome_dis, id_cur });
        const idRows = idResult.rows as any[];

        if (!idRows || idRows.length === 0) {
            return res.json({ confirm: false, message: "Disciplina não encontrada" });
        }

        const id_disciplina = idRows[0][0];

        const verificarTurmasSQL = `
            SELECT COUNT(*) 
            FROM NOTADEZ.TURMA_DISCIPLINA 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;

        const verificarTurmas = await con.execute(verificarTurmasSQL, { id_disciplina });
        const rows = verificarTurmas.rows as any[];

        if (rows && rows.length > 0 && rows[0][0] > 0) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir disciplina que possui turmas cadastradas"
            });
        }

        const deleteDisciplinaSQL = `
            DELETE FROM NOTADEZ.DISCIPLINAS 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;
        await con.execute(deleteDisciplinaSQL, { id_disciplina }, { autoCommit: true });

        confirm = true;
        return res.json({ confirm, message: "Disciplina excluída com sucesso" });

    } catch (err) {
        console.error("Erro ao excluir disciplina:", err);
        return res.status(500).json({ confirm, message: "Erro ao excluir disciplina" });
    } finally {
        if (con) await con.close();
    }
});

// Rota para buscar todas as turmas associadas a uma disciplina
app.post('/buscarturmas', async (req: Request, res: Response) => {
    const id_dis = req.body.id_dis; // ID da Disciplina
    let con = null;

    try {// Obtém a conexão com o banco Oracle
con = await oracledb.getConnection();

        const comando: string = `SELECT T.* FROM NOTADEZ.TURMAS T 
                                 INNER JOIN NOTADEZ.TURMA_DISCIPLINA TD ON T.ID_TURMA = TD.ID_TURMA 
                                 WHERE TD.ID_DISCIPLINA = :id_dis`;
        const resultado = await con.execute(comando, { id_dis });

// Retorna o resultado como JSON para o cliente
res.json({ rows: resultado.rows });

} catch (err) {
    // Caso ocorra algum erro, loga no console e retorna erro 500 para o cliente
    console.error("Erro ao buscar turmas:", err);
    res.status(500);
    res.json({ message: "Erro ao buscar turmas" });
} finally {
    // Garante que a conexão será fechada mesmo se der erro
    if (con) {
        await con.close();
    }
}
});

// ------------------ adicionar turma ------------------ //
app.post('/adicionarturma', async (req: Request, res: Response) => {
    // Extrai dados enviados pelo cliente
    const { id_dis, nome_tur, car_hor, car_dia } = req.body;
    let con = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();

        const comando = `
            INSERT INTO NOTADEZ.TURMAS (NOME_TURMA, LOCAL_AULA, HORARIO_AULA, DIA_AULA)
            VALUES (:nome_tur, :local_aula, :horario_aula, :dia_aula)
            RETURNING ID_TURMA INTO :id_turma
        `;

        const bindVars = {
            nome_tur,
            local_aula: car_dia,
            horario_aula: car_hor,
            dia_aula: car_dia, // Usando car_dia como dia_aula também
            id_turma: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };

        const result: any = await con.execute(comando, bindVars, { autoCommit: true });
        const id_turma = result.outBinds.id_turma[0];

        await con.execute(
            `INSERT INTO NOTADEZ.TURMA_DISCIPLINA (ID_TURMA, ID_DISCIPLINA)
             VALUES (:id_turma, :id_dis)`,
            { id_turma, id_dis },
            { autoCommit: true }
        );

        confirm = true;
        return res.json({ confirm, message: "Turma adicionada com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar turma:", err);
        return res.status(500).json({ confirm, message: "Erro ao adicionar turma" });
    } finally {
        if (con) await con.close();
    }
});

// excluir turma
app.post('/excluirturma', async (req: Request, res: Response) => {
    const { nome_turma, id_dis } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        // Conexão com Oracle
        con = await oracledb.getConnection();

        // Buscar ID da turma pelo nome
        const selectSQL = `
            SELECT T.ID_TURMA FROM NOTADEZ.TURMAS T
            INNER JOIN NOTADEZ.TURMA_DISCIPLINA TD ON T.ID_TURMA = TD.ID_TURMA
            WHERE T.NOME_TURMA = :nome_turma AND TD.ID_DISCIPLINA = :id_dis
        `;

        const idResult = await con.execute(selectSQL, { nome_turma, id_dis });
        const idRows = idResult.rows as any[];

        if (!idRows || idRows.length === 0) {
            return res.json({ confirm: false, message: "Turma não encontrada" });
        }

        const id_turma = idRows[0][0];

        // Verifica notas vinculadas
        const verificarNotas = await con.execute(
            `SELECT COUNT(*) FROM NOTADEZ.NOTAS WHERE ID_TURMA = :id_turma`,
            { id_turma }
        );

        const rows = verificarNotas.rows as any[];
        const temNotas = rows && rows.length > 0 && rows[0][0] > 0;

        if (temNotas) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir turma que possui notas lançadas"
            });
        }

        // Delete sem autoCommit
        await con.execute(`DELETE FROM NOTADEZ.MATRICULAM WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMA_DISCIPLINA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMAS WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });

        // Realiza commit manual após todos os deletes
        await con.commit();

        confirm = true;
        return res.json({
            confirm,
            message: "Turma excluída com sucesso"
        });

    } catch (err) {
        // Caso ocorra erro, loga e faz rollback
        console.error("Erro ao excluir turma:", err);
        if (con) await con.rollback();

        return res.status(500).json({
            confirm: false,
            message: "Erro ao excluir turma"
        });
    } finally {
        // Fecha conexão
        if (con) await con.close();
    }
});

// ------------------ importar alunos via CSV ------------------ //
app.post('/importarcsv', async (req: Request, res: Response) => {
    // Recebe array de alunos e ID da turma
    const alunos = req.body.alunos;  
    const id_turma = req.body.id_turma;
    let con = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();
        let adicionados = 0;
        let ignorados = 0;

        // Loop para cada aluno
        for (const aluno of alunos) {
            const ra_aluno = aluno.matricula || aluno[0];  // pega matrícula
            const nome_aluno = aluno.nome || aluno[1];     // pega nome
            if (!ra_aluno || !nome_aluno) continue;       // ignora se faltar dados

            try {
                // Verifica se aluno já existe
                const alunoExistente = await con.execute(
                    `SELECT RA_ALUNO FROM NOTADEZ.ALUNOS WHERE RA_ALUNO = :ra_aluno`,
                    { ra_aluno });

                // Se não existe, insere
                if (alunoExistente.rows!.length === 0) {
                    await con.execute(
                        `INSERT INTO NOTADEZ.ALUNOS(RA_ALUNO, NOME_ALUNO) VALUES(:ra_aluno, :nome_aluno)`,
                        { ra_aluno, nome_aluno },
                        { autoCommit: true });
                }

                // Verifica se já está matriculado na turma
                const matricula = await con.execute(
                    `SELECT RA_ALUNO FROM NOTADEZ.MATRICULA WHERE RA_ALUNO = :ra_aluno AND ID_TURMA = :id_turma`,
                    { ra_aluno, id_turma });

                if (matricula.rows!.length === 0) {
                    // Insere matrícula
                    await con.execute(
                        `INSERT INTO NOTADEZ.MATRICULA(RA_ALUNO, ID_TURMA) VALUES(:ra_aluno, :id_turma)`,
                        { ra_aluno, id_turma },
                        { autoCommit: true });
                    adicionados++;
                } else {
                    ignorados++;
                }
            } catch (e) {
                // Caso ocorra erro no aluno individual, incrementa ignorados
                ignorados++;
            }
        }

        // Confirma sucesso e retorna quantidade adicionada/ignorada
        confirm = true;
        res.json({ confirm, adicionados, ignorados });

    } catch (err) {
        console.error("Erro ao importar CSV:", err);
        res.status(500).json({ confirm: false, message: "Erro ao importar alunos" });
    } finally {
        if (con) await con.close();
    }
});

//buscar tabela de notas
app.post('/buscarnotas', async (req: Request, res: Response) => {
    const { id_turma, id_disciplina } = req.body;
    let conn: oracledb.Connection | null = null;

    try {
        conn = await oracledb.getConnection();
        
        // Query para buscar notas (ajustada para o schema correto)
        const result = await conn.execute(
            `SELECT DISTINCT AL.RA_ALUNO as MATRICULA, AL.NOME_ALUNO as NOME, N.VALOR_FINAL
             FROM NOTADEZ.ALUNOS AL
             LEFT JOIN NOTADEZ.MATRICULAM M ON AL.RA_ALUNO = M.RA_ALUNO
             LEFT JOIN NOTADEZ.NOTAS N ON AL.RA_ALUNO = N.RA_ALUNO AND N.ID_TURMA = M.ID_TURMA
             WHERE M.ID_TURMA = :id_turma
             ORDER BY AL.NOME_ALUNO`,
            { id_turma }
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar notas' });
    } finally {
        if (conn) await conn.close();
    }
});

//  ||                            ||
//  ||                            ||
//--\/GERENCIAMENTO DE NOTAS\/--

//adicionar aluno
app.post('/adicionaraluno', async (req: Request, res: Response) => {
    const { matricula, nome, peso } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Verificar se aluno já existe pelo nome (ra_aluno é auto-incremento)
        const verificarSQL = `SELECT COUNT(*) FROM NOTADEZ.ALUNOS WHERE NOME_ALUNO = :nome`;
        const verificar = await con.execute(verificarSQL, { nome });
        const existe = (verificar.rows as any[])[0][0] > 0;

        if (!existe) {
            // Inserir aluno (ra_aluno será gerado automaticamente)
            await con.execute(
                `INSERT INTO NOTADEZ.ALUNOS (NOME_ALUNO) VALUES (:nome)`,
                { nome },
                { autoCommit: true }
            );
        }

        confirm = true;
        res.json({ confirm, message: "Aluno adicionado com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar aluno:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar aluno" });
    } finally {
        if (con) await con.close();
    }
});

//adicionar componente
app.post('/adicionarcomponente', async (req: Request, res: Response) => {
    const { nome_componente, sigla_componente, peso_componente, id_turma } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar id_disciplina da turma
        const selectDisSQL = `
            SELECT ID_DISCIPLINA FROM NOTADEZ.TURMA_DISCIPLINA
            WHERE ID_TURMA = :id_turma
        `;
        const disResult = await con.execute(selectDisSQL, { id_turma });
        const disRows = disResult.rows as any[];

        if (!disRows || disRows.length === 0) {
            return res.json({ confirm: false, message: "Turma não encontrada" });
        }

        const id_disciplina = disRows[0][0];

        // Inserir componente (sem peso_componente e id_turma, que não existem no schema)
        const insertSQL = `
            INSERT INTO NOTADEZ.COMPONENTES_NOTA (NOME_COMPONENTE, SIGLA_COMPONENTE, DESCRICAO, ID_DISCIPLINA)
            VALUES (:nome_componente, :sigla_componente, :descricao, :id_disciplina)
        `;

        const descricao = peso_componente ? `Peso: ${peso_componente}` : '';
        await con.execute(insertSQL, { nome_componente, sigla_componente, descricao, id_disciplina }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Componente adicionado com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar componente:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar componente" });
    } finally {
        if (con) await con.close();
    }
});

//calcular nota final
app.post('/calcularnotafinal', async (req: Request, res: Response) => {
    const { matricula, id_turma, id_disciplina } = req.body;
    let con: oracledb.Connection | null = null;

    try {
        con = await oracledb.getConnection();

        // Buscar todas as notas do aluno para os componentes da turma
        const notasSQL = `
            SELECT N.VALOR_FINAL
            FROM NOTADEZ.NOTAS N
            WHERE N.RA_ALUNO = :matricula AND N.ID_TURMA = :id_turma
        `;

        const notasResult = await con.execute(notasSQL, { matricula, id_turma });
        const notasRows = notasResult.rows as any[];

        if (!notasRows || notasRows.length === 0) {
            return res.json({ valor_final: 0, message: "Nenhuma nota encontrada" });
        }

        // Calcular média aritmética (já que não temos pesos no schema)
        let somaNotas = 0;
        let quantidade = 0;

        notasRows.forEach((row: any) => {
            const nota = row[0] || 0;
            somaNotas += nota;
            quantidade++;
        });

        const valor_final = quantidade > 0 ? somaNotas / quantidade : 0;

        // Nota: No schema, NOTAS requer RA_ALUNO, ID_COMPONENTE e ID_TURMA
        // Como não temos um componente específico aqui, vamos buscar o primeiro componente da turma
        const selectComponenteSQL = `
            SELECT CN.ID_COMPONENTE FROM NOTADEZ.COMPONENTES_NOTA CN
            JOIN NOTADEZ.TURMA_DISCIPLINA TD ON CN.ID_DISCIPLINA = TD.ID_DISCIPLINA
            WHERE TD.ID_TURMA = :id_turma
            AND ROWNUM = 1
        `;
        const compResult = await con.execute(selectComponenteSQL, { id_turma });
        const compRows = compResult.rows as any[];
        
        if (!compRows || compRows.length === 0) {
            return res.json({ valor_final, message: "Nota calculada, mas nenhum componente encontrado para salvar" });
        }
        
        const id_componente = compRows[0][0];

        // Atualizar ou inserir nota final
        const updateSQL = `
            MERGE INTO NOTADEZ.NOTAS N
            USING (SELECT :matricula as RA_ALUNO, :id_componente as ID_COMPONENTE, :id_turma as ID_TURMA FROM DUAL) T
            ON (N.RA_ALUNO = T.RA_ALUNO AND N.ID_COMPONENTE = T.ID_COMPONENTE AND N.ID_TURMA = T.ID_TURMA)
            WHEN MATCHED THEN UPDATE SET VALOR_FINAL = :valor_final
            WHEN NOT MATCHED THEN INSERT (RA_ALUNO, ID_COMPONENTE, ID_TURMA, VALOR_FINAL) VALUES (:matricula, :id_componente, :id_turma, :valor_final)
        `;

        await con.execute(updateSQL, { matricula, id_componente, id_turma, valor_final }, { autoCommit: true });

        res.json({ valor_final, message: "Nota final calculada com sucesso" });

    } catch (err) {
        console.error("Erro ao calcular nota final:", err);
        res.status(500).json({ message: "Erro ao calcular nota final" });
    } finally {
        if (con) await con.close();
    }
});

//editar nota
app.put('/editarnota', async (req: Request, res: Response) => {
    const { matricula, id_componente, valor_nota } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Buscar id_turma do componente (através da disciplina)
        const selectTurmaSQL = `
            SELECT TD.ID_TURMA FROM NOTADEZ.TURMA_DISCIPLINA TD
            JOIN NOTADEZ.COMPONENTES_NOTA CN ON TD.ID_DISCIPLINA = CN.ID_DISCIPLINA
            WHERE CN.ID_COMPONENTE = :id_componente
        `;
        const turmaResult = await con.execute(selectTurmaSQL, { id_componente });
        const turmaRows = turmaResult.rows as any[];
        
        if (!turmaRows || turmaRows.length === 0) {
            return res.json({ confirm: false, message: "Componente não encontrado ou não vinculado a uma turma" });
        }
        
        const id_turma = turmaRows[0][0];

        // Atualizar ou inserir nota (usando valor_final, não valor_nota)
        const updateSQL = `
            MERGE INTO NOTADEZ.NOTAS N
            USING (SELECT :matricula as RA_ALUNO, :id_componente as ID_COMPONENTE, :id_turma as ID_TURMA FROM DUAL) T
            ON (N.RA_ALUNO = T.RA_ALUNO AND N.ID_COMPONENTE = T.ID_COMPONENTE AND N.ID_TURMA = T.ID_TURMA)
            WHEN MATCHED THEN UPDATE SET VALOR_FINAL = :valor_nota
            WHEN NOT MATCHED THEN INSERT (RA_ALUNO, ID_COMPONENTE, ID_TURMA, VALOR_FINAL) VALUES (:matricula, :id_componente, :id_turma, :valor_nota)
        `;

        await con.execute(updateSQL, { matricula, id_componente, id_turma, valor_nota }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Nota editada com sucesso" });

    } catch (err) {
        console.error("Erro ao editar nota:", err);
        res.status(500).json({ confirm, message: "Erro ao editar nota" });
    } finally {
        if (con) await con.close();
    }
});

/*maticula, nome, nota, turma, disciplina*/ 

initconnection().then(() => {
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

__acesso ao banco:
1-baixar oracle database EX(o servidor do banco de dados oracle).

2-definir senha ao executar setup.

3-baixar oracle instant-client(conexão para o node oracledb).

4-baixar extensão oracle sql developer for vscode(ferramenta para aplicações sql).

5-criar conexão pela extensão(preencher requisitos:
-username: system       (padrão no oracle database EX)
-password:              (senha definida anteriormente)
-hostname: localhost    (endereço)
-port: 1521             (porta padrão para o banco oracle)
-service name: XEPDB1   (rota padrão)
)
6-rodar oracle.sql.
7 - async function initconnection(){ 
try{
    oracledb.initOracleClient({//acessar o client(local)
        libDir : "caminho para o oracle instant-client"
    });
} catch (err){
    console.log("já inicializado ou erro");
    console.log(err);
}

return await oracledb.createPool({
        user: "<nome do usuário>",
        password: "<senha do usuário>",
        connectString: "<rota>",
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1
    });
}

rota modelo

app.post('/', async (req: Request, res: Response) => {
    const id_ins = req.body.id_ins;

    const con = await oracledb.getConnection();
    try{
        const comando:string = '';

        const resultado = await con.execute(comando);

    } catch(err){
        console.error(err);
    } finally {
        if (con) await con.close();
    }
});
*/

// ------------------ adicionar aluno ------------------ //
app.post('/adicionaraluno', async (req: Request, res: Response) => {
    const ra_aluno = req.body.ra_aluno || req.body.matricula;
    const nome_aluno = req.body.nome_aluno || req.body.nome;
    const id_turma = req.body.id_turma;
    let con = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();

        // Verifica se aluno já existe
        let alunoExiste = false;
        try {
            const aluno = await con.execute(
                `SELECT RA_ALUNO FROM NOTADEZ.ALUNOS WHERE RA_ALUNO = :ra_aluno`,
                { ra_aluno });
            alunoExiste = aluno.rows!.length > 0;
        } catch (e) {
            // Se não existir, continua sem erro
        }

        // Insere aluno caso não exista
        if (!alunoExiste) {
            await con.execute(
                `INSERT INTO NOTADEZ.ALUNOS(RA_ALUNO, NOME_ALUNO) VALUES(:ra_aluno, :nome_aluno)`,
                { ra_aluno, nome_aluno },
                { autoCommit: true });
        }

        // Verifica se aluno já está matriculado na turma
        const matricula = await con.execute(
            `SELECT RA_ALUNO FROM NOTADEZ.MATRICULA WHERE RA_ALUNO = :ra_aluno AND ID_TURMA = :id_turma`,
            { ra_aluno, id_turma });

        if (matricula.rows!.length === 0) {
            // Matricula o aluno
            await con.execute(
                `INSERT INTO NOTADEZ.MATRICULA(RA_ALUNO, ID_TURMA) VALUES(:ra_aluno, :id_turma)`,
                { ra_aluno, id_turma },
                { autoCommit: true });
        }

        confirm = true;
        res.json({ confirm, message: "Aluno adicionado com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar aluno:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar aluno" });
    } finally {
        if (con) await con.close();
    }
});

