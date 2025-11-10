# Sistema NotaDez

## Descrição
Sistema para gerenciamento de notas acadêmicas desenvolvido como Projeto Integrador 2.

## Equipe
[Adicione os nomes dos integrantes da equipe aqui]

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
   - Ajuste as credenciais em `backend.ts` (linha 16-20)

4. Inicie o servidor:
```bash
npm start
```

5. Abra o arquivo `parte.html` no navegador

## Estrutura do Projeto
```
backend/
├── backend.ts          # Servidor backend com todas as rotas
├── parte.html          # Interface frontend
├── oracle.sql          # Script de criação do banco de dados
├── package.json        # Dependências do projeto
└── tsconfig.json       # Configuração TypeScript
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
2. Ajustar a string de conexão em `backend.ts` conforme seu ambiente

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

