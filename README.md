# Sistema NotaDez

## Descrição
Descrição do Projeto

O NotaDez é um sistema web desenvolvido para facilitar a gestão de notas e informações de turmas acadêmicas. Ele permite que docentes se cadastrem e organizem suas disciplinas, turmas e estudantes de maneira simples e eficiente. Através da plataforma, os professores podem:

Gerenciar instituições, cursos, disciplinas e turmas, incluindo a criação e exclusão de turmas.

Cadastrar e importar alunos para turmas via arquivos CSV .

Cadastrar componentes de nota, como provas e atividades, e calcular automaticamente as notas finais dos alunos com base em uma fórmula escolhida pelo docente.

Auditoria de notas é uma parte do trabalho na qual especifica quem foi o aluno que tirou a nota especificada da disciplina.

Exportar as notas para arquivos CSV 

O sistema foi desenvolvido utilizando Node.js com TypeScript para o backend, HTML, CSS,  e um banco de dados (Oracle) para armazenamento de dados.

## Equipe
- Camila Fernandes Costacurta — RA: 25012949
- Bernardo Castro Brandão de Oliveira — RA: 25014953
- Demétrius valverde Ferreira corradi Junqueira — RA: 25015035
- Gustavo Santos de Oliveira — RA: 25004239
- Matheus Azevedo Teixeira - RA:25014927

## Tecnologias Utilizadas
- **Backend:** Node.js com TypeScript e Express
- **Banco de Dados:** Oracle Database
- **Frontend:** HTML5, CSS3 e JavaScript

## Pré-requisitos
- Node.js (versão LTS)
- Oracle Database instalado e configurado
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
   - Execute o script `oracle.sql` no Oracle Database
   - Ajuste as credenciais em `src/server.ts` 

4. Inicie o servidor:
```bash
npm start
```

5. Abra o arquivo `front-end/index.html` no navegador

## Estrutura do Projeto
```
backend/
├── src/
     └── server.ts       # Servidor backend com todas as rotas
├── oracle.sql          # Script de criação do banco de dados
├── package.json
└── tsconfig.json

front-end/
└── index.html          # Interface frontend

```

## Funcionalidades
- Login e cadastro de docentes
- Cadastro de instituições, disciplinas e turmas
- Importação de alunos via CSV
- Cadastro de componentes de nota
- Lançamento de notas por componente
- Cálculo automático de notas finais (média aritmética ou ponderada)
- Exportação de notas em CSV
- Validações de exclusão (não permite excluir turma com notas)

## Configuração do Banco de Dados
O sistema utiliza o usuário `NOTADEZ` no Oracle Database. Certifique-se de:
1. Criar o usuário conforme o script `oracle.sql`
2. Ajustar a string de conexão em `src/server.ts` conforme seu ambiente

## Desenvolvimento
Para desenvolvimento com hot-reload:
```bash
npm run dev
```

## Observações
- O sistema valida exclusões para evitar perda de dados
- A importação CSV considera apenas as 2 primeiras colunas (matrícula e nome)
- Notas devem estar entre 0.00 e 10.00
- A exportação CSV só funciona quando todas as notas foram lançadas







