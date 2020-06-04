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


var jtrx = mysql.createConnection({
    host: "sql252.main-hosting.eu",
    user: "u333074448_userjalurtrx",
    password: "@PopiNurAviva130896",
    database: "u333074448_dbjalurtrx"
  });
jtrx.connect(function(err) {
    if (err) throw err;  
});


var gam = mysql.createConnection({
    host: "192.168.0.100",
    user: "root",
    password: "Admin123",
    database: "gammu"
  });
gam.connect(function(err) {
    if (err) throw err;  
});

setInterval(() => {  
    jtrx.query("select * from messages WHERE `status`=0 and created_at >= DATE_ADD(now(),INTERVAL +5 HOUR) limit 0,1",function(err,res,field){
      if(err){
        console.log(err);
      }else{
        for (let i = 0; i < res.length; i++) {
          const row = res[i];
          console.log(row.target);
          if(row.layanan=='SMS'){
            let target = row.target;
            target = target.replace('/^+62/','0').replace('/^62/','0');
            gam.query("insert into outbox(DestinationNumber,TextDecoded,CreatorID)values('"+target+"','"+row.message+"','00')");
            jtrx.query("update messages set status=1,prosesed_at=date_add(now(),interval 7 hour) where id=" + row.id);
          }else if(row.layanan == 'WA'){
            let target = row.target;
            let message = row.message;
            target = target.replace('/^+62/','0').replace('/^62/','0');
            message = message.replace("'"," ");
            con.query("insert into waoutboxs(contact,message,session,userid)values('"+target+"','"+message+"','system',1)");
            jtrx.query("update messages set status=1,prosesed_at=date_add(now(),interval 7 hour) where id=" + row.id);
          }else{
            console.log('Layanan Tidak Tersedia');
          }
        }
      }
    });  
}, 2000);
