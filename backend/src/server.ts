
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

        // Comando SQL para inserir um novo docente na tabela DOCENTE
        const resultado = await con.execute(`INSERT INTO NOTADEZ.DOCENTE(NOME_DOCENTE, EMAIL_DOCENTE, SENHA, TELEFONE_DOCENTE) VALUES(:nome, :email, :senha, :telefone)`,
            // Parâmetros de bind (evita SQL Injection)
            { nome, email, senha, telefone },
            { autoCommit: true }); // Confirma a transação automaticamente

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

        // Comando SQL para verificar se existe um docente com o email e senha fornecidos
        const result = await con.execute(`SELECT * FROM NOTADEZ.DOCENTE WHERE EMAIL_DOCENTE = :email AND SENHA = :senha`,
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
        res.json({
            confirm: false,
            error: "Erro ao realizar login"
        });
    } finally {
        if (con) {
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

        // 1. Insere a nova instituição na tabela INSTITUICOES
        const insertSQL = `
            INSERT INTO NOTADEZ.INSTITUICOES (NOME_INSTITUICAO)
            VALUES (:nome_instituicao)
        `;
        await con.execute(insertSQL, { nome_instituicao }, { autoCommit: true });

        // 2. Busca o ID (chave primária) da instituição recém-inserida
        // NOTA: Em produção, seria melhor usar uma sequência (SEQUENCE) ou RETURNING INTO.
        const selectSQL = `
            SELECT ID_INSTITUICAO
            FROM NOTADEZ.INSTITUICOES
            WHERE NOME_INSTITUICAO = :nome_instituicao
        `;

        const idResult = await con.execute(selectSQL, { nome_instituicao }, {});

        const rows = idResult.rows as any[];
        if (!rows || rows.length === 0) {
            throw new Error("Instituição não encontrada após inserção");
        }

        const id_instituicao = rows[0][0];

        // 3. Relaciona a nova instituição com o docente na tabela CADASTROS
        const cadSQL = `
            INSERT INTO NOTADEZ.CADASTROS (ID_DOCENTE, ID_INSTITUICAO)
            VALUES (:id_docente, :id_instituicao)
        `;

        await con.execute(cadSQL, { id_docente, id_instituicao }, { autoCommit: true });

        confirm = true;
        res.json({ confirm });

    } catch (err) {
        console.error("Erro ao adicionar instituição:", err);
        res.json({ confirm });
    } finally {
        if (con) await con.close();
    }
});

// Rota para excluir uma instituição
app.post('/excluirinstituicao', async (req: Request, res: Response) => {
    const { id_instituicao } = req.body;
    let con: any = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();

        // 1. Verifica se a instituição tem cursos cadastrados (regra de negócio)
        const verificarCursos = await con.execute(
            `SELECT COUNT(*) FROM NOTADEZ.CADASTROS WHERE ID_INSTITUICAO = :id_instituicao AND ID_CURSO IS NOT NULL`,
            { id_instituicao }
        );

        const temCursos = verificarCursos.rows![0][0] > 0;

        if (temCursos) {
            // Se houver cursos, impede a exclusão
            return res.json({
                confirm: false,
                message: "Não é possível excluir instituição que possui cursos cadastrados"
            });
        }

        // 2. Inicia Transação para garantir atomicidade:

        // Remove relacionamento na tabela CADASTROS
        await con.execute(
            `DELETE FROM NOTADEZ.CADASTROS WHERE ID_INSTITUICAO = :id_instituicao`,
            { id_instituicao },
            { autoCommit: false } // Não commita ainda
        );

        // Remove a instituição (tabela INSTITUICOES)
        await con.execute(
            `DELETE FROM NOTADEZ.INSTITUICOES WHERE ID_INSTITUICAO = :id_instituicao`,
            { id_instituicao },
            { autoCommit: false } // Não commita ainda
        );

        await con.commit(); // Confirma ambas as operações
        confirm = true;

        return res.json({
            confirm,
            message: "Instituição excluída com sucesso"
        });

    } catch (err) {
        console.error("Erro ao excluir instituição:", err);
        if (con) await con.rollback(); // Desfaz a transação em caso de erro
        return res.status(500).json({
            confirm: false,
            message: "Erro ao excluir instituição"
        });
    } finally {
        if (con) await con.close();
    }
});

// Rota para buscar todos os cursos de uma instituição
app.post('/buscarcursos', async (req: Request, res: Response) => {
    const id_ins = req.body.id_ins; // ID da Instituição
    let con = null;

    try {
        con = await oracledb.getConnection();

        // Comando SQL que busca cursos relacionados à instituição através da tabela CADASTROS
        const comando: string = `SELECT C.* FROM NOTADEZ.CURSOS C 
                                     INNER JOIN NOTADEZ.CADASTROS CAD ON C.ID_CURSO = CAD.ID_CURSO 
                                     WHERE CAD.ID_INSTITUICAO = :id_ins`;
        const resultado = await con.execute(comando, { id_ins });

        res.json({ rows: resultado.rows });

    } catch (err) {
        console.error("Erro ao buscar cursos:", err);
        res.status(500);
        res.json({ message: "Erro ao buscar cursos" });
    } finally {
        if (con) {
            await con.close();
        }
    }
});

// Rota para adicionar um novo curso e relacioná-lo a uma instituição
app.post('/adicionarcurso', async (req: Request, res: Response) => {
    const { id_ins, nome_cur } = req.body; // ID da Instituição e Nome do Curso
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // 1. Inserir o curso na tabela CURSOS
        const insertSQL = `
            INSERT INTO NOTADEZ.CURSOS (NOME_CURSO)
            VALUES (:nome_cur)
        `;

        await con.execute(insertSQL, { nome_cur }, { autoCommit: true });

        // 2. Buscar o ID do curso criado
        const selectSQL = `
            SELECT ID_CURSO
            FROM NOTADEZ.CURSOS
            WHERE NOME_CURSO = :nome_cur
        `;

        const idResult = await con.execute(selectSQL, { nome_cur });
        const rows = idResult.rows as any[];

        if (!rows || rows.length === 0) {
            throw new Error("Erro ao recuperar ID do curso recém criado");
        }

        const id_curso = rows[0][0];

        // 3. Relacionar o curso com a instituição na tabela CADASTROS (atualizando o ID_CURSO)
        const updateSQL = `
            UPDATE NOTADEZ.CADASTROS
            SET ID_CURSO = :id_curso
            WHERE ID_INSTITUICAO = :id_ins
            -- NOTA: Esta lógica parece incompleta, pois a tabela CADASTROS é uma tabela N:M.
            -- A atualização deve ser mais específica, ou um novo registro deveria ser inserido.
            -- Mantendo o seu padrão de UPDATE, mas é uma área para revisão no modelo de dados.
        `;

        await con.execute(updateSQL, { id_curso, id_ins }, { autoCommit: true });

        confirm = true;
        res.json({ confirm, message: "Curso adicionado com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar curso:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar curso" });

    } finally {
        if (con) await con.close();
    }
});


// Rota para excluir um curso
app.post('/excluircurso', async (req: Request, res: Response) => {
    const { id_curso } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // 1. Verifica se o curso possui disciplinas cadastradas (regra de negócio)
        const verificarSQL = `
            SELECT COUNT(*) FROM NOTADEZ.DISCIPLINA_INSTITUICAO
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

        // 2. Remove o relacionamento do curso na tabela CADASTROS (setando ID_CURSO para NULL)
        const desvincularSQL = `
            UPDATE NOTADEZ.CADASTROS
            SET ID_CURSO = NULL
            WHERE ID_CURSO = :id_curso
        `;

        await con.execute(desvincularSQL, { id_curso }, { autoCommit: true });

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


// Rota para buscar todas as disciplinas de um curso
app.post('/buscardisciplinas', async (req: Request, res: Response) => {
    const id_cur = req.body.id_cur; // ID do Curso
    let con = null;

    try {
        con = await oracledb.getConnection();

        // Comando SQL que busca disciplinas relacionadas ao curso através da tabela DISCIPLINA_INSTITUICAO
        const comando: string = `SELECT D.* FROM NOTADEZ.DISCIPLINA D 
                                     INNER JOIN NOTADEZ.DISCIPLINA_INSTITUICAO DI ON D.ID_DISCIPLINA = DI.ID_DISCIPLINA 
                                     WHERE DI.ID_CURSO = :id_cur`;
        const resultado = await con.execute(comando, { id_cur });

        res.json({ disciplinas: resultado.rows, rows: resultado.rows });

    } catch (err) {
        console.error("Erro ao buscar disciplinas:", err);
        res.status(500);
        res.json({ message: "Erro ao buscar disciplinas" });
    } finally {
        if (con) {
            await con.close();
        }
    }
});

// Rota para adicionar uma nova disciplina
app.post('/adicionardisciplina', async (req: Request, res: Response) => {
    // ID do Curso, Nome, Sigla, Período, ID da Instituição e ID do Docente
    const { id_cur, nome_dis, sigla_dis = '', codigo_dis = '', periodo_dis = '', id_instituicao, id_docente } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // 1. Inserir a nova disciplina na tabela DISCIPLINA
        const insertSQL = `
            INSERT INTO NOTADEZ.DISCIPLINA (NOME_DISCIPLINA, SIGLA_DISCIPLINA, PERIODO)
            VALUES (:nome_dis, :sigla_dis, :periodo_dis)
        `;

        await con.execute(insertSQL, { nome_dis, sigla_dis, periodo_dis }, { autoCommit: true });

        // 2. Buscar ID da disciplina inserida
        const selectSQL = `
            SELECT ID_DISCIPLINA
            FROM NOTADEZ.DISCIPLINA
            WHERE NOME_DISCIPLINA = :nome_dis
        `;

        const idResult = await con.execute(selectSQL, { nome_dis });
        const rows = idResult.rows as any[];

        if (!rows || rows.length === 0) {
            throw new Error("Erro ao recuperar disciplina recém criada");
        }

        const id_disciplina = rows[0][0];

        // 3. Criar relacionamento na tabela DISCIPLINA_INSTITUICAO
        const relationSQL = `
            INSERT INTO NOTADEZ.DISCIPLINA_INSTITUICAO
            (ID_DISCIPLINA, ID_INSTITUICAO, ID_CURSO, ID_DOCENTE)
            VALUES (:id_disciplina, :id_instituicao, :id_cur, :id_docente)
        `;

        await con.execute(relationSQL, { id_disciplina, id_instituicao, id_cur, id_docente }, { autoCommit: true });

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
    const { id_disciplina } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // 1. Verifica se a disciplina tem turmas cadastradas (regra de negócio)
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

        // 2. Remove relacionamentos na tabela DISCIPLINA_INSTITUICAO
        const deleteRelacionamentoSQL = `
            DELETE FROM NOTADEZ.DISCIPLINA_INSTITUICAO 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;
        await con.execute(deleteRelacionamentoSQL, { id_disciplina }, { autoCommit: true });

        // 3. Remove a disciplina da tabela DISCIPLINA
        const deleteDisciplinaSQL = `
            DELETE FROM NOTADEZ.DISCIPLINA 
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

//  ||                           ||
//  ||                           ||
//--\/ GERENCIAMENTO DE TURMAS \/--

// Rota para buscar todas as turmas associadas a uma disciplina
app.post('/buscarturmas', async (req: Request, res: Response) => {
    const id_dis = req.body.id_dis; // ID da Disciplina
    let con = null;

    try {// Obtém a conexão com o banco Oracle
con = await oracledb.getConnection();

// Cria o comando SQL para buscar turmas de uma determinada disciplina
const comando: string = `SELECT T.* FROM NOTADEZ.TURMA T 
                         INNER JOIN NOTADEZ.TURMA_DISCIPLINA TD ON T.ID_TURMA = TD.ID_TURMA 
                         WHERE TD.ID_DISCIPLINA = :id_dis`;
// Executa o comando, passando o parâmetro id_dis para evitar SQL injection
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
    let con: any = null;
    let confirm: boolean = false;

    try {
        // Obtém conexão com o Oracle
        con = await oracledb.getConnection();

        // SQL para inserir nova turma
        const insertSQL = `
            INSERT INTO NOTADEZ.TURMA (NOME_TURMA, LOCAL_AULA, HORARIO_AULA)
            VALUES (:nome_tur, :local_aula, :horario_aula)
        `;
        // Executa o insert, passando parâmetros e realizando commit automático
        await con.execute(insertSQL,
            { nome_tur, local_aula: car_dia, horario_aula: car_hor },
            { autoCommit: true });

        // Busca o ID da turma recém-criada
        const selectSQL = `
            SELECT ID_TURMA
            FROM NOTADEZ.TURMA
            WHERE NOME_TURMA = :nome_tur AND LOCAL_AULA = :local_aula AND HORARIO_AULA = :horario_aula
        `;
        const idResult = await con.execute(selectSQL, { nome_tur, local_aula: car_dia, horario_aula: car_hor });
        const rows = idResult.rows as any[];

        // Se não encontrar o ID, lança erro
        if (!rows || rows.length === 0) {
            throw new Error("Erro ao recuperar ID da turma recém criada");
        }

        // Pega o ID da primeira linha (única) retornada
        const id_turma = rows[0][0];

        // Insere relacionamento turma-disciplina
        await con.execute(
            `INSERT INTO NOTADEZ.TURMA_DISCIPLINA(ID_TURMA, ID_DISCIPLINA)
             VALUES (:id_turma, :id_dis)`,
            { id_turma, id_dis },
            { autoCommit: true }
        );

        // Confirma sucesso e envia mensagem para o cliente
        confirm = true;
        res.json({ confirm, message: "Turma adicionada com sucesso" });

    } catch (err) {
        // Caso ocorra erro, loga e retorna 500
        console.error("Erro ao adicionar turma:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar turma" });
    } finally {
        // Fecha conexão
        if (con) await con.close();
    }
});

// ------------------ excluir turma ------------------ //
app.post('/excluirturma', async (req: Request, res: Response) => {
    const { id_turma } = req.body;
    let con: any = null;

    try {
        // Conexão com Oracle
        con = await oracledb.getConnection();

        // Verifica se existem notas associadas à turma
        const verificarNotas = await con.execute(
            `SELECT COUNT(*) FROM NOTADEZ.NOTAS WHERE ID_TURMA = :id_turma`,
            { id_turma }
        );

        // Se existir alguma nota, não permite exclusão
        const temNotas = verificarNotas.rows![0][0] > 0;
        if (temNotas) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir turma que possui notas lançadas"
            });
        }

        // Deleta registros relacionados sem commit automático
        await con.execute(`DELETE FROM NOTADEZ.MATRICULA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMA_DISCIPLINA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });

        // Realiza commit manual após todos os deletes
        await con.commit();

        // Retorna sucesso
        return res.json({
            confirm: true,
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
        res.json({
            confirm,
            message: `Importação concluída: ${adicionados} adicionados, ${ignorados} ignorados`,
            adicionados,
            ignorados
        });

    } catch (err) {
        console.error("Erro ao importar CSV:", err);
        res.status(500).json({ confirm, message: "Erro ao importar CSV" });
    } finally {
        if (con) await con.close();
    }
});

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

