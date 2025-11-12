//dados teste
ins_data = [
    "puc são paulo",
    "puc campinas"
]

cur_data = [
    {nome : "puc campinas", cursos : ["culínaria", "engenharia de software"]},
    {nome : "puc são paulo", cursos : ["ciência da computação", "engenharia de pesca"]}
];

dis_data = [
    "projeto integrador",
    "engenharia e elicitação de requisitos"
]

/*tur_data = [
    {nome : "projeto integrador", cursos : ["culínaria", "engenharia de software"]},
    {nome : "engenharia e elicitação de requisitos", cursos : ["ciência da computação", "engenharia de pesca"]}
];*/


//dados temporarios
const usuario = null;
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

    document.getElementById("enviar-cadastro").addEventListener("click", () => {
        comfirmarcadastro();
    });

    //disciplinas e turmas
    document.getElementById("enviar-login").addEventListener("click", () => { comfirmarlogin()});
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

// ======== VALIDAÇÕES E BUSCA DE DADOS========

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
                document.getElementById("gerenciar-disciplinas"));

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

async function buscarturmas(nomedisciplina){
    try{ 
        const response = await fetch('http://localhost:3000/buscardisciplina', {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : JSON.stringify({ nomedisciplina })
        });

        const resultado = await response.json();
        
        return resultado.rows;
    } catch(err){
        console.log(err);
    }
}
//tela inicial(login)
fluxotelas();