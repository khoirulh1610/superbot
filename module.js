const sulla = require('sulla');
const fs = require('fs');
var mysql = require('mysql');
var con = mysql.createConnection({
    host: "192.168.0.100",
    user: "root",
    password: "Admin123",
    database: "superbot"
  });
con.connect(function(err) {
    if (err) throw err;  
});


function exportQR(qrCode, path) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');
    fs.writeFileSync(path, imageBuffer);
}

// console.log(process);

module.exports = {
    StartSession: async(sess)=>{
        con.query("update was set pid='" + process.pid + "',status=1,updated_at=now() where session='"+sess+"'");
        sulla.create(sess, (base64Qr, asciiQR) => {
        //    console.log(asciiQR);
            exportQR(base64Qr, 'D:\\Apps\\UniServerZ\\www\\superbot\\qrcode\\'+ sess +'.png');
        },{
            headless: false,
            refreshQR: 15000
        }).then(async(client)=>{
            //----------------
            client.onStateChange((state) => {
                console.log(state);
                con.query("update was set state='"+state+"' where session='"+sess+"'");            
                const conflits = [
                  sulla.SocketState.CONFLICT,
                  sulla.SocketState.UNPAIRED,
                  sulla.SocketState.UNLAUNCHED,
                ];
                if (conflits.includes(state)) {
                  client.useHere();
                }
                if(state=='UNPAIRED' || state == 'UNPAIRED_IDLE'){                    
                    con.query("update was set status=0,contact=null,battery=0,pushname=null,connected=0 where session='"+sess+"'");        
                }
            });


            // ------------------------//  
            let state = await client.getConnectionState();
            let host = await client.getHostDevice();            
            // console.log(host);
            console.log(state);
            // console.log(process);
            let conn = (host.connected) ? 1 : 0;
            con.query("update was set pid='" + process.pid + "',contact='"+ host.wid._serialized +"',battery='"+host.battery+"',pushname='"+host.pushname+"',connected='"+ conn +"' where session='"+sess+"'");            
            client.onMessage(message => {
                // console.log(message);
                Inbox(message,sess);
            })
             
            //----------------------------
            // await client.sendImageAsSticker('6285232843165@c.us', 'd:\\KTP.jpeg');

            setInterval(() => {
            con.query("select * from waoutboxs where prosesed='N' and session='"+sess+"' limit 0,1", function(err, result) {
                if (err) {
                    console.log(err);      
                }
                // for (let i = 0; i < result.length; i++) {
                    if(result.length > 0){
                        if(result[0].is_group==='N'){
                            let hp = result[0].contact.replace(/^0/,'62');
                            let target = (hp.indexOf('@c.us')>1)?hp:hp+'@c.us';
                            if(result[0].type=='chat'){                                                            
                                    client.sendText(target,result[0].message);                                                                
                            }else if(result[0].type=='image'){
                                let file_path = result[0].path;                            
                                // await client.sendImageAsSticker(hp, 'd:\\usericon.png');
                            }                        
                            con.query("update waoutboxs set prosesed='Y' where id="+ result[0].id);
                        }
                    }
                    
                // }
            });
            }, 2000);

            //   ----------------------------------//
        });        
    }
}


async function Inbox(msg,sess) {
    let id = msg.id;
    let isi = msg.body.replace("'"," ");
    let type = msg.type;
    let tm = msg.t;
    let frm = msg.from;
    let to = msg.to;
    let self = msg.self;
    let ack = msg.ack;
    let invis = (msg.invis) ?1:0;
    let isNewMsg = (msg.isNewMsg) ?1:0;
    let star = (msg.star) ?1:0;
    let recvFresh = (msg.recvFresh) ? 1:0;
    let broadcast = (msg.broadcast)?1:0;
    let isForwarded = (msg.isForwarded) ?1:0;
    let sender_name = msg.sender.name;
    let isGroupMsg = (msg.isGroupMsg)?1:0;
    let isMMS = (msg.isMMS)?1:0;
    let isOnline = (msg.isOnline)?1:0;
    let lastSeen = msg.lastSeen;
    let chatId = msg.chatId;
    let pushname = msg.sender.pushname;
    var userid = 0;    
    con.query("insert into wainboxs(userid,session,contact,`from`,`to`,message,messageid,isForwarded,type,is_group,name,pushname,timestamp,ack,online,lastSeen,prosesed,created_at)values"+
    "("+userid+",'"+sess+"','"+chatId+"','"+frm+"','"+to+"','"+isi+"','"+id+"','"+isForwarded+"','"+type+"','"+isGroupMsg+"','"+sender_name+"','"+pushname+"','"+tm+"','"+ack+"','"+isOnline+"',"+lastSeen+",0,now())");
    con.query("update wainboxs a,was b set a.userid=b.userid where a.`session`=b.`session` and a.userid=0");
    // Bot Autoresponse
    var userid = 0;
    con.query("select * from wabots where perintah='" + isi + "'",function(err,result,fields) {
        if(err){
            console.log(err);
        }else{
            var d = new Date();
            var tgl = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear();
            con.query("insert into waoutboxs(session,contact,message)values('"+sess+"','"+frm+"','"+result[0].response.replace('{{date}}',tgl) +"')");
        }
    });
}