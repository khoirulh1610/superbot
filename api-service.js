const exec = require('child_process').exec;
const find = require('find-process');
const mysql = require('mysql');
const ps = require('ps-node');

var con = mysql.createConnection({
    host: "192.168.0.100",
    user: "root",
    password: "Admin123",
    database: "superbot"
  });
con.connect(function(err) {
    if (err) throw err;  
});




async function runserv() { 
    con.query("select * from was where status<=1", function(err, result) {
        if (err) {
            console.log(err);            
        }        
        for (let i = 0; i < result.length; i++) {
            // console.log(result[i].session);     
            let pid = result[i].pid;
            find('pid',pid)
            .then(function (list) {
                if (!list.length) {
                    exec('node ./api-cli.js '+ result[i].session);
                } else {
                //   console.log('Sudah Berjalan :', list[0].name);
                if(result[i].status == 0){
                    ps.kill(result[i].pid);
                    exec('node ./api-cli.js '+ result[i].session);
                }
                }
            })        
        }
    });
}

async function KillSession() {
    con.query("select * from was where status=2", function(err, result) {
        if (err) {
            console.log(err);            
        }          
        for (let i = 0; i < result.length; i++) {
            // console.log(result[i].session);     
            let pid = result[i].pid;
            find('pid',pid)
            .then(function (list) {
                if (list.length>0) {
                    ps.kill(result[i].pid);
                    con.query("update was set pid=null,state=null,battery=null,pushname=null,connected=0,contact=null where id="+ result[i].id);
                } 
            })        
        }
    });
}

con.query("update was set status=0,contact=null,battery=0,pushname=null,connected=0 where status<=1");
setInterval(() => {
    KillSession();
    runserv();
}, 5000);

