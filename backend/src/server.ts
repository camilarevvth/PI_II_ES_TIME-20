/*
    Autor: Gustavo Santos de Oliveira
    Arquivo: server.ts
    Descrição: 
    */

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as oracledb from 'oracledb';
//import { Parser } from "json2csv";
//import multer from "multer";
//import csv from "csv-parser";
//import fs from "fs";
//import  upload  from "../upload";

const app = express();
const port: number = 3000;

async function initconnection() {
    try {
        oracledb.initOracleClient({//acessar o client(local)
            libDir: "C:/client_oracle/instantclient-basiclite-windows.x64-23.9.0.25.07/instantclient_23_9"
        });
    } catch (err) {
        console.log("já inicializado ou erro");
        console.log(err);
    }

    return await oracledb.createPool({
        user: "NOTADEZ",
        password: "secretmypass",
        connectString: "localhost:1521/XEPDB1",
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
app.post('/cadastrar', async (req, res) => {
    //buscar os dados do front-end
    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;
    const telefone = req.body.telefone;

    let confirm: boolean = false;

    try {
        const con = await oracledb.getConnection();

        const resultado = await con.execute(`INSERT INTO NOTADEZ.DOCENTES(NOME, EMAIL, SENHA, TELEFONE) VALUES(:nome, :email, :senha, :telefone)`, //execução da conexão e do comando sql(oracle)
            { nome, email, senha, telefone }, //foranecer os dados necessarios
            { autoCommit: true }); //salvar a alteração no banco

        confirm = true; //comfirmar que deu certo

        res.json({ //enviar para o front-end
            confirm,
            message: "cadastro realizado com sucesso"
        });

        await con.close();//fechar a conexão
    } catch (err) {//erro(usuario já cadasstrado)

        res.status(500);

        res.json({
            confirm,
            message: "usuario já cadastrado"
        });


    }

});

//login
app.post('/login', async (req: Request, res: Response) => {
    const email = req.body.email;
    const senha = req.body.senha;
    let confirm:boolean = false;

    try {
        const con = await oracledb.getConnection();

        const result = await con.execute(`SELECT * FROM NOTADEZ.DOCENTES WHERE EMAIL = :email AND SENHA = :senha`,
            { email, senha });

        if (result.rows!.length > 0) {
            confirm = true;
            return res.json({
                mensagem: "sucesso ao fazer login1",
                confirm,
                usuario: result.rows![0]
            });
        }

        res.json({ mensagem: "email ou senha incorretos..." });
    } catch (err) {
        console.error(err);
        res.status(500);
        res.json({ error: "Erro ao realizar login" });
    }
});

//  ||                             ||
//  ||                             ||
//--\/GERENCIAMENTO DE INSTITUIÇÕES\/--

//buscar todas as instituições

app.post('/buscartodasinstituicoes', async (req: Request, res: Response) => {
    const id_docente = req.body.id_docente;
    let con = null;

    try {
        con = await oracledb.getConnection();

        // Busca instituições relacionadas ao docente através da tabela CADASTROS
        const comando: string = `SELECT i.* FROM NOTADEZ.DOCENTES D 
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


app.post('/adicionarinstituicao', async (req: Request, res: Response) => {
    const { nome_instituicao, id_usuario: id_docente } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Insere instituição
        const insertSQL = `
            INSERT INTO NOTADEZ.INSTITUICOES (NOME_INSTITUICAO)
            VALUES (:nome_instituicao)
        `;

        await con.execute(insertSQL, { nome_instituicao }, { autoCommit: true });

        // Busca ID da instituição
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

        // Relaciona com docente
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

//buscar cursos
app.post('/buscarcursos', async (req: Request, res: Response) => {
    const id_ins = req.body.id_ins;
    let con = null;

    try {
        con = await oracledb.getConnection();

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

// adicionar curso
app.post('/adicionarcurso', async (req: Request, res: Response) => {
    const { id_ins, nome_cur } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Inserir o curso
        const insertSQL = `
            INSERT INTO NOTADEZ.CURSOS (NOME_CURSO)
            VALUES (:nome_cur)
        `;

        await con.execute(insertSQL, { nome_cur }, { autoCommit: true });

        // Buscar o ID do curso criado
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

        // Relacionar com instituição
        const updateSQL = `
            UPDATE NOTADEZ.CADASTROS
            SET ID_CURSO = :id_curso
            WHERE ID_INSTITUICAO = :id_ins
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


// excluir curso
app.post('/excluircurso', async (req: Request, res: Response) => {
    const { id_curso } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

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

        // Remover relacionamento
        const desvincularSQL = `
            UPDATE NOTADEZ.CADASTROS
            SET ID_CURSO = NULL
            WHERE ID_CURSO = :id_curso
        `;

        await con.execute(desvincularSQL, { id_curso }, { autoCommit: true });

        // Remover curso
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
    const id_cur = req.body.id_cur;
    let con = null;

    try {
        con = await oracledb.getConnection();

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
//adicionar disciplina
app.post('/adicionardisciplina', async (req: Request, res: Response) => {
    const { id_cur, nome_dis, sigla_dis = '', codigo_dis = '', periodo_dis = '', id_instituicao, id_docente } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

        // Inserir disciplina
        const insertSQL = `
            INSERT INTO NOTADEZ.DISCIPLINA (NOME_DISCIPLINA, SIGLA_DISCIPLINA, PERIODO, CODIGO_DISCIPLINA)
            VALUES (:nome_dis, :sigla_dis, :periodo_dis, :codigo_dis)
        `;

        await con.execute(insertSQL, { nome_dis, sigla_dis, periodo_dis, codigo_dis }, { autoCommit: true });

        // Buscar ID da disciplina inserida
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

        // Criar relacionamento
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

//excluir disciplina 
app.post('/excluirdisciplina', async (req: Request, res: Response) => {
    const { id_disciplina } = req.body;
    let con: oracledb.Connection | null = null;
    let confirm = false;

    try {
        con = await oracledb.getConnection();

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

        // Remove relacionamentos
        const deleteRelacionamentoSQL = `
            DELETE FROM NOTADEZ.DISCIPLINA_INSTITUICAO 
            WHERE ID_DISCIPLINA = :id_disciplina
        `;
        await con.execute(deleteRelacionamentoSQL, { id_disciplina }, { autoCommit: true });

        // Remove disciplina
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

//  ||                            ||
//  ||                            ||
//--\/GERENCIAMENTO DE TURMAS\/--

//buscar turmas
app.post('/buscarturmas', async (req: Request, res: Response) => {
    const id_dis = req.body.id_dis;
    let con = null;

    try {
        con = await oracledb.getConnection();

        const comando: string = `SELECT T.* FROM NOTADEZ.TURMA T 
                                 INNER JOIN NOTADEZ.TURMA_DISCIPLINA TD ON T.ID_TURMA = TD.ID_TURMA 
                                 WHERE TD.ID_DISCIPLINA = :id_dis`;
        const resultado = await con.execute(comando, { id_dis });

        res.json({ rows: resultado.rows });

    } catch (err) {
        console.error("Erro ao buscar turmas:", err);
        res.status(500);
        res.json({ message: "Erro ao buscar turmas" });
    } finally {
        if (con) {
            await con.close();
        }
    }
});


//adicionar turma
app.post('/adicionarturma', async (req: Request, res: Response) => {
    const { id_dis, nome_tur, car_hor, car_dia } = req.body;
    let con: any = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();

        const comando = `
            INSERT INTO NOTADEZ.TURMA (NOME_TURMA, LOCAL_AULA, HORARIO_AULA)
            VALUES (:nome_tur, :local_aula, :horario_aula)
            RETURNING ID_TURMA INTO :id_turma
        `;

        const bindVars = {
            nome_tur,
            local_aula: car_dia,
            horario_aula: car_hor,
            id_turma: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };

        const result: any = await con.execute(comando, bindVars, { autoCommit: true });

        const id_turma = result.outBinds.id_turma[0];

        await con.execute(
            `INSERT INTO NOTADEZ.TURMA_DISCIPLINA(ID_TURMA, ID_DISCIPLINA)
             VALUES (:id_turma, :id_dis)`,
            { id_turma, id_dis },
            { autoCommit: true }
        );

        confirm = true;
        res.json({ confirm, message: "Turma adicionada com sucesso" });

    } catch (err) {
        console.error("Erro ao adicionar turma:", err);
        res.status(500).json({ confirm, message: "Erro ao adicionar turma" });
    } finally {
        if (con) await con.close();
    }
});




// adicionar turma
app.post('/adicionarturma', async (req: Request, res: Response) => {
    const { id_dis, nome_tur, car_hor, car_dia } = req.body;
    let con = null;
    let confirm: boolean = false;

    try {
        con = await oracledb.getConnection();

        const comando = `
            INSERT INTO NOTADEZ.TURMA (NOME_TURMA, LOCAL_AULA, HORARIO_AULA)
            VALUES (:nome_tur, :local_aula, :horario_aula)
            RETURNING ID_TURMA INTO :id_turma
        `;

        const bindVars = {
            nome_tur,
            local_aula: car_dia,
            horario_aula: car_hor,
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
    const { id_turma } = req.body;
    let con: any = null;

    try {
        con = await oracledb.getConnection();

        // Verifica notas vinculadas
        const verificarNotas = await con.execute(
            `SELECT COUNT(*) FROM NOTADEZ.NOTAS WHERE ID_TURMA = :id_turma`,
            { id_turma }
        );

        const temNotas = verificarNotas.rows![0][0] > 0;

        if (temNotas) {
            return res.json({
                confirm: false,
                message: "Não é possível excluir turma que possui notas lançadas"
            });
        }

        // Delete sem autoCommit
        await con.execute(`DELETE FROM NOTADEZ.MATRICULA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMA_DISCIPLINA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });
        await con.execute(`DELETE FROM NOTADEZ.TURMA WHERE ID_TURMA = :id_turma`, { id_turma }, { autoCommit: false });

        await con.commit();

        return res.json({
            confirm: true,
            message: "Turma excluída com sucesso"
        });

    } catch (err) {
        console.error("Erro ao excluir turma:", err);

        if (con) await con.rollback();

        return res.status(500).json({
            confirm: false,
            message: "Erro ao excluir turma"
        });
    } finally {
        if (con) await con.close();
    }
});

/*
app.post('/importaralunos', async (req: Request, res: Response) => {
  const filePath = req.body.file.path;
  const alunos: any[] = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (linha:any) => {
      // Espera-se colunas: nome_aluno
      const { nome_aluno } = linha;
      if (nome_aluno && nome_aluno.trim() !== "") {
        alunos.push({ nome_aluno });
      }
    })
    .on('end', async () => {
      const conn = await oracledb.getConnection();

      try {
        for (const aluno of alunos) {
          await conn.execute(
            `
            INSERT INTO notadez.alunos (nome_aluno)
            VALUES (:nome_aluno)
            `,
            { nome_aluno: aluno.nome_aluno }
          );
        }

        await conn.commit();
        res.send({
          sucesso: true,
          mensagem: `${alunos.length} alunos importados com sucesso!`
        });

      } catch (err: any) {
        console.error(err);
        res.status(500).send({
          sucesso: false,
          erro: err.message
        });
      }
    });
});*/

//buscar tabela de notas
app.post('/buscarnotas', async (req: Request, res: Response) => {
    
        const { id_turma, id_disciplina } = req.body;

        const conn = await  oracledb.getConnection();

  try {
    //ra, aluno, componente, p1, p2, p3
    const result = await conn.execute(
      `SELECT A.ra_aluno, id_componente, p1, p2, p3, valor_final FROM notadez.auditoria_notas A
      JOIN notadez.turma T ON A.id_turma = T.id_turma
      JOIN notadez.componentes_nota C ON C.id_disciplina = A.id_disciplina
      JOIN notadez.notas N ON N.ra_aluno = A.ra_aluno 
      AND N.id_componente = A.id_componente 
      WHERE T.id_turma = :id_turma AND C.id_turma = :id_turma`,
      { id_turma, id_disciplina }
    );

    
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro ao buscar notas');
  }
  const parser = new Parser();
  const csv = parser.parse(rsult.rows);
  

  res.header("Content-Type", "text/csv");
  

  res.header("Content-Type", "text/csv");
  res.attachment("notas.csv");
  return res.send(csv);
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
        res.json({
            message: ""
        });
    } finally{
        if(con){
            con.close();
        }
    }
});
*/
