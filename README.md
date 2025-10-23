# ES-PI2-2025-T2-G20
# Nome do Projeto
NotaDez 

## Integrantes
- **Camila Fernandes Costacurta** — RA: 25012949  
- **Bernardo Castro Brandão de Oliveira** — RA: 25014953 
- **Nome3** — RA: 000000
- **Gustavo Santos de Oliveira** — RA: 25004239

## 1. Objetivo
 plataforma web para professores gerenciarem turmas, alunos e nota.

## 2. Tecnologias
- **Backend**: Node.js + TypeScript  
- **Frontend**: HTML5, CSS3 (opcional: Bootstrap)  
- **Banco de Dados**: PostgreSQL ou MySQL
  

## 3. Como executar
### Backend
cd backend
npm install
npm run dev

## 4. Branches
Cada funcionalidade será desenvolvida em uma branch separada.  
Exemplos:  
- `feature/autenticacao`  
- `feature/turmas`  
- `feature/notas`  

Depois, será feito merge para a branch principal (`main`) via *pull request*.
## 5. Autoria dos arquivos
Cada artefato (HTML, CSS, TypeScript, etc.) terá o autor identificado no topo do arquivo.  

Exemplo:

// Autor: Camila Revvth — RA: 25012949
//## Como rodar o projeto completo
1. Clone o repositório:
   git clone https://github.com/camilarevvth/ES-PI2-2025-TX-GXX.git
2. Configure o banco de dados
3. Rode o backend:
   cd backend
   npm install
   npm run dev
4. Abra o frontend:
   cd frontend
   abrir index.html

## 6. Banco de Dados
### Modelos SQL (BR Modelo)
Modelo Conceitual: <img width="1187" height="473" alt="Captura de tela 2025-10-18 180321" src="https://github.com/user-attachments/assets/029dea23-7e0c-4a5a-a9ee-9344b1a722fe" />

Modelo Logico: <img width="854" height="478" alt="Captura de tela 2025-10-18 184956" src="https://github.com/user-attachments/assets/4403e3ff-3b0b-427e-8f1c-2586e1211096" />

Modelo Físico (MysSQL Workbench):

CREATE TABLE Docentes 
( 
 id_docente INT PRIMARY KEY,  
 nome_docente varchar(100),  
 senha varchar(100)
); 
select * from Docentes;


CREATE TABLE Instituicao 
( 
 id_instituicao INT PRIMARY KEY,  
 nome_instituicao varchar(100)
); 
select * from Instituicao;


CREATE TABLE Cursos 
( 
 id_curso INT PRIMARY KEY,  
 nome_curso varchar(100)
); 
select * from Cursos;


CREATE TABLE Turmas 
( 
 id_turma INT PRIMARY KEY,  
 nome_turma varchar(100),  
 dia_aula date,  
 local_aula varchar(100),  
 horario_aula varchar(100),  
 id_Aluno INT
);
select * from Turmas;
 

CREATE TABLE Disciplinas 
( 
 id_disciplina INT PRIMARY KEY,  
 nome_disciplina varchar(100),  
 sigla_disciplina varchar(100),
 pediodo INT, 
 id_Turma INT
); 
select * from Disciplinas;


CREATE TABLE Componentes 
( 
 id_componente INT PRIMARY KEY,  
 nome_componente varchar(100),  
 media_final float
); 
select * from Componentes;


CREATE TABLE Notas_médias 
( 
 id_média INT primary KEY,  
 RA_aluno int,
 FOREIGN KEY (RA_aluno) REFERENCES Alunos(RA_aluno),
 fórmula float,  
 média_final float,  
 id_Componente INT 
); 
select * from Notas_médias;

CREATE TABLE Alunos 
( 
 RA_aluno INT PRIMARY KEY,  
 nome_aluno varchar(100) 
); 

CREATE TABLE Cadastro 
( 
 id_curso INT,
 id_instituicao int,  
 id_docente INT,
 primary key(id_curso, id_instituicao, id_docente),
 FOREIGN KEY (id_curso) REFERENCES Cursos(id_curso), 
 FOREIGN KEY (id_instituicao) REFERENCES Instituicao(id_instituicao),
 FOREIGN KEY (id_docente) REFERENCES Docentes(id_docente)
); 
select * from Cadastro;


CREATE TABLE Criar 
( 
 id_disciplina INT,  
 id_curso INT,
 primary key(id_disciplina, id_curso),
 foreign key (id_disciplina) references Disciplinas(id_disciplina),
 foreign key (id_curso) references Cursos(id_curso)
); 
select * from Criar;


CREATE TABLE Terão 
( 
 id_componente INT,  
 RA_aluno INT,
 primary key(id_componente, RA_aluno),
 foreign key (id_componente) references Componentes(id_componente),
 foreign key (RA_aluno) references Alunos(RA_aluno)
); 
select * from Terão;
