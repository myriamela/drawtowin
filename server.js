
const PORT = 7000;
const express = require('express');
const app = express();
const http = require('http').Server(app);


const mysql = require('mysql');

const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'pirouette',
  database : 'dbdrawtowin'
});

const bodyParser = require('body-parser');

app.use('/', express.static(__dirname + '/app'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// récupère le gamer a partir de l email et du password
app.post('/gamer/login', function (req, res) {
	let sql = `SELECT * FROM gamers WHERE email= ? AND password= ? `;
  let body = [req.body.email, req.body.password];
  console.log(req);
  console.log('email ', req.body.email);
  console.log('pass ', req.body.password);
	db.query(sql, body, function(err, gamer){
  	if(err){
      res.json({"ErrorSQL": true, "Message":"Error Execute Sql"});
    }else {
      if(gamer.length > 0){
        res.json({"Error": false, "Message": "Success", "Gamer" : gamer});
      }
			else{
          res.json({"Error": true, "Message":"Erreur de saisie ou vous n'avez pas de compte"});
      }
    }
  });
});

// récupère tous les gamers
app.get('/gamer/all', function (req, res) {
	let sql = `SELECT * FROM gamers`;
	db.query(sql, function(err, gamers){
   	if(err){
	 		console.log(err);
  		res.json({"Error": true, "Message":"Error Execute Sql"});
   	}else{
			res.json(gamers);
   	}
  });
});

// Insère un gamer dans la base de données
app.post('/gamer', function(req, res){
	let sql  = `INSERT INTO gamers (email, name, password, etat) VALUES (?, ?, ?, 1)`;
	let body = req.body.newGamer;
  let elem = [body.email, body.name , body.password];
	console.log(req.body);
  db.query(sql, elem, function(err,gamer){
  	if(err){
			console.log(err);
      res.json({"Error": true, "Message": "SQL Error"});
    } else {
	     // je renvoi l id cree
	     res.json(gamer.insertId);
    }
  });
});

// change le mot de passe d un gamer a partir de l'email
app.put('/gamer', function(req, res){
  let sql  = `UPDATE gamers SET password = ? WHERE email = ?`;
  let body = [req.query.email, req.query.password];
  db.query(sql, body, function(err){
  	if(err){
		 	console.log(err);
    	res.json({"Error": true, "Message": "Error execute sql"});
   	} else {
      res.json({"Error": false, "Message": "Success"});
   	}
  });
});

// supprime un compte de gamer a partir de l email
app.delete('/gamer', function(req, res){
	let email = [req.query.email];
  let sql = `DELETE FROM gamers WHERE email = ${email}`;
  db.query(sql, email, function(err){
 	if(err){
  	res.json({"Error": true, "Message": "Error execute sql"});
 	} else {
  	res.json({"Error": false, "Message": "Success"});
 	}
 });
});



//////////////server for web socket

app.use(express.static('public'));
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


let users = [];

let words = [
  "mot", "lettre", "numéro", "personne", "stylo", "police", "personnes",
  "son", "eau", "petit déjeuner", "lieu", "homme", "femme", "garçon",
  "fille", "méchant", "semaine", "mois", "nom", "phrase", "ligne", "air",
  "terre", "maison", "main", "image", "animal", "mère", "père",
  "grand pied", "soeur", "monde", "tête", "page", "pays", "question",
  , "école", "plante", "nourriture", "soleil", "état", "oeil", "ville", "arbre",
  "ferme", "histoire", "mer", "nuit", "jour", "vie", "nord", "sud", "est",
  "ouest", "enfant", "télévision", "bouteille", "papier", "musique", "rivière", "voiture",
  "superman", "pieds", "livre", "science", "chambre", "ami", "idée", "poisson",
  "montagne", "cheval", "montre", "couleur", "visage", "bois", "liste", "oiseau",
  "corps", "olivier", "famille", "chanson", "porte", "forêt", "vent", "bateau", "parking",
  "rock", "téléphone", "feu", "poule", "avion", "haut", "bas", "roi",
  "lit", "baleine", "licorne", "dauphin", "meuble", "coucher de soleil",
   "danser", "chat", "plume", "pigeon"
];

function newWord() {
	wordcount = Math.floor(Math.random() * (words.length));
	return words[wordcount];
};

let wordcount;

io.on('connection', function (socket) {
	io.emit('userlist', users);

	socket.on('join', function(name) {
		socket.username = name;

		// user automatically joins a room under their own name
		socket.join(name);
		console.log(socket.username + ' has joined. ID: ' + socket.id);

		// save the name of the user to an array called users
		users.push(socket.username);

		// if the user is first to join OR 'drawer' room has no connections
		if (users.length == 1 || typeof io.sockets.adapter.rooms['drawer'] === 'undefined') {

			// place user into 'drawer' room
			socket.join('drawer');

			// server submits the 'drawer' event to this user
			io.in(socket.username).emit('drawer', socket.username);
			console.log(socket.username + ' is a drawer');

			// send the random word to the user inside the 'drawer' room
			io.in(socket.username).emit('draw word', newWord());
		//	console.log(socket.username + "'s draw word (join event): " + newWord());
		}

		// if there are more than one names in users
		// or there is a person in drawer room..
		else {

			// additional users will join the 'guesser' room
			socket.join('guesser');

			// server submits the 'guesser' event to this user
			io.in(socket.username).emit('guesser', socket.username);
			console.log(socket.username + ' is a guesser');
		}

		// update all clients with the list of users
		io.emit('userlist', users);

	});

	// submit drawing on canvas to other clients
	socket.on('draw', function(obj) {
		socket.broadcast.emit('draw', obj);
	});

	// submit each client's guesses to all clients
	socket.on('guessword', function(data) {
		io.emit('guessword', { username: data.username, guessword: data.guessword})
		console.log('guessword event triggered on server from: ' + data.username + ' with word: ' + data.guessword);
	});

	socket.on('disconnect', function() {
		for (let i = 0; i < users.length; i++) {

			// remove user from users list
			if (users[i] == socket.username) {
				users.splice(i, 1);
			};
		};
		console.log(socket.username + ' has disconnected.');

		// submit updated users list to all clients
		io.emit('userlist', users);

		// if 'drawer' room has no connections..
		if ( typeof io.sockets.adapter.rooms['drawer'] === "undefined") {

			// generate random number based on length of users list
			let x = Math.floor(Math.random() * (users.length));
			console.log(users[x]);

			// submit new drawer event to the random user in userslist
			io.in(users[x]).emit('new drawer', users[x]);
		};
	});

	socket.on('new drawer', function(name) {

		// remove user from 'guesser' room
		socket.leave('guesser');

		// place user into 'drawer' room
		socket.join('drawer');
		console.log('new drawer emit: ' + name);

		// submit 'drawer' event to the same user
		socket.emit('drawer', name);

		// send a random word to the user connected to 'drawer' room
		io.in('drawer').emit('draw word', newWord());

	});

	// initiated from drawer's 'dblclick' event in Player list
	socket.on('swap rooms', function(data) {

		// drawer leaves 'drawer' room and joins 'guesser' room
		socket.leave('drawer');
		socket.join('guesser');

		// submit 'guesser' event to this user
		socket.emit('guesser', socket.username);

		// submit 'drawer' event to the name of user that was doubleclicked
		io.in(data.to).emit('drawer', data.to);

		// submit random word to new user drawer
		io.in(data.to).emit('draw word', newWord());

		io.emit('reset', data.to);

	});

	socket.on('correct answer', function(data) {
		io.emit('correct answer', data);
		console.log(data.username + ' guessed correctly with ' + data.guessword);
	});

	socket.on('clear screen', function(name) {
		io.emit('clear screen', name);
	});

})

http.listen(port, () => console.log('listening on port ' + port));
//app.listen(PORT);
