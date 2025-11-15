//dados temporarios
let usuario = null;
let selec_ins = null;
let selec_cur = null;
let selec_dis = null;
let selec_tur = null;

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

    document.getElementById("enviar-cadastro").addEventListener("click", () => {comfirmarcadastro();});

    //disciplinas e turmas
    document.getElementById("enviar-login").addEventListener("click", () => { comfirmarlogin()});
}

// ======== GERENCIAMENTO DE INSTITUIÇÕES ========

//mostrar instituicoes
function atualizarinstituicoes(){
    const ins_conteiner = document.getElementById("instituicao-conteiner");

    ins_conteiner.innerHTML = '';

    buscarinstituicoes().then(instituicoes => {
        instituicoes.forEach(instituicao => {
            const div_ins = document.createElement("div");
            const h2_ins = document.createElement("h2");
            const cur_conteiner = document.createElement("div");

            h2_ins.innerText = instituicao[1];
            h2_ins.classList.add("instituicao");
            cur_conteiner.classList.add("curso-conteiner");

            div_ins.appendChild(h2_ins);
            div_ins.appendChild(cur_conteiner);
            ins_conteiner.appendChild(div_ins);

            h2_ins.addEventListener('click', (e) => {
                
                if(cur_conteiner.innerHTML != ''){
                    cur_conteiner.innerHTML = '';
                } else {
                    selec_ins = instituicao;
                    mostrarcursos(cur_conteiner);
                }
            })
        });
    });
}

//criar instituição
function inseririnstituicao(){
    const nome_instituicao = document.getElementById("instituicao-nome").value;

    enviarnstituicao(nome_instituicao).then(confirm => {
        if(confirm){
            document.getElementById("instituicao-comfirm").innerText = "instituição criada";
            atualizarinstituicoes();
        } else{
            document.getElementById("instituicao-comfirm").innerText = "essa instituição já existe";
        };
    });
}

//excluir instituição
function excluirinstituicao(){
    const nome_instituicao = document.getElementById("instituicao-nome").value;

    apagernstituicao(nome_instituicao).then(confirm => {
         if(confirm){
            document.getElementById("instituicao-comfirm").innerText = "instituição apagada";
            atualizarinstituicoes();
        } else{
            document.getElementById("instituicao-comfirm").innerText = "essa instituição não existe";
        };
    });
}

//mostrar cursos
function mostrarcursos(cur_conteiner){
    const nome_instituicao = selec_ins[1];

    cur_conteiner.innerHTML = '';

    buscarcursos(nome_instituicao).then(cursos => {
        cursos.forEach(curso => {
            const h3_cur = document.createElement("h3");

            h3_cur.innerText = curso[1];

            cur_conteiner.appendChild(h3_cur);

            h3_cur.addEventListener('click', () => {
                selec_cur = curso;

                trocartela(document.getElementById("gerenciar-instituicoes"),
                document.getElementById("gerenciar-disciplinas"));
            });
        });


    });


}

// ======== GERENCIAMENTO DE DISCIPLINAS ========

//mostrar disciplinas
function atualizardisciplinas(){

    const dis_conteiner = document.getElementById("disciplina-conteiner");

    dis_conteiner.innerHTML = "";

    dis_data.forEach(element => {
        const disciplina = document.createElement("div");
        const nome = document.createElement("h2");
        const tur_conteiner = document.createElement("div");

        nome.innerText = element;
        nome.classList.add("disciplina-nome");
        tur_conteiner.classList.add("turma-conteiner");

        disciplina.classList.add("disciplina");
        disciplina.appendChild(nome);
        disciplina.appendChild(tur_conteiner);

        dis_conteiner.appendChild(disciplina);
    });

    const toda_disciplina = dis_conteiner.getElementsByClassName("disciplina");
    
    for(let i = 0; i < toda_disciplina.length; i++){
        toda_disciplina[i].addEventListener("click", (e) => {
            console.log("apertou");

            if(selec_dis == null){
                selec_dis = e.currentTarget;
                mostrarturmas(selec_dis);
            } else {
                selec_dis.querySelector(".turma-conteiner").innerHTML = "";

                if(selec_dis == e.currentTarget){
                    selec_dis = null;
                } else {
                    selec_dis = e.currentTarget;
                    mostrarturmas(selec_dis);
                }
            }
        });
    }
}

//inserir disciplinas
function inserirdisciplina(){
    const ins_nome = document.getElementById("instituicao-nome").value;

    ins_data.push(ins_nome);

    atualizardisciplinas();
}

//excluir disciplinas
function excluirdisciplina(){
    const dis_nome = document.getElementById("instituicao-nome").value;

    for(let i = 0; i < ins_data.length; i++){
        if(ins_data[i] == ins_nome){
            ins_data.splice(i, 1);
        }
    };

    atualizarinstituicoes();
}

//mostrar turmas ao selecionar a disciplina
function mostrarturmas(disciplina){

    let tur_conteiner = disciplina.querySelector(".turma-conteiner");

    tur_conteiner.innerHTML = "";

    buscarturmas().then(tur_data => {

        for(let i = 0; i < tur_data.length; i++){
            if(tur_data[i].disciplina == disciplina.querySelector(".disciplina-nome").innerText){
                tur_data[i].forEach(turma => {
                    const nome = document.createElement("h3");

                    nome.innerText = turma.nome;
                    nome.classList.add("turma");

                    tur_conteiner.appendChild(nome);
                });

                break;
            }
        }

        const toda_turma = tur_conteiner.getElementsByClassName("turma");

        for(let i = 0; i < toda_turma.length; i++){
            toda_turma[i].addEventListener("click", () => {
                selec_tur = toda_turma[i].innerText;

                trocartela(
                    document.getElementById("gerenciar-disciplinas"),
                    document.getElementById("gerenciar-turmas"));
            });
        };
    });
}

// ======== GERENCIAMENTO DE TURMAS ========

async function atualizaralunos(){
    
}

function cadastraralunos(){

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

        if(resultado.comfirm){
            usuario = resultado.usuario;


            trocartela(
                document.getElementById("login"),
                document.getElementById("gerenciar-instituicoes"));

            document.getElementById("enviar-instituicao").addEventListener("click", () => inseririnstituicao());
            document.getElementById("excluir-instituicao").addEventListener("click", () => excluirinstituicao());

            atualizardisciplinas();
        } else {
            console.log(resultado.mensagem);
        }
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
async function enviarnstituicao(nome_instituicao){
    try{
        const response = await fetch('http://localhost:3000/adicionarinstituicao', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ nome_instituicao, id_usuario : usuario[0] })
        });

        const resultado = await response.json();

        return resultado.mensagem;
    } catch(err){
        console.log(err);
    }
}

//excluir instituição
async function apagarinstituicao(nome_instituicao){
    try{
        const response = await fetch('http://localhost:3000/adicionarinstituicao', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ nome_instituicao })
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

        return resultado.mensagem;
    } catch(err){
        console.log(err);
    }
}

//apagar cursos
async function apagarcurso(nome_cur) {
    const id_ins = selec_ins[0];

    try{
        const response = await fetch('http://localhost:3000/apagarcurso', {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({ id_ins, nome_cur })
        });

        const resultado = await response.json();

        return resultado.mensagem;
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

//apagar disciplinas
async function apagardisciplina(nome_dis){
    const id_cur = selec_cur[0];

    try{
         const response = await fetch('http://localhost:3000/adicionarcurso', {
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
                "Constent-Type" : "application/json"
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
async function excluirturma(nome_tur){
    const id_dis = selec_dis[0];

    try{
        const response = await fetch('http://localhost:3000/excluirturma', {
            method: 'POST',
            headers: {
                "Constent-Type" : "application/json"
            },
            body: JSON.stringify({ id_dis, nome_tur })
        });
        
        const resultado = await response.json();

        return response.mensagem;
    } catch(err){
        console.log(err);
    }
}

//==gerenciamento de notas==
//tela inicial(login)
fluxotelas();


/*
organização dos arquivos

/backend
    |-dist
    |-src
    |   |-server.ts
    |-package.json
    |-package-lock.json
    |-tsconfig.json
/frontend
    |-app.css
    |-index.html
    |-script.js
*/