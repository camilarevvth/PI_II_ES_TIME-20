CREATE USER NOTADEZ identified BY secretmypass;
grant create session to NOTADEZ;/*autorização para o usuário se conectar com o banco*/

ALTER USER NOTADEZ ACCOUNT UNLOCK;

select username,
       authentication_type
  from dba_users
 where username = 'NOTADEZ';
 /*da um select na tabela dba-users pra verificar se o usuario webapp foi criado*/

 