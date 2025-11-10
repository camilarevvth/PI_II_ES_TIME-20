// @ts-nocheck
// Autor: [Seu Nome]
// Arquivo: backend.ts
// Descricao: Backend do sistema NotaDez com todas as rotas necessarias

import express, {Request, Response} from "express";
import bodyparser from "body-parser";
import cors from "cors";
import OracleDB from "oracledb";

const port = 3000;
const walletPath = "";
const app = express();

app.use(cors());
app.use(express.json());

// Configuracao do banco de dados Oracle
// IMPORTANTE: Descomente as linhas abaixo quando instalar o Oracle Instant Client
try {
    OracleDB.initOracleClient({configDir: walletPath});
    OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
    console.log("Oracle Client inicializado com sucesso");
} catch(err) {
    console.warn("AVISO: Oracle Client nao encontrado. Instale o Oracle Instant Client.");
    console.warn("Download: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html");
    // O servidor vai iniciar mesmo sem Oracle, mas as rotas de banco nao vao funcionar
}

const dbConfig = {
    user: "NOTADEZ", 
    password: "secretmypass",
    connectString: "localhost:1521/XE" // ajuste conforme seu ambiente
}

// Funcao para abrir conexao com o banco
async function getConnection() {
    try {
        const connection = await OracleDB.getConnection(dbConfig);
        return connection;
    } catch(err) {
        console.error("Erro ao conectar com o banco:", err);
        throw err;
    }
}

// ========== AUTENTICACAO ==========

// Rota de login
app.post('/api/login', async (req: Request, res: Response) => {
    const { email, senha } = req.body;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT ID_DOCENTE, NOME_DOCENTE FROM NOTADEZ.DOCENTE 
             WHERE EMAIL_DOCENTE = :email AND SENHA = :senha`,
            { email, senha }
        );
        
        await conn.close();
        
        if (result.rows && result.rows.length > 0) {
            res.json({ sucesso: true, docente: result.rows[0] });
        } else {
            res.json({ sucesso: false, mensagem: "Email ou senha incorretos" });
        }
    } catch(err) {
        console.error("Erro no login:", err);
        res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });
    }
});

// Rota de cadastro
app.post('/api/cadastro', async (req: Request, res: Response) => {
    const { nome, email, senha, celular } = req.body;
    
    try {
        const conn = await getConnection();
        
        // Verificar se email ja existe
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.DOCENTE WHERE EMAIL_DOCENTE = :email`,
            { email }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            await conn.close();
            return res.json({ sucesso: false, mensagem: "Email ja cadastrado" });
        }
        
        // Inserir novo docente
        await conn.execute(
            `INSERT INTO NOTADEZ.DOCENTE (NOME_DOCENTE, EMAIL_DOCENTE, SENHA) 
             VALUES (:nome, :email, :senha)`,
            { nome, email, senha }
        );
        
        await conn.commit();
        await conn.close();
        
        res.json({ sucesso: true, mensagem: "Cadastro realizado com sucesso" });
    } catch(err) {
        console.error("Erro no cadastro:", err);
        res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });
    }
});

// Rota de recuperar senha
app.post('/api/recuperar-senha', async (req: Request, res: Response) => {
    const { email } = req.body;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.DOCENTE WHERE EMAIL_DOCENTE = :email`,
            { email }
        );
        
        await conn.close();
        
        if (result.rows && result.rows[0] && result.rows[0][0] > 0) {
            res.json({ sucesso: true, mensagem: "Link de recuperacao enviado" });
        } else {
            res.json({ sucesso: false, mensagem: "Email nao encontrado" });
        }
    } catch(err) {
        res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });
    }
});

// ========== INSTITUICOES ==========

// Listar instituicoes
app.get('/api/instituicoes/:docenteId', async (req: Request, res: Response) => {
    const { docenteId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT DISTINCT i.ID_INSTITUICAO, i.NOME_INSTITUICAO 
             FROM NOTADEZ.INSTITUICOES i
             JOIN NOTADEZ.DISCIPLINA_INSTITUICAO di ON i.ID_INSTITUICAO = di.ID_INSTITUICAO
             WHERE di.ID_DOCENTE = :docenteId`,
            { docenteId: parseInt(docenteId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar instituicoes" });
    }
});

// Criar instituicao
app.post('/api/instituicoes', async (req: Request, res: Response) => {
    const { nome } = req.body;
    
    try {
        const conn = await getConnection();
        await conn.execute(
            `INSERT INTO NOTADEZ.INSTITUICOES (NOME_INSTITUICAO) VALUES (:nome)`,
            { nome },
            { autoCommit: true }
        );
        
        // Buscar o ID criado
        const result = await conn.execute(
            `SELECT MAX(ID_INSTITUICAO) as id FROM NOTADEZ.INSTITUICOES`
        );
        
        await conn.close();
        const id = result.rows && result.rows[0] ? result.rows[0][0] : null;
        res.json({ sucesso: true, id: id });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao criar instituicao" });
    }
});

// Excluir instituicao (com validacao)
app.delete('/api/instituicoes/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const conn = await getConnection();
        
        // Verificar se tem disciplinas
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.DISCIPLINA_INSTITUICAO 
             WHERE ID_INSTITUICAO = :id`,
            { id: parseInt(id) }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            await conn.close();
            return res.json({ sucesso: false, mensagem: "Nao pode excluir instituicao com disciplinas" });
        }
        
        await conn.execute(
            `DELETE FROM NOTADEZ.INSTITUICOES WHERE ID_INSTITUICAO = :id`,
            { id: parseInt(id) },
            { autoCommit: true }
        );
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao excluir instituicao" });
    }
});

// ========== DISCIPLINAS ==========

// Listar disciplinas
app.get('/api/disciplinas/:docenteId', async (req: Request, res: Response) => {
    const { docenteId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT d.ID_DISCIPLINA, d.NOME_DISCIPLINA, d.SIGLA_DISCIPLINA, d.PERIODO
             FROM NOTADEZ.DISCIPLINA d
             JOIN NOTADEZ.DISCIPLINA_INSTITUICAO di ON d.ID_DISCIPLINA = di.ID_DISCIPLINA
             WHERE di.ID_DOCENTE = :docenteId`,
            { docenteId: parseInt(docenteId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar disciplinas" });
    }
});

// Criar disciplina
app.post('/api/disciplinas', async (req: Request, res: Response) => {
    const { nome, sigla, periodo, instituicaoId, cursoId, docenteId } = req.body;
    
    try {
        const conn = await getConnection();
        await conn.execute(
            `INSERT INTO NOTADEZ.DISCIPLINA (NOME_DISCIPLINA, SIGLA_DISCIPLINA, PERIODO) 
             VALUES (:nome, :sigla, :periodo)`,
            { nome, sigla, periodo }
        );
        
        // Buscar o ID da disciplina criada
        const disciplinaId = await conn.execute(
            `SELECT MAX(ID_DISCIPLINA) as id FROM NOTADEZ.DISCIPLINA`
        );
        
        const idDisc = disciplinaId.rows && disciplinaId.rows[0] ? disciplinaId.rows[0][0] : null;
        
        // Relacionar com instituicao
        if (idDisc) {
            await conn.execute(
                `INSERT INTO NOTADEZ.DISCIPLINA_INSTITUICAO 
                 (ID_DISCIPLINA, ID_INSTITUICAO, ID_CURSO, ID_DOCENTE) 
                 VALUES (:idDisc, :instId, :cursoId, :docId)`,
                { idDisc, instId: instituicaoId, cursoId, docId: docenteId }
            );
        }
        
        await conn.commit();
        await conn.close();
        res.json({ sucesso: true, id: idDisc });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao criar disciplina" });
    }
});

// Excluir disciplina (com validacao)
app.delete('/api/disciplinas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const conn = await getConnection();
        
        // Verificar se tem turmas
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.TURMA_DISCIPLINA 
             WHERE ID_DISCIPLINA = :id`,
            { id: parseInt(id) }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            await conn.close();
            return res.json({ sucesso: false, mensagem: "Nao pode excluir disciplina com turmas" });
        }
        
        await conn.execute(
            `DELETE FROM NOTADEZ.DISCIPLINA WHERE ID_DISCIPLINA = :id`,
            { id: parseInt(id) },
            { autoCommit: true }
        );
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao excluir disciplina" });
    }
});

// ========== TURMAS ==========

// Listar turmas de uma disciplina
app.get('/api/turmas/:disciplinaId', async (req: Request, res: Response) => {
    const { disciplinaId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT t.ID_TURMA, t.NOME_TURMA, t.LOCAL_AULA, t.HORARIO_AULA
             FROM NOTADEZ.TURMA t
             JOIN NOTADEZ.TURMA_DISCIPLINA td ON t.ID_TURMA = td.ID_TURMA
             WHERE td.ID_DISCIPLINA = :disciplinaId`,
            { disciplinaId: parseInt(disciplinaId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar turmas" });
    }
});

// Criar turma
app.post('/api/turmas', async (req: Request, res: Response) => {
    const { nome, local, horario, disciplinaId } = req.body;
    
    try {
        const conn = await getConnection();
        await conn.execute(
            `INSERT INTO NOTADEZ.TURMA (NOME_TURMA, LOCAL_AULA, HORARIO_AULA) 
             VALUES (:nome, :local, :horario)`,
            { nome, local, horario }
        );
        
        // Buscar ID da turma criada
        const turmaId = await conn.execute(
            `SELECT MAX(ID_TURMA) as id FROM NOTADEZ.TURMA`
        );
        
        const idTurma = turmaId.rows && turmaId.rows[0] ? turmaId.rows[0][0] : null;
        
        // Relacionar com disciplina
        if (idTurma) {
            await conn.execute(
                `INSERT INTO NOTADEZ.TURMA_DISCIPLINA (ID_TURMA, ID_DISCIPLINA) 
                 VALUES (:idTurma, :discId)`,
                { idTurma, discId: disciplinaId }
            );
        }
        
        await conn.commit();
        await conn.close();
        res.json({ sucesso: true, id: idTurma });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao criar turma" });
    }
});

// Excluir turma (com validacao de notas)
app.delete('/api/turmas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const conn = await getConnection();
        
        // Verificar se tem notas lancadas
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.NOTAS WHERE ID_TURMA = :id`,
            { id: parseInt(id) }
        );
        
        const totalNotas = verifica.rows && verifica.rows[0] ? verifica.rows[0][0] : 0;
        
        if (totalNotas > 0) {
            await conn.close();
            return res.json({ 
                sucesso: false, 
                mensagem: "Esta turma possui notas lancadas. Tem certeza que deseja excluir?",
                temNotas: true 
            });
        }
        
        await conn.execute(
            `DELETE FROM NOTADEZ.TURMA WHERE ID_TURMA = :id`,
            { id: parseInt(id) },
            { autoCommit: true }
        );
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao excluir turma" });
    }
});

// ========== ALUNOS ==========

// Listar alunos de uma turma
app.get('/api/alunos/:turmaId', async (req: Request, res: Response) => {
    const { turmaId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT a.RA_ALUNO, a.NOME_ALUNO 
             FROM NOTADEZ.ALUNOS a
             JOIN NOTADEZ.MATRICULA m ON a.RA_ALUNO = m.RA_ALUNO
             WHERE m.ID_TURMA = :turmaId`,
            { turmaId: parseInt(turmaId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar alunos" });
    }
});

// Cadastrar aluno
app.post('/api/alunos', async (req: Request, res: Response) => {
    const { matricula, nome, turmaId } = req.body;
    
    try {
        const conn = await getConnection();
        
        // Verificar se matricula ja existe na turma
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.MATRICULA m
             JOIN NOTADEZ.ALUNOS a ON m.RA_ALUNO = a.RA_ALUNO
             WHERE a.RA_ALUNO = :matricula AND m.ID_TURMA = :turmaId`,
            { matricula: parseInt(matricula), turmaId: parseInt(turmaId) }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            await conn.close();
            return res.json({ sucesso: false, mensagem: "Aluno ja cadastrado nesta turma" });
        }
        
        // Inserir aluno (se nao existir)
        try {
            await conn.execute(
                `INSERT INTO NOTADEZ.ALUNOS (RA_ALUNO, NOME_ALUNO) VALUES (:matricula, :nome)`,
                { matricula: parseInt(matricula), nome }
            );
        } catch(e) {
            // Se aluno ja existe, apenas atualiza nome (ou ignora)
        }
        
        // Matricular na turma
        await conn.execute(
            `INSERT INTO NOTADEZ.MATRICULA (RA_ALUNO, ID_TURMA) VALUES (:matricula, :turmaId)`,
            { matricula: parseInt(matricula), turmaId: parseInt(turmaId) }
        );
        
        await conn.commit();
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao cadastrar aluno" });
    }
});

// Importar alunos via CSV
app.post('/api/alunos/importar-csv', async (req: Request, res: Response) => {
    const { alunos, turmaId } = req.body; // alunos = [{matricula, nome}, ...]
    
    try {
        const conn = await getConnection();
        let importados = 0;
        let duplicados = 0;
        
        for (const aluno of alunos) {
            const { matricula, nome } = aluno;
            
            // Verificar se ja existe
            const verifica = await conn.execute(
                `SELECT COUNT(*) as total FROM NOTADEZ.MATRICULA m
                 JOIN NOTADEZ.ALUNOS a ON m.RA_ALUNO = a.RA_ALUNO
                 WHERE a.RA_ALUNO = :matricula AND m.ID_TURMA = :turmaId`,
                { matricula: parseInt(matricula), turmaId: parseInt(turmaId) }
            );
            
            if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
                duplicados++;
                continue; // Pula se ja existe (nao sobrescreve)
            }
            
            // Inserir aluno (se nao existir)
            try {
                await conn.execute(
                    `INSERT INTO NOTADEZ.ALUNOS (RA_ALUNO, NOME_ALUNO) VALUES (:matricula, :nome)`,
                    { matricula: parseInt(matricula), nome }
                );
            } catch(e) {
                // Se aluno ja existe, nao sobrescreve (fonte da verdade)
            }
            
            // Matricular
            try {
                await conn.execute(
                    `INSERT INTO NOTADEZ.MATRICULA (RA_ALUNO, ID_TURMA) VALUES (:matricula, :turmaId)`,
                    { matricula: parseInt(matricula), turmaId: parseInt(turmaId) }
                );
                importados++;
            } catch(e) {
                // Se ja esta matriculado, conta como duplicado
                duplicados++;
            }
        }
        
        await conn.commit();
        await conn.close();
        
        res.json({ sucesso: true, importados, duplicados });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao importar alunos" });
    }
});

// Excluir aluno
app.delete('/api/alunos/:ra/:turmaId', async (req: Request, res: Response) => {
    const { ra, turmaId } = req.params;
    
    try {
        const conn = await getConnection();
        await conn.execute(
            `DELETE FROM NOTADEZ.MATRICULA WHERE RA_ALUNO = :ra AND ID_TURMA = :turmaId`,
            { ra: parseInt(ra), turmaId: parseInt(turmaId) },
            { autoCommit: true }
        );
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao excluir aluno" });
    }
});

// ========== COMPONENTES DE NOTA ==========

// Listar componentes de uma disciplina
app.get('/api/componentes/:disciplinaId', async (req: Request, res: Response) => {
    const { disciplinaId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT ID_COMPONENTE, NOME_COMPONENTE, SIGLA_COMPONENTE, DESCRICAO
             FROM NOTADEZ.COMPONENTES_NOTA
             WHERE ID_DISCIPLINA = :disciplinaId`,
            { disciplinaId: parseInt(disciplinaId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar componentes" });
    }
});

// Criar componente
app.post('/api/componentes', async (req: Request, res: Response) => {
    const { nome, sigla, descricao, disciplinaId } = req.body;
    
    try {
        const conn = await getConnection();
        await conn.execute(
            `INSERT INTO NOTADEZ.COMPONENTES_NOTA 
             (ID_DISCIPLINA, NOME_COMPONENTE, SIGLA_COMPONENTE, DESCRICAO) 
             VALUES (:discId, :nome, :sigla, :desc)`,
            { discId: parseInt(disciplinaId), nome, sigla, desc: descricao },
            { autoCommit: true }
        );
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao criar componente" });
    }
});

// ========== NOTAS ==========

// Buscar notas de uma turma
app.get('/api/notas/:turmaId', async (req: Request, res: Response) => {
    const { turmaId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT a.RA_ALUNO, a.NOME_ALUNO, n.ID_COMPONENTE, n.VALOR_NOTA, c.SIGLA_COMPONENTE
             FROM NOTADEZ.ALUNOS a
             JOIN NOTADEZ.MATRICULA m ON a.RA_ALUNO = m.RA_ALUNO
             LEFT JOIN NOTADEZ.NOTAS n ON a.RA_ALUNO = n.RA_ALUNO AND n.ID_TURMA = m.ID_TURMA
             LEFT JOIN NOTADEZ.COMPONENTES_NOTA c ON n.ID_COMPONENTE = c.ID_COMPONENTE
             WHERE m.ID_TURMA = :turmaId
             ORDER BY a.RA_ALUNO, c.ID_COMPONENTE`,
            { turmaId: parseInt(turmaId) }
        );
        
        await conn.close();
        res.json(result.rows || []);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar notas" });
    }
});

// Lancar ou atualizar nota
app.post('/api/notas', async (req: Request, res: Response) => {
    const { raAluno, turmaId, componenteId, valor } = req.body;
    
    try {
        const conn = await getConnection();
        
        // Verificar se nota ja existe
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.NOTAS 
             WHERE RA_ALUNO = :ra AND ID_TURMA = :turma AND ID_COMPONENTE = :comp`,
            { ra: parseInt(raAluno), turma: parseInt(turmaId), comp: parseInt(componenteId) }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            // Atualizar
            await conn.execute(
                `UPDATE NOTADEZ.NOTAS SET VALOR_NOTA = :valor 
                 WHERE RA_ALUNO = :ra AND ID_TURMA = :turma AND ID_COMPONENTE = :comp`,
                { valor: parseFloat(valor), ra: parseInt(raAluno), turma: parseInt(turmaId), comp: parseInt(componenteId) },
                { autoCommit: true }
            );
        } else {
            // Inserir
            await conn.execute(
                `INSERT INTO NOTADEZ.NOTAS (RA_ALUNO, ID_TURMA, ID_COMPONENTE, VALOR_NOTA) 
                 VALUES (:ra, :turma, :comp, :valor)`,
                { ra: parseInt(raAluno), turma: parseInt(turmaId), comp: parseInt(componenteId), valor: parseFloat(valor) },
                { autoCommit: true }
            );
        }
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao salvar nota" });
    }
});

// ========== FORMULA DE NOTA FINAL ==========

// Salvar formula
app.post('/api/formula-nota-final', async (req: Request, res: Response) => {
    const { disciplinaId, tipoFormula, formulaText } = req.body;
    
    try {
        const conn = await getConnection();
        
        // Verificar se ja existe
        const verifica = await conn.execute(
            `SELECT COUNT(*) as total FROM NOTADEZ.FORMULA_NOTA_FINAL 
             WHERE ID_DISCIPLINA = :discId`,
            { discId: parseInt(disciplinaId) }
        );
        
        if (verifica.rows && verifica.rows[0] && verifica.rows[0][0] > 0) {
            // Atualizar
            await conn.execute(
                `UPDATE NOTADEZ.FORMULA_NOTA_FINAL 
                 SET TIPO_FORMULA = :tipo, FORMULA_TEXT = :formula 
                 WHERE ID_DISCIPLINA = :discId`,
                { tipo: tipoFormula, formula: formulaText, discId: parseInt(disciplinaId) },
                { autoCommit: true }
            );
        } else {
            // Inserir
            await conn.execute(
                `INSERT INTO NOTADEZ.FORMULA_NOTA_FINAL 
                 (ID_DISCIPLINA, TIPO_FORMULA, FORMULA_TEXT) 
                 VALUES (:discId, :tipo, :formula)`,
                { discId: parseInt(disciplinaId), tipo: tipoFormula, formula: formulaText },
                { autoCommit: true }
            );
        }
        
        await conn.close();
        res.json({ sucesso: true });
    } catch(err) {
        res.status(500).json({ erro: "Erro ao salvar formula" });
    }
});

// Buscar formula
app.get('/api/formula-nota-final/:disciplinaId', async (req: Request, res: Response) => {
    const { disciplinaId } = req.params;
    
    try {
        const conn = await getConnection();
        const result = await conn.execute(
            `SELECT TIPO_FORMULA, FORMULA_TEXT 
             FROM NOTADEZ.FORMULA_NOTA_FINAL 
             WHERE ID_DISCIPLINA = :discId`,
            { discId: parseInt(disciplinaId) }
        );
        
        await conn.close();
        if (result.rows && result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json(null);
        }
    } catch(err) {
        res.status(500).json({ erro: "Erro ao buscar formula" });
    }
});

// ========== EXPORTACAO CSV ==========

app.get('/api/exportar-csv/:turmaId', async (req: Request, res: Response) => {
    const { turmaId } = req.params;
    
    try {
        const conn = await getConnection();
        
        // Buscar alunos e notas
        const alunos = await conn.execute(
            `SELECT DISTINCT a.RA_ALUNO, a.NOME_ALUNO 
             FROM NOTADEZ.ALUNOS a
             JOIN NOTADEZ.MATRICULA m ON a.RA_ALUNO = m.RA_ALUNO
             WHERE m.ID_TURMA = :turmaId`,
            { turmaId: parseInt(turmaId) }
        );
        
        // Buscar componentes
        const componentes = await conn.execute(
            `SELECT DISTINCT c.ID_COMPONENTE, c.SIGLA_COMPONENTE
             FROM NOTADEZ.COMPONENTES_NOTA c
             JOIN NOTADEZ.DISCIPLINA d ON c.ID_DISCIPLINA = d.ID_DISCIPLINA
             JOIN NOTADEZ.TURMA_DISCIPLINA td ON d.ID_DISCIPLINA = td.ID_DISCIPLINA
             WHERE td.ID_TURMA = :turmaId`,
            { turmaId: parseInt(turmaId) }
        );
        
        // Verificar se todas as notas foram lancadas
        for (const aluno of alunos.rows || []) {
            for (const comp of componentes.rows || []) {
                const nota = await conn.execute(
                    `SELECT VALOR_NOTA FROM NOTADEZ.NOTAS 
                     WHERE RA_ALUNO = :ra AND ID_TURMA = :turma AND ID_COMPONENTE = :comp`,
                    { ra: aluno[0], turma: parseInt(turmaId), comp: comp[0] }
                );
                
                if (!nota.rows || nota.rows.length === 0) {
                    await conn.close();
                    return res.json({ 
                        sucesso: false, 
                        mensagem: "Nem todas as notas foram lancadas" 
                    });
                }
            }
        }
        
        // Gerar CSV
        let csv = "Matricula,Nome";
        for (const comp of componentes.rows || []) {
            csv += `,${comp[1]}`;
        }
        csv += ",Nota Final\n";
        
        for (const aluno of alunos.rows || []) {
            csv += `${aluno[0]},${aluno[1]}`;
            let soma = 0;
            let count = 0;
            
            for (const comp of componentes.rows || []) {
                const nota = await conn.execute(
                    `SELECT VALOR_NOTA FROM NOTADEZ.NOTAS 
                     WHERE RA_ALUNO = :ra AND ID_TURMA = :turma AND ID_COMPONENTE = :comp`,
                    { ra: aluno[0], turma: parseInt(turmaId), comp: comp[0] }
                );
                
                const valor = nota.rows && nota.rows[0] ? nota.rows[0][0] : 0;
                csv += `,${valor}`;
                soma += parseFloat(valor);
                count++;
            }
            
            const media = count > 0 ? (soma / count).toFixed(2) : "0.00";
            csv += `,${media}\n`;
        }
        
        await conn.close();
        
        // Nome do arquivo
        const agora = new Date();
        const nomeArquivo = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}_${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}${String(agora.getSeconds()).padStart(2,'0')}-Turma${turmaId}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        res.send(csv);
    } catch(err) {
        res.status(500).json({ erro: "Erro ao exportar CSV" });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log("Servidor rodando na porta 3000");
});
