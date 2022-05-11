const express = require('express');
const website = express();
const fs = require('fs');
const bodyp = require('body-parser');
const PORT = process.env.PORT ||4000;
const path = require('path');
const server = require('http').createServer(website);
var obj = {s : false};
var sharedSession = require("express-socket.io-session");
/////////////////////

const cookieParser = require("cookie-parser");
const session = require('express-session')({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: 24*60*60*1000*1000 },
    resave: true
});


website.use(express.json());
website.use(express.urlencoded({ extended: true }));

//serving public file
website.use(express.static(__dirname));
website.use(cookieParser());

website.use(session);

website.use(express.static('projectCss'));


//////////////////////


var ids=0;

const HashMap = new Map();

const cookies = require('cookie-parser');
website.use(cookies());

const hbs = require('express-handlebars');

website.engine('handlebars', hbs());
website.set('view engine', 'handlebars');

website.use(bodyp.json());

const io = require('socket.io')(server, {cors: {origin:"*"}});

const Pool = require('pg').Pool;
const { globalAgent } = require('https');
const match = require('nodemon/lib/monitor/match');
const { resourceLimits } = require('worker_threads');

const pool = new Pool({
    user: 'postgres',
  host: 'localhost',
  database: 'TypingTestDatabase',
  password: 'jkpatel007',
  port: 5432,
});

website.get('/', (req, res) => {

    if(req.session.username==undefined)
        res.render('navbar', { link : "http://localhost:4000/login", link_name : "Login/Signup", cssFile: "homeCss.css"});
    else
        res.render('navbar', { link : "http://localhost:4000/profile/" + req.session.username, link_name : req.session.username, cssFile: "homeCss.css"});
});

website.get('/login', (req, res) => {
    // res.sendFile(path.join(__dirname + '/login.handlebars'));
    res.render('login', { link : "http://localhost:4000/login", link_name : "Login/Signup", cssFile: "login.css"});
});


website.get('/leaderboard', (req, res)=>{
    
    // res.sendFile(path.join(__dirname + '/leaderboard.html'));
    if(req.session.username==undefined)                                                      //----------------
    {
        res.render('leaderboard', { link : "http://localhost:4000/login", link_name : "Login/Signup", cssFile: "leaderboardCss.css"});
        return;
    }
    res.render('leaderboard', { link : `http://localhost:4000/profile/${req.session.username}`, link_name : req.session.username, cssFile: "leaderboardCss.css"});
});

website.get('/test', async (req, res)=>{
    console.log(obj.s);
    if(req.session.username==undefined){
        // res.send('First login then take test');
        res.render('errorPage', {link : "http://localhost:4000/login", link_name : "Login/Signup",error : true, msg: "Login/signup to give test"});
        return;
    }
    // res.sendFile("D:\\Web Dev\\TypingTestProject\\Typing.html");
    console.log(req.session.username);
    res.render('Typing', { link : `http://localhost:4000/profile/${req.session.username}`, link_name : req.session.username, cssFile: "testPageCss.css"});
});

website.get('/profile/*',(req, res)=>{

    let username = req.url.split('/');
    console.log(username);
    username = username[2];

    let avg_wpm=0, test_count=0;
    let foundBool = 1;
    pool.query('select * from login_info where username = $1', [username], (err, result)=>{


        if(result.rowCount==0){
            // res.status(404);
            if(req.session.username==undefined)
            {
                res.render('errorpage', { error : true, name : username, msg : " does not exist." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
                foundBool = 0;
                console.log(foundBool);
            }
            else
            {
                foundBool = 0;
                console.log(foundBool);
                res.render('errorpage', { error : true, name : username, msg : " does not exist." , link : "http://localhost:4000/profile/"+req.session.username, link_name : req.session.username});
            }    
            console.log(foundBool);
        }
        else
        {
            pool.query('select * from (login_info inner join test_info on login_info.username = test_info.user_id and login_info.username=$1) order by time_stamp desc;', [username], (err, result)=>{

                if(result.rowCount==0){
        
                    let tem = '<tr><th>Result</th><th>Time stamp</th></tr>';
                    tem = '<table id="leaderBoardTable">' + tem + '</table>';
        
                    if(req.session.username!=undefined)
                    {
                        res.render('profile', { username : username, test_count : test_count, avg_wpm : avg_wpm, link : "https://localhost:4000/profile/"+req.session.username, link_name : req.session.username, profilePage : true, content : tem, cssFile: "/leaderboardCss.css" });
                        return;
                    }
                    else{
                        res.render('profile', { username : username, test_count : test_count , avg_wpm : avg_wpm, link : "https://localhost:4000/login/", link_name : "Login/Signup", profilePage : true, content : tem, cssFile: "/leaderboardCss.css" });
                    }
                    
                    return;
                }
                
                avg_wpm = result.rows[0].avg_wpm;
                test_count = result.rows[0].test_count;
                console.log(avg_wpm, test_count);
        
                // console.log(result.rows);
        
                let tem = '<tr><th>Result</th><th>Time stamp</th></tr>';
                
                for(let i=0; i<Math.min(20, result.rows.length); i++)
                {
                    // pool.query(`select $1::timestamp;`,[result.rows[i].time_stamp], (err, r)=>{
                        // console.log(r);
                        tem = tem + `<tr><td>${result.rows[i].wpm}</td><td>${result.rows[i].time_stamp}</td></tr>`;
                        // console.log(tem);
                }
                // console.log(tem+"hell");
                tem = '<table id="leaderBoardTable">' + tem + '</table>';
                // console.log(tem);
        
                if(req.session.username!=undefined)
                {
                    res.render('profile', { username : username, test_count : test_count, avg_wpm : avg_wpm, link : "https://localhost:4000/profile/"+req.session.username, link_name : req.session.username, profilePage : true, content : tem, cssFile: "/leaderboardCss.css"});
                    return;
                }
                else{
                    res.render('profile', { username : username, test_count : test_count , avg_wpm : avg_wpm, link : "https://localhost:4000/login/", link_name : "Login/Signup", profilePage : true, content : tem, cssFile: "/leaderboardCss.css"});
                }
            });
        }
    });

    // if(foundBool===0){
    //     return;
    // }
    // console.log(foundBool);
});

website.get('/multiplayer', (req, res) => {

    if(req.session.username==undefined)
    {
        res.render('multiplayer', { link : "http://localhost:4000/login", link_name : "Login/Signup", error: true, msg:"You must login to use multiplayer mode" });
        return;
    }
    res.render('multiplayer', { link : `http://localhost:4000/profile/${req.session.username}`, link_name : req.session.username});
});


website.get('/multiplayer/joinrandom', (req, res) => {

    if(req.session.username==undefined)
    {
        res.render('randomroom', { link : "http://localhost:4000/login", link_name : "Login/Signup", error: true, msg:"You must login to use multiplayer mode" });
        return;
    }
    res.render('randomroom', { link : `http://localhost:4000/profile/${req.session.username}`, link_name : req.session.username, cssFile: "/testPageCss.css" });
    
});

website.get('/shoutoutboard', (req, res) => {

    if(req.session.username==undefined)
    {
        res.render('errorPage', { link : "http://localhost:4000/login", link_name : "Login/Signup", error: true, msg:"You must login to use shout out board" });
        return;
    }
    
    res.render('shoutoutboard', {link: 'http://localhost:4000/profile/' + req.session.username, link_name: req.session.username, cssFile: "shoutoutBoardCss.css"});

});

////////////////////////////////////////////////////////////////

io.use(sharedSession(session));

let resultMap = new Map();

////////////////////////////////////////////////////////////////

io.on('connection', (socket)=>{

    if(socket.handshake.session.username==undefined){
        return;
    }

    // console.log(socket);
    var match_id;
    // var connect = require('connect');

    socket.on('leave-room', (d)=>{
        console.log(socket.id + " left room " + match_id);
        // socket.leave(match_id);
    })

    socket.on('final-data', (d)=>{
        if(resultMap.get(match_id)!=undefined)
        {
            let win;
            let [t] = resultMap.get(match_id)
            if(d.speed>t.speed)
            {
                io.in(match_id).emit('result', {winner : socket.handshake.session.username});
            }
            else if(d.speed<t.speed)
            {
                io.in(match_id).emit('result', {winner : t.username});
            }
            else
            {
                io.in(match_id).emit('result', {winner : -1});
            }
            // io.sockets.clients(match_id).forEach(function(s){ s.leave(match_id);});
        }
        else
        {
            resultMap.set(match_id, new Set([{username : socket.handshake.session.username,speed : d.speed}]));
        }
    })

    socket.on('join-room',(d)=>{
        match_id = Math.floor(ids/2);
        console.log(match_id + " room joined");
        socket.join(match_id);
        console.log(io.sockets.adapter.rooms.get(match_id).size);

        if(match_id*2+2==ids+1)
        {
            io.in(match_id).emit('start-match', 'start');
        }
        ids++;

        console.log(io.sockets.adapter.rooms);
    });

    // if(match_id+4==ids)
    // {
    //     socket.in(match_id).emit('start-match', {list : io.sockets.clients(match_id)});
    // }

    console.log("multi player activated " + socket.id);

    socket.on('data', (data)=>{
        // console.log(match_id,data);
        // console.log(io.sockets.adapter.rooms.get(match_id).size);
        // socket.in(match_id).emit('recive-data', JSON.stringify({"from":s.id, "data":data}));
        console.log(data,match_id,socket.id);
        console.log(socket.handshake.session.username);

        socket.in(match_id).emit('recieve-data', JSON.stringify({speed:data.speed, id:socket.handshake.session.username}));
    });

    socket.on('disconnect', function () {
        // socket.removeAllListeners('data');
        // socket.removeAllListeners('disconnect');
        // io.removeAllListeners('connection');
        console.log("disconnected");
    });
});


//////////////////////////////////////////////////////////////////

website.post('/likeDislike',async (req, res)=>{
    //only commentid and the action to be performed will be send as the data
    //first check the login status
    // req.session.username = "jeelpatel02496";
    
    if(req.session.username!=null)
    {
        console.log(req.body.commentId, req.body.action);
        
        pool.query('select * from like_dislike_statistics where user_id = $1 and cid = $2', [req.session.username, req.body.commentId],async (err, result)=>{
            var stus;

            // console.log("For result : ",result.rowCount);
            if(result.rowCount==0)
            {
                pool.query('insert into like_dislike_statistics values ($1, $2, $3)', [req.session.username, req.body.commentId, req.body.action], (err, result2)=>{

                    if(result2.rowCount==1){
                        // res.send({"commentId":req.body.commentId, "status" : req.body.action});
                        // commentId = req.body.commentId;
                        // status = req.body.action;
                        // stus = req.body.action;
                        pool.query('select likes, dislikes from comments where cid = $1', [req.body.commentId],async (err, result3)=>{

                            // console.log(stus);
                            if(err==null)
                            {
                                // await sleep(3);
                                res.send({
                                    "commentId" : req.body.commentId,
                                    "status" : req.body.action,
                                    "likes" : result3.rows[0].likes,
                                    "dislikes" : result3.rows[0].dislikes
                                });
                            } 
                        });
                        return;
                    }
                });
            }
            else
            {
                console.log(result.rows[0].like_dislike==req.body.action);
                if(result.rows[0].like_dislike==req.body.action)
                {
                    pool.query('delete from like_dislike_statistics where user_id = $1 and cid = $2', [req.session.username, req.body.commentId], (err, result)=>{
                        if(err==null)
                        {
                            // res.send({"commentId":req.body.commentId, "status":null });
                            // commentId = req.body.commentId;
                            // stus = null;
                            // status = req.body.action;
                            pool.query('select likes, dislikes from comments where cid = $1', [req.body.commentId],async (err, result3)=>{

                                // console.log(stus);
                                if(err==null)
                                {
                                    // await sleep(3);
                                    res.send({
                                        "commentId" : req.body.commentId,
                                        "status" : null,
                                        "likes" : result3.rows[0].likes,
                                        "dislikes" : result3.rows[0].dislikes
                                    });
                                } 
                            });
                            return;
                        }
                        else
                        {
                            console.log(err);
                            res.send({"status":400});
                            return;
                        }
                    });
                    // return;
                }
                else
                {
                    pool.query('delete from like_dislike_statistics where user_id = $1 and cid = $2', [req.session.username, req.body.commentId], (err, result)=>{
                        // console.log("Deleting");
                        pool.query('insert into like_dislike_statistics values ($1, $2, $3)', [req.session.username, req.body.commentId, req.body.action], (err, result)=>{
                            // console.log(err,result.rowCount);
                            // res.send({"commentId":req.body.commentId, "status" : req.body.action});
                            // commentId = req.body.commentId;
                            // stus = req.body.action;
                            pool.query('select likes, dislikes from comments where cid = $1', [req.body.commentId],async (err, result3)=>{

                                // console.log(stus);
                                if(err==null)
                                {
                                    // await sleep(3);
                                    res.send({
                                        "commentId" : req.body.commentId,
                                        "status" : req.body.action,
                                        "likes" : result3.rows[0].likes,
                                        "dislikes" : result3.rows[0].dislikes
                                    });
                                } 
                            });
                            return;
                        });
                        // return;
                    });
                }
            }
            // res.send({
            //     "commentId" : req.body.commentId,
            //     "status" : req.body.action,
            //     "likes" : 0,
            //     "dislikes" : 0
            // });
            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    else
    {
        res.send({"status" : "Error"});
    }
});

website.post('/postComment', (req, res)=>{

    console.log(req.body.comment);

    if(req.session.username!=null)
    {
        pool.query(`insert into comments (user_id, comment, likes, dislikes, reports, time_stamp) values ($1,$2,0,0,0,now())`,[req.session.username, req.body.comment], (err, result)=>{

            console.log("Hello world");
            if(err==null)
            {
                console.log(result.rows);
                if(result.rowCount==1)
                    res.json({"status": "success"});
                else
                    res.json({"status": "error"});
            }
            else
            {
                console.log(err);
                res.json({"status":"failed"});
            }
        })
    }

});

website.post('/loadComments',async (req, res)=>{

    // req.session.username = 'jeelpatel02496';
    console.log(req.body);
    // res.send({data : req.body})
    // return;
    if(req.session.username!=null)
    {
        pool.query('select * from comments order by cid limit 20 offset $1', [req.body.lastData],async (err, result)=>{

            let dataSend = {
                isAllCompleted : false,
                content : []
            };

            let a = [];

            for(let i=0; i<result.rowCount; i++) {
                a.push({
                    likeStatus : false,
                    commentId : result.rows[i].cid,
                    likes : result.rows[i].likes,
                    dislikes : result.rows[i].dislikes,
                    comment : result.rows[i].comment,
                    commentBy : result.rows[i].user_id
                });
            }

            let c = 0;
            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

            for(let i=0; i<a.length; i++)
            {
                // console.log("C : ",c,i);
                if(c!=i){
                    for( ;c!=i ; ){
                        await sleep(1);
                    }
                }
                pool.query('select * from like_dislike_statistics where user_id = $1 and cid = $2', [req.session.username, a[i].commentId], (err, r)=>{
    
                    if(err!=null)
                    {
                        console.log(err);
                        return;
                    }
                    // console.log("Rows",r.rowCount, i);
                    if(r.rowCount==1)
                    {
                        if(r.rows[0].like_dislike==true){
                            a[i].likeStatus = true;
                        }
                    }
                    else
                    {
                        a[i].likeStatus = null;
                    }
                    c++;
                    // console.log("C", c);
                });
            }

            await sleep(5);

            dataSend.content = a;
    
            if(result.rowCount<20){
                dataSend.isAllCompleted = true;
            }
    
            console.log("Data send success");
            res.send(JSON.stringify(dataSend));

        });
    }
    else{
        res.json({status : "Failed to authenticate"});
    }
});


website.post('/login',async (req, res) => {
    
    let username = req.body.uname;
    let password = req.body.password;
    
    // console.log(username + ':' + password);

    pool.query('select * from login_info where username=$1 and password = $2;',[username, password],(err, result) => {

        if(err!=null)
        {
            if(req.session.username==undefined)
            {
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
                foundBool = 0;
                console.log(foundBool);
            }
            else
            {
                foundBool = 0;
                console.log(foundBool);
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." , link : "http://localhost:4000/profile/"+username, link_name : username});
            } 
            return;
        }

        // console.log(result);
        if(result.rowCount==1) {

            //res.cookie('username', username);               //-----------
            req.session.username = username;
            ///////////////////////
            res.send(JSON.stringify({status : 'success'}));
            obj.s = true;
        }
        else
        {
            res.send(JSON.stringify({status : 'error'}));
        }
    });
});

website.post('/insertdata', (req, res)=>{

    //let username = req.body.username;
    let result = req.body.speed;

    pool.query('insert into test_info values ($1, now(), $2)', [req.session.username, result], (err, result) =>{
        if(err!=null){
            if(req.session.username==undefined)
            {
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
            }
            else
            {
                res.render('errorpage', { error : true, name :  '', msg : "Database not connected." , link : "http://localhost:4000/profile/"+username, link_name : username});
            } 
            return;
        }
        console.log("Test data");
        console.log(result, err);
        res.send('Data successfully inserted');
    });
});

website.post('/leaderboard', (req, res)=>{

    pool.query('select username, avg_wpm, test_count from login_info order by avg_wpm desc;', (err, result)=>{

        if(err!=null)
        {
            if(req.session.username==undefined)
            {
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
            }
            else
            {
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." , link : "http://localhost:4000/profile/"+username, link_name : username});
            } 
            return;
        }

        let str = '';

        str = str + '<tr><th>Rank</th><th>UserName</th><th>Avg WPM</th><th>Test Count</th></tr>';

        let temp = '';

        if(req.session.username!=undefined)
        {
           for(let i = 0; i < result.rowCount; i++)
           {
               if(result.rows[i].username==req.session.username)
               {
                   str = str + `<tr id="mainrow"><td>${i+1}</td><td><a href = "http://localhost:4000/profile/${result.rows[i].username}" class="plink">You</a></td><td>${result.rows[i].avg_wpm}</td><td>${result.rows[i].test_count}</td></tr>`;
               }
               {
                   temp = temp + `<tr><td>${i+1}</td><td><a href="http://localhost:4000/profile/${result.rows[i].username}" class="plink">${result.rows[i].username}</a></td><td>${result.rows[i].avg_wpm}</td><td>${result.rows[i].test_count}</td></tr>`;
               }
           }
           str = '<table id="leaderBoardTable">' + str + temp + '</table>';
           res.send(str);
           return;
        }
        for(let i=0; i<result.rowCount; i++)
        {
            str = str + `<tr><td>${i+1}</td><td><a href = "http://localhost:4000/profile/${result.rows[i].username}" class="plink">${result.rows[i].username}</a></td><td>${result.rows[i].avg_wpm}</td><td>${result.rows[i].test_count}</td></tr>`;
        }
        str = '<table id="leaderBoardTable">' + str + temp + '</table>';
        res.send(str);
    });
});


website.post('/signup', (req, res)=>{

    
    let username = req.body.uname;
    let password = req.body.password;

    console.log("Entered");
    pool.query('select * from login_info where username = $1', [username], (err, result)=>{

        if(err!=null)
        {
            if(req.cookies['username']==undefined)
            {
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
                foundBool = 0;
                console.log(foundBool);
            }
            else
            {
                foundBool = 0;
                console.log(foundBool);
                res.render('errorpage', { error : true, name : '', msg : "Database not connected." , link : "http://localhost:4000/profile/"+username, link_name : username});
            } 
            return;
        }
        // console.log(result);
        if(result.rowCount==1)
        {
            res.send({
                status : "falied"
            });
            return;
        }
        pool.query('insert into login_info values ($1, $2)', [username, password], (err, result)=>{

            if(err!=null)
            {
                if(req.cookies['username']==undefined)
                {
                    res.render('errorpage', { error : true, name : '', msg : "Database not connected." ,link: "http://localhost:4000/login", link_name : "Login/Signup"});
                    foundBool = 0;
                    console.log(foundBool);
                }
                else
                {
                    foundBool = 0;
                    console.log(foundBool);
                    res.render('errorpage', { error : true, name : '', msg : "Database not connected." , link : "http://localhost:4000/profile/"+username, link_name : username});
                } 
                return;
            }
            console.log(result, err);
            if(result.rowCount==1)
            {
                res.send({
                    status : "success"
                });
            }
            else
            {
                res.send({
                    status : "error"
                });
            }
        });
    });
});

website.post('/profileSearch', (req, res) =>{

    console.log(req.body.profile);
    let profile = req.body.profile;
    if(profile==='')
    {
        res.send({});
        return;
    }
    profile = '^'+profile;


    pool.query("select username from login_info where username ~ $1 limit 5", [profile], (err, result)=>{
        res.send(result.rows);
    });
});


server.listen(PORT,(err) =>{
    console.log("Connected");
});