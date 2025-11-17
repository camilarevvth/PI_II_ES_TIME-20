/*
    Autor: Gustavo Santos de Oliveira
    Arquivo: script.js
    Descrição:  
*///dados temporarios

let usuario = null;
let selec_ins = null;
let selec_cur = null;
let selec_dis = null;
let selec_tur = null;


document.getElementById("enviar-instituicao").addEventListener('click', (e) => {
    const nome = document.getElementById("nome-instituicao").value;

    adicionarinstituicao(nome).then(resultado => {
        if(resultado.confirm){
            atualizarinstituicoes();
            document.getElementById("confirm-instituicao").innerText = "instituição adicionada";
        } else {
            document.getElementById("confirm-instituicao").innerText = "não foi possivel criar a instituição";
        }
    });
});
document.getElementById("excluir-instituicao").addEventListener('click', (e) => {
    const nome = document.getElementById("nome-instituicao").value;

    excluirinstituicao(nome).then(resultado => {
        if(resultado.confirm){
            atualizarinstituicoes();
            document.getElementById("confirm-instituicao").innerText = "instituição excluida";
        } else {
            document.getElementById("confirm-instituicao").innerText = "não foi possivel excluir a instituição";
        }
    });
});

document.getElementById("enviar-curso").addEventListener('click', (e) => {
    
});
document.getElementById("excluir-curso").addEventListener('click', (e) => {
    e.preventDefault();
});
document.getElementById("enviar-disciplina").addEventListener('click', (e) => {
    
});
document.getElementById("excluir-disciplina").addEventListener('click', (e) => {
    e.preventDefault();
});
document.getElementById("enviar-turma").addEventListener('click', (e) => {
    
});
document.getElementById("excluir-turma").addEventListener('click', (e) => {
    
});

// ======== FLUXO DE TELAS ========

//função troca tela pra outra
function trocartela(pritela, segtela){
    pritela.classList.add("suspenso");
    segtela.classList.remove("suspenso");
}

//fluxo de telas
function fluxotelas(){
    //registro de usuários
    document.getElementById("voltar-login").addEventListener("click", () => trocartela(
            document.getElementById("cadastro"),
            document.getElementById("login")
        ));

    document.getElementById("voltar-cadastro").addEventListener("click", () => trocartela(
            document.getElementById("login"),
            document.getElementById("cadastro")
        ));

    document.getElementById("enviar-cadastro").addEventListener("click", () => {comfirmarcadastro()});

    //disciplinas e turmas
    document.getElementById("enviar-login").addEventListener("click", () => { 
        comfirmarlogin().then(resultado => {
            if(resultado.confirm){
            usuario = resultado.usuario;
            document.getElementById("login-comfirmar").innerText = resultado.mensagem;

            trocartela(
                document.getElementById("login"),
                document.getElementById("gerenciar-instituicoes"));

            document.getElementById("enviar-instituicao").addEventListener("click", () => inseririnstituicao());

            atualizardisciplinas();
        } else {
            console.log(resultado.mensagem);
        }
        })
    });
}

// ======== GERENCIAMENTO DE INSTITUIÇÕES ========

//mostrar instituicoes
function atualizarinstituicoes(){
    const ins_conteiner = document.getElementById("instituicoes-conteiner");

    ins_conteiner.innerHTML = '';

    buscarinstituicoes().then(instituicoes => {
        instituicoes.forEach(instituicao => {
            const h2_ins = document.createElement("h2");

            h2_ins.innerText = instituicao[1];
            h2_ins.classList.add("instituicao");

            div_ins.appendChild(h2_ins);

            h2_ins.addEventListener('click', (e) => {

                selec_ins = instituicao;
                
                trocartela(
                    document.getElementById("gerenciar-instituicoes"),
                    document.getElementById("gerenciar-cursos")
                );

                atualizarcursos();
            })
        });
    });
}

//mostrar cursos
function atualizarcursos(){
    const cur_conteiner = document.getElementById("cursos-conteiner");

    cur_conteiner.innerHTML = '';

    buscarcursos().then(cursos => {
        cursos.forEach(curso => {
            const h2_cur = document.createElement("h2");

            h2_cur.innerText = curso[1];
            h2_cur.classList.add("curso");

            cur_conteiner.appendChild(h2_cur);

            h2_cur.addEventListener('click', (e) => {

                selec_cur = curso;
                
                trocartela(
                    document.getElementById("gerenciar-cursos"),
                    document.getElementById("gerenciar-disciplinas")
                );

                atualizardisciplinas();
            })
        });
    });
}

//mostrar disciplinas
function atualizardisciplinas(){
    const dis_conteiner = document.getElementById("disciplinas-conteiner");

    dis_conteiner.innerHTML = '';

    buscardisciplinas().then(disciplinas => {
        disciplinas.forEach(disciplina => {
            const h2_dis = document.createElement("h2");

            h2_dis.innerText = `${disciplina[1]}(${disciplina[2]})périodo`;
            h2_dis.classList.add("disciplina");

            dis_conteiner.appendChild(h2_dis);

            h2_dis.addEventListener('click', (e) => {

                selec_dis = disciplina;
                
                trocartela(
                    document.getElementById("gerenciar-disciplinas"),
                    document.getElementById("gerenciar-turmas")
                );

                atualizarturmas();
            })
        });
    });
}

//mostrar turmas
function atualizarturmas(){
    const tur_conteiner = document.getElementById("turmas-conteiner");

    tur_conteiner.innerHTML = '';

    buscarturmas().then(turmas => {
        turmas.forEach(turma => {
            const h2_tur = document.createElement("h2");

            h2_tur.innerText = `${disciplina[1]}`;
            h2_tur.classList.add("turma");

            tur_conteiner.appendChild(h2_dis);

            h2_tur.addEventListener('click', (e) => {

                selec_tur = turma;
                
                trocartela(
                    document.getElementById("gerenciar-turmas"),
                    document.getElementById("gerenciar-notas")
                );

                atualizarnotas();
            })
        });
    });
}

// ======== GERENCIAMENTO DE DISCIPLINAS ========

//mostrar disciplinas
function atualizardisciplinas(){

    const dis_conteiner = document.getElementById("disciplina-conteiner");

    dis_conteiner.innerHTML = "";

    buscardisciplinas().then(resultado => {
        resultado.rows.forEach(disciplina => {
            const div_dis = document.createElement("div");
            const h2_dis = document.createElement("h2");
            const tur_conteiner = document.createElement("div");

            h2_dis.innerText = `${disciplina[1]}(${disciplina[2]})`;
            div_dis.appendChild(h2_dis);
            div_dis.appendChild(tur_conteiner);

            dis_conteiner.appendChild(div_dis);

            h2_dis.addEventListener('click', (e) => {
                if(selec_dis != null){
                    if(selec_dis == disciplina){
                        tur_conteiner.innerHTML = '';
                    } else {
                        selec_dis = disciplina;

                        mostrarturmas();
                    }
                } else {
                    selec_dis = disciplina;

                    mostrarturmas();
                }
            });
        });
    });

    
}

//inserir disciplinas
function inserirdisciplina(){
    const form_disciplina = document.getElementById("form-disciplina").value;

    

    atualizardisciplinas();
}

//mostrar turmas ao selecionar a disciplina
function mostrarturmas(){
    const dis_conteiner = document.getElementById("disciplina-conteiner");
    const tur_conteiner = dis_conteiner.querySelector(".turma-conteiner");
    tur_conteiner.innerHTML = "";

    buscarturmas().then(turmas => {
        turmas.forEach(turma => {
            const h3 = document.createElement("h3");
            h3.innerText = `${turma[1]} (${turma[2]}) ${turma[3]}`;

            h3.addEventListener("click", () => {
                selec_tur = turma;
                trocartela(
                    document.getElementById("gerenciar-disciplinas"),
                    document.getElementById("gerenciar-notas")
                );
                atualizarnotas();
            });

            tur_conteiner.appendChild(h3);
        });
    });
}


//==gerenciamento de notas==
//atualizar tabela
function atualizarnotas(){
    const tabela = document.getElementById("tabela");
    tabela.innerHTML = ""; // limpa tabela

    buscarnotas().then(informacoes => {
        informacoes.forEach(aluno => {
            const linha = tabela.insertRow();

            linha.insertCell(0).innerText = aluno.MATRICULA;
            linha.insertCell(1).innerText = aluno.NOME;
            linha.insertCell(2).innerText = aluno.VALOR_FINAL;
        });
    });
}


//adicionar aluno
function inseriraluno(){
    const matricula = document.getElementById("matricula-aluno").value;
    const nome = document.getElementById("nome-aluno").value;

    adicionaraluno(nome).then(resultado => {
        if(resultado.confirm){
            const tabela = document.getElementById("tabela");
            const linha = tabela.insertRow(-1);
            linha.insertCell(0).innerText = matricula;
            linha.insertCell(1).innerText = nome;
        } else {

        }
    });

}

//adicionar componente
async function adicionarcomponente(nome, peso, idTurma) {
    try {
        const response = await fetch("http://localhost:3000/adicionarcomponente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_componente: nome,
                peso_componente: peso,
                id_turma: idTurma
            })
        });

        const result = await response.json();
        console.log("Componente adicionado:", result);
        return result;
    } catch (error) {
        console.error("Erro ao adicionar componente:", error);
    }
}



//calcular nota final
async function calcularnotafinal(matricula) {
    try {
        const response = await fetch("http://localhost:3000/calcularnotafinal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula })
        });

        const result = await response.json();
        console.log("Nota final calculada:", result.valor_final);
        return result.valor_final;
    } catch (error) {
        console.error("Erro ao calcular nota final:", error);
    }
}


//editar nota
async function editarnota(matricula, idComponente, novaNota) {
    try {
        const response = await fetch("http://localhost:3000/editarnota", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                matricula: matricula,
                id_componente: idComponente,
                valor_nota: novaNota
            })
        });

        const result = await response.json();
        console.log("Nota editada:", result);

        //recalcular nota final automaticamente
        await calcularnotafinal(matricula);
        await atualizarnotas();
        return result;

    } catch (error) {
        console.error("Erro ao editar nota:", error);
    }
}


// ======== VALIDAÇÕES E GERENCIAMENTO DE DADOS========
//registro de usuarios
async function comfirmarcadastro(){
    try{
        const nome = document.getElementById("cadastronome").value;
        const email = document.getElementById("cadastroemail").value;
        const senha = document.getElementById("cadastrosenha").value;
        const telefone = document.getElementById("cadastrotelefone").value;

        const response = await fetch('http://localhost:3000/cadastrar', {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({nome, email, senha, telefone})
        });

        const resultado = await response.json();

        document.getElementById("cadastro-resultado").innerText = resultado.message;

        return resultado.confirm;

    } catch(err){
        console.log(err);
    }
}

async function comfirmarlogin() {
    try{
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;

    const response = await fetch('http://localhost:3000/login', {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({email, senha})
        });

        const resultado = await response.json();

        return resultado;
    } catch(err){
        console.log(err);
    }
}

//==gerenciamento de instituições==
//buscar instituições
async function buscarinstituicoes(){
    const id_usu = usuario[0];

    try{
        const response = await fetch('http://localhost:3000/buscartodasinstituicoes', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ id_docente : id_usu })
        });

        const resultado = await response.json();

        return resultado.rows;
    } catch(err){
        console.log(err);
    }
}

//adicionar instituição
async function enviarinstituicao(nome_instituicao){
    try{
        const response = await fetch('http://localhost:3000/adicionarinstituicao', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ nome_instituicao, id_usuario : usuario[0] })
        });

        const resultado = await response.json();

        return resultado;
    } catch(err){
        console.log(err);
    }
}

//apagar instituição
async function excluirinstituicao(nome_instituicao){
    try{
        const response = await fetch('http://localhost:3000/adicionarinstituicao', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ nome_instituicao, id_usuario : usuario[0] })
        });

        const resultado = await response.json();

        return resultado;
    } catch(err){
        console.log(err);
    }
}

//==gerenciamento de cursos==
//buscar cursos
async function buscarcursos(){
    const id_ins = selec_ins[0];

    try{
        const response = await fetch('http://localhost:3000/buscarcursos', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_ins })
        });

        const resultado = await response.json();

        return resultado.rows;
    } catch(err){
        console.log(err);
    }
}

//adicionar cursos
async function adicionarcurso(nome_cur){
    const id_ins = selec_ins[0];

    try{
        const response = await fetch('http://localhost:3000/adicionarcurso', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_ins, nome_cur })
        });

        const resultado = await response.json();

        return resultado;
    } catch(err){
        console.log(err);
    }
}

//==gerenciamento de disciplinas==
//buscar disciplinas
async function buscardisciplinas(){
    const id_cur = selec_cur[0];

    try{
        const response = await fetch('http://localhost:3000/buscardisciplinas', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_cur, nome_dis })
        });

        const resultado = await response.json();

        return resultado.disciplinas;
    } catch(err){
        console.log(err);
    }
}

//adicionar disciplinas
async function adicionardiscplina(nome_dis){
    const id_cur = selec_cur[0];

    try{
         const response = await fetch('http://localhost:3000/adicionardisciplina', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_cur, nome_dis })
        });

        const resultado = await response.json();

        return resultado.mensagem;
    } catch(err){

    }
}

//==gerenciamento de turmas==
//buscar turmas
async function buscarturmas(){
    const id_dis = selec_dis[0];

    try{ 
        const response = await fetch('http://localhost:3000/buscarturmas', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ id_dis })
        });

        const resultado = await response.json();
        
        return resultado.rows;
    } catch(err){
        console.log(err);
    }
}

async function adicionarturma(nome_tur, car_hor, car_dia){
    const id_dis = selec_dis[0];

    try{
        const response = await fetch('http://localhost:3000/adicionarturma', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_dis, nome_tur, car_hor, car_dia })
        });
        
        const resultado = await response.json();

        return resultado.mensagem;
    } catch(err){
        console.log(err);
    }
}

//excluir turma
async function excluirturma(id_turma){
    try{
        const response = await fetch('http://localhost:3000/excluirturma', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_turma })
        });

        const resultado = await response.json();
        return resultado;
    } catch(err){
        console.log(err);
    }
}

async function buscarnotas(){
    const id_turma = selec_tur[0];
    const id_disciplina = selec_dis[0];

    try{
        const response = await fetch('http://localhost:3000/buscarnotas', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ id_turma })
        });

        const resultado = await response.json();
        return resultado.rows;
    } catch(err){
        console.log(err);
    }
}

//tela inicial(login)
fluxotelas();



/*
-funções de exclusão
-funções de volta

-importação e exportação csv

-rotas do backend

-atualização do código sql



organização dos arquivos

/backend
    |-dist
    |-src
    |   |-server.ts
    |-oracle.sql
    |-package.json
    |-package-lock.json
    |-tsconfig.json
/frontend
    |-app.css
    |-index.html
    |-script.js
*/