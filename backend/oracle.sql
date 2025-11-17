/*
    Autor: Bernardo Castro Brandao de Oliveira
    Arquivo: app.css
    Descrição: Protótipo CSS do sistema NotaDez. Contém a estilização de telas de login, cadastro de usuário, cadastro de instituições, disciplinas/turmas, cadastro de alunos, painel de auditoria e botões de exportação. 
*/

-- Criar usuário e tablespace

create user notadez identified by secretmypass;
grant connect, resource, create table, create view, create sequence, create trigger to notadez;

create tablespace data datafile 'C:\app\Usuario\product\21c\oradata\XE\data.dbf'
size 100M autoextend on;

alter user notadez default tablespace data temporary tablespace temp;
alter user notadez quota unlimited on data;

-------------------------------------------------------------------------------
-- TABELA DOCENTES
-------------------------------------------------------------------------------

CREATE TABLE notadez.docentes (
   id_docente NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   nome_docente VARCHAR2(100) NOT NULL,
   email_docente VARCHAR2(100) UNIQUE,
   senha VARCHAR2(100) NOT NULL,
   telefone_docente VARCHAR2(20),
   data_cadastro DATE DEFAULT CURRENT_DATE
);

-------------------------------------------------------------------------------
-- INSTITUIÇÕES
-------------------------------------------------------------------------------

CREATE TABLE notadez.instituicoes (
  id_instituicao NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_instituicao VARCHAR2(100) NOT NULL
);

-------------------------------------------------------------------------------
-- CURSOS
-------------------------------------------------------------------------------

CREATE TABLE notadez.cursos (
  id_curso NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_curso VARCHAR2(100) NOT NULL,
  id_instituicao NUMBER NOT NULL,
  FOREIGN KEY (id_instituicao) REFERENCES notadez.instituicoes(id_instituicao)
);

-------------------------------------------------------------------------------
-- DISCIPLINAS
-------------------------------------------------------------------------------

CREATE TABLE notadez.disciplinas (
  id_disciplina NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sigla_disciplina VARCHAR2(20) NOT NULL,
  nome_disciplina VARCHAR2(100) NOT NULL,
  periodo VARCHAR2(20) NOT NULL,   -- CORRIGIDO! DATE NÃO FAZ SENTIDO
  FOREIGN KEY (id_curso) REFERENCES notadez.cursos(id_curso)
);

-------------------------------------------------------------------------------
-- TURMAS
-------------------------------------------------------------------------------

CREATE TABLE notadez.turmas (
  id_turma NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_turma VARCHAR2(100) NOT NULL,
  horario_aula VARCHAR2(20) NOT NULL,
  local_aula VARCHAR2(100) NOT NULL,
  dia_aula VARCHAR2(20) NOT NULL
);

-------------------------------------------------------------------------------
-- ALUNOS
-------------------------------------------------------------------------------

CREATE TABLE notadez.alunos (
  ra_aluno NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_aluno VARCHAR2(100) NOT NULL
);

-------------------------------------------------------------------------------
-- COMPONENTES DE NOTA
-------------------------------------------------------------------------------

CREATE TABLE notadez.componentes_nota (
  id_componente NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_disciplina NUMBER NOT NULL,
  nome_componente VARCHAR2(100) NOT NULL,
  descricao VARCHAR2(255) NOT NULL,
  sigla_componente VARCHAR2(20) NOT NULL,
  FOREIGN KEY (id_disciplina) REFERENCES notadez.disciplinas(id_disciplina)
);

-------------------------------------------------------------------------------
-- FORMULA NOTA FINAL
-------------------------------------------------------------------------------

CREATE TABLE notadez.formula_nota_final (
  id_formula NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_disciplina NUMBER NOT NULL,
  tipo_formula VARCHAR2(50) NOT NULL,
  peso_p1 NUMBER,
  peso_p2 NUMBER,
  peso_p3 NUMBER,
  formula_text VARCHAR2(255),
  FOREIGN KEY (id_disciplina) REFERENCES notadez.disciplinas(id_disciplina)
);

-------------------------------------------------------------------------------
-- NOTAS (CORRIGIDA!)
-------------------------------------------------------------------------------

CREATE TABLE notadez.notas (
  id_nota NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ra_aluno NUMBER NOT NULL,
  id_componente NUMBER NOT NULL,
  id_turma NUMBER NOT NULL,
  valor_final NUMBER NOT NULL,
  data_lancamento DATE DEFAULT CURRENT_DATE,
  FOREIGN KEY (ra_aluno) REFERENCES notadez.alunos(ra_aluno),
  FOREIGN KEY (id_componente) REFERENCES notadez.componentes_nota(id_componente),
  FOREIGN KEY (id_turma) REFERENCES notadez.turmas(id_turma)
);

-------------------------------------------------------------------------------
-- AUDITORIA DE NOTAS
-------------------------------------------------------------------------------

CREATE TABLE notadez.auditoria_notas (
  id_auditoria NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ra_aluno NUMBER NOT NULL,
  id_componente NUMBER NOT NULL,
  id_docente NUMBER NOT NULL,
  valor_antigo NUMBER NOT NULL,
  valor_novo NUMBER NOT NULL,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_turma NUMBER NOT NULL,
  id_disciplina NUMBER NOT NULL,
  FOREIGN KEY (ra_aluno) REFERENCES notadez.alunos(ra_aluno),
  FOREIGN KEY (id_componente) REFERENCES notadez.componentes_nota(id_componente),
  FOREIGN KEY (id_docente) REFERENCES notadez.docentes(id_docente)
);

-------------------------------------------------------------------------------
-- TABELAS ASSOCIATIVAS
-------------------------------------------------------------------------------

CREATE TABLE notadez.cadastro (
  id_docente NUMBER NOT NULL,
  id_instituicao NUMBER NOT NULL,
  PRIMARY KEY (id_docente, id_instituicao),
  FOREIGN KEY (id_docente) REFERENCES notadez.docentes(id_docente),
  FOREIGN KEY (id_instituicao) REFERENCES notadez.instituicoes(id_instituicao)
);

CREATE TABLE notadez.matriculam (
  id_turma NUMBER NOT NULL,
  ra_aluno NUMBER NOT NULL,
  PRIMARY KEY (id_turma, ra_aluno),
  FOREIGN KEY (id_turma) REFERENCES notadez.turmas(id_turma),
  FOREIGN KEY (ra_aluno) REFERENCES notadez.alunos(ra_aluno)
);

CREATE TABLE notadez.turma_disciplina (
  id_disciplina NUMBER NOT NULL,
  id_turma NUMBER NOT NULL,
  PRIMARY KEY (id_disciplina, id_turma),
  FOREIGN KEY (id_disciplina) REFERENCES notadez.disciplinas(id_disciplina),
  FOREIGN KEY (id_turma) REFERENCES notadez.turmas(id_turma)
);