const wa = require('./module');
const find = require('find-process');
const mysql = require('mysql');
var con = mysql.createConnection({
    host: "192.168.0.100",
    user: "root",
    password: "Admin123",
    database: "superbot"
  });
con.connect(function(err) {
    if (err) throw err;  
});
let sess = process.argv[2];


con.query("select * from was where session='"+sess+"'", function(err, result) {
    if (err) {
        console.log(err);      
    }
    for (let i = 0; i < result.length; i++) {
        // console.log(result[i].session);     
        let pid = result[i].pid;
        find('pid',pid)
        .then(function (list) {
            if (!list.length) {
                wa.StartSession(result[i].session);        
            } else {
            //   console.log('Sudah Berjalan :', list[0].name);
              process.exit();
            }
          })        
    }
});