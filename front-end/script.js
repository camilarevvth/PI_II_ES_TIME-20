
/*
    Autor: Gustavo Santos de Oliveira
    Arquivo: script.js
    Descrição: Este arquivo contém todas as funções e interações do sistema.
*/

// ==== VARIÁVEIS GLOBAIS ====
// Guardam informações importantes que serão usadas em várias partes do código
let usuario = null;       // guarda dados do usuário logado
let selec_ins = null;     // guarda a instituição selecionada
let selec_cur = null;     // guarda o curso selecionado
let selec_dis = null;     // guarda a disciplina selecionada
let selec_tur = null;     // guarda a turma selecionada

// ==== FUNÇÕES DE EVENT LISTENERS ====
// Função para inicializar todos os botões da página
function inicializarEventListeners() {

    // ===== INSTITUIÇÕES =====
    // Pega o botão "Enviar Instituição" e adiciona uma função que roda quando clicado
    const enviarInstituicaoBtn = document.getElementById("enviar-instituicao");
    if (enviarInstituicaoBtn) {
        enviarInstituicaoBtn.addEventListener('click', (e) => {
            e.preventDefault(); // impede que o botão faça ação padrão (tipo recarregar a página)
            const nome = document.getElementById("nome-instituicao").value; // pega o nome digitado

            enviarinstituicao(nome).then(resultado => { // chama a função que envia os dados pro backend
                if(resultado && resultado.confirm){
                    atualizarinstituicoes(); // atualiza a lista de instituições na tela
                    document.getElementById("confirm-instituicao").innerText = "instituição adicionada";
                } else {
                    document.getElementById("confirm-instituicao").innerText = "não foi possivel criar a instituição";
                }
            });
        });
    }

    // Botão para excluir instituição (mesma lógica que enviar)
    const excluirInstituicaoBtn = document.getElementById("excluir-instituicao");
    if (excluirInstituicaoBtn) {
        excluirInstituicaoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-instituicao").value;

            excluirinstituicao(nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarinstituicoes();
                    document.getElementById("confirm-instituicao").innerText = "instituição excluida";
                } else {
                    document.getElementById("confirm-instituicao").innerText = "não foi possivel excluir a instituição";
                }
            });
        });
    }

    // ===== CURSOS =====
    // Mesmo padrão dos botões de instituição, só muda o nome e a função chamada
    const enviarCursoBtn = document.getElementById("enviar-curso");
    if (enviarCursoBtn) {
        enviarCursoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-curso").value;

            enviarcurso(nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarcursos();
                    document.getElementById("confirm-curso").innerText = resultado.mensagem || "Curso adicionado";
                } else {
                    document.getElementById("confirm-curso").innerText = resultado ? resultado.mensagem : "Erro ao adicionar curso";
                }
            });
        });
    }

    // Botão excluir curso
    const excluirCursoBtn = document.getElementById("excluir-curso");
    if (excluirCursoBtn) {
        excluirCursoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-curso").value;

            excluircurso(nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarcursos();
                    document.getElementById("confirm-curso").innerText = resultado.mensagem || "Curso excluído";
                } else {
                    document.getElementById("confirm-curso").innerText = resultado ? resultado.mensagem : "Erro ao excluir curso";
                }
            });
        });
    }

    // ===== DISCIPLINAS =====
    const enviarDisciplinaBtn = document.getElementById("enviar-disciplina");
    if (enviarDisciplinaBtn) {
        enviarDisciplinaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const sigla = document.getElementById("sigla-disciplina").value;
            const nome = document.getElementById("nome-disciplina").value;
            const periodo = document.getElementById("periodo-disciplina").value;

            enviardiscplina(sigla, nome, periodo).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizardisciplinas();
                    document.getElementById("confirm-disciplina").innerText = resultado.mensagem || "Disciplina adicionada";
                } else {
                    document.getElementById("confirm-disciplina").innerText = resultado ? resultado.mensagem : "Erro ao adicionar disciplina";
                }
            });
        });
    }

    const excluirDisciplinaBtn = document.getElementById("excluir-disciplina");
    if (excluirDisciplinaBtn) {
        excluirDisciplinaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-disciplina").value;

            excluirdisciplina(nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizardisciplinas();
                    document.getElementById("confirm-disciplina").innerText = resultado.mensagem || "Disciplina excluída";
                } else {
                    document.getElementById("confirm-disciplina").innerText = resultado ? resultado.mensagem : "Erro ao excluir disciplina";
                }
            });
        });
    }

    // ===== TURMAS =====
    const enviarTurmaBtn = document.getElementById("enviar-turma");
    if (enviarTurmaBtn) {
        enviarTurmaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-turma").value;
            const horario = document.getElementById("horario-turma").value;
            const local = document.getElementById("local-turma").value;
            const dia = document.getElementById("dia-turma").value;

            adicionarturma(nome, horario, local, dia).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarturmas();
                    document.getElementById("confirm-turma").innerText = resultado.mensagem || "Turma adicionada";
                } else {
                    document.getElementById("confirm-turma").innerText = resultado ? resultado.mensagem : "Erro ao adicionar turma";
                }
            });
        });
    }

    const excluirTurmaBtn = document.getElementById("excluir-turma");
    if (excluirTurmaBtn) {
        excluirTurmaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-turma").value;

            excluirturma(nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarturmas();
                    document.getElementById("confirm-turma").innerText = resultado.mensagem || "Turma excluída";
                } else {
                    document.getElementById("confirm-turma").innerText = resultado ? resultado.mensagem : "Erro ao excluir turma";
                }
            });
        });
    }

    // ===== ALUNOS =====
    const enviarAlunoBtn = document.getElementById("enviar-aluno");
    if (enviarAlunoBtn) {
        enviarAlunoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const matricula = document.getElementById("matricula-aluno").value;
            const nome = document.getElementById("nome-aluno").value;

            adicionaraluno(matricula, nome).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarnotas();
                    const confirmAluno = document.getElementById("confirm-aluno");
                    if (confirmAluno) {
                        confirmAluno.innerText = resultado.mensagem || "Aluno adicionado";
                    }
                } else {
                    const confirmAluno = document.getElementById("confirm-aluno");
                    if (confirmAluno) {
                        confirmAluno.innerText = resultado ? resultado.mensagem : "Erro ao adicionar aluno";
                    }
                }
            });
        });
    }

    // ===== COMPONENTES =====
    const enviarComponenteBtn = document.getElementById("enviar_componente");
    if (enviarComponenteBtn) {
        enviarComponenteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome-componente").value;
            const sigla = document.getElementById("sigla-componente").value;
            const peso = document.getElementById("peso-componente") ? document.getElementById("peso-componente").value : null;

            adicionarcomponente(nome, sigla, peso).then(resultado => {
                if(resultado && resultado.confirm){
                    atualizarnotas();
                    const confirmComponente = document.getElementById("confirm-componente");
                    if (confirmComponente) {
                        confirmComponente.innerText = resultado.mensagem || "Componente adicionado";
                    }
                } else {
                    const confirmComponente = document.getElementById("confirm-componente");
                    if (confirmComponente) {
                        confirmComponente.innerText = resultado ? resultado.mensagem : "Erro ao adicionar componente";
                    }
                }
            });
        });
    }
}

// ==== FLUXO DE TELAS ====
// Funções que mostram ou escondem seções da página
function trocartela(pritela, segtela){
    pritela.classList.add("suspenso"); // esconde a tela atual
    segtela.classList.remove("suspenso"); // mostra a próxima tela
}

function fluxotelas(){
    // Botão voltar do cadastro pro login
    const voltarLoginBtn = document.getElementById("voltar-login");
    if (voltarLoginBtn) {
        voltarLoginBtn.addEventListener("click", () => trocartela(
                document.getElementById("cadastro"),
                document.getElementById("login")
            ));
    }

    // Botão voltar do login pro cadastro
    const voltarCadastroBtn = document.getElementById("voltar-cadastro");
    if (voltarCadastroBtn) {
        voltarCadastroBtn.addEventListener("click", () => trocartela(
                document.getElementById("login"),
                document.getElementById("cadastro")
            ));
    }

    // Botão para cadastrar usuário
    const enviarCadastroBtn = document.getElementById("enviar-cadastro");
    if (enviarCadastroBtn) {
        enviarCadastroBtn.addEventListener("click", (e) => {
            e.preventDefault();
            comfirmarcadastro();
        });
    }

    // Botão para login
    const enviarLoginBtn = document.getElementById("enviar-login");
    if (enviarLoginBtn) {
        enviarLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            comfirmarlogin().then(resultado => {
                if(resultado && resultado.confirm){
                    usuario = resultado.usuario;
                    const loginConfirm = document.getElementById("login-confirm");
                    if (loginConfirm) {
                        loginConfirm.innerText = resultado.mensagem || "Login realizado com sucesso";
                    }

                    trocartela(
                        document.getElementById("login"),
                        document.getElementById("gerenciar-instituicoes"));

                    atualizarinstituicoes();
                } else {
                    const loginConfirm = document.getElementById("login-confirm");
                    if (loginConfirm) {
                        loginConfirm.innerText = resultado ? resultado.mensagem : "Erro ao fazer login";
                    }
                    console.log(resultado ? resultado.mensagem : "Erro desconhecido");
                }
            });
        });
    }
}

// ==== INICIALIZAÇÃO ====
// Chama todas as funções quando a página carrega
function inicializar() {
    fluxotelas();               // configura o fluxo das telas
    inicializarEventListeners(); // adiciona todos os event listeners
}

// Espera o DOM carregar, se já carregou executa imediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

/*
OBS: Estrutura dos arquivos do projeto

/backend
    |- dist             // arquivos compilados
    |- src              // código-fonte
        |- server.ts    // servidor Node.js
    |- oracle.sql       // scripts do banco de dados
    |- package.json     // dependências e scripts
    |- package-lock.json
    |- tsconfig.json    // configuração do TypeScript

/frontend
    |- app.css          // estilos da página
    |- index.html       // página principal
    |- script.js        // este arquivo com as funções JS
*/
