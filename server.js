
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



//////////////server pour web socket

app.use(express.static('public'));
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


let users = [];

// liste de mots à dessiner
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



// methode pour retourner un mot aléatoire à partir de la liste de mot
function newWord() {
	let wordcount = Math.floor(Math.random() * (words.length));
  console.log(wordcount);
  console.log( "mot aléatoire "+ words[wordcount]);
	return words[wordcount];
};

//
io.on('connection', function (socket) {
	io.emit('userlist', users);


	socket.on('join', function(name) {
		socket.username = name;
    console.log('___________'+ Object.getOwnPropertyNames(socket));
    console.log('___________'+ Object.keys(io));

    Object.getOwnPropertyNames(io).forEach(
      function(val, idx, array) {
    console.log(val + " -> " + io[val]);
  });
		// l'utilisateur rejoint automatiquement une room sous son propre nom
		socket.join(name);
		console.log(socket.username + ' a rejoint le jeu . ID: ' + socket.id);

		// enregistre le nom de l'utilisateur dans un tableau appelé users
		users.push(socket.username);

		// si l'utilisateur est le premier à rejoindre la salle OU 'drawer'room n'a aucune connexion
		if (users.length == 1 || typeof io.sockets.adapter.rooms['drawer'] === 'undefined') {

			// on place l'utilisateur dans la room 'drawer'
			socket.join('drawer');

			// le serveur soumet l'événement 'drawer' à l'utilisateur
			io.in(socket.username).emit('drawer', socket.username);
			console.log(socket.username + ' est le dessinateur');

			// envoi le mot aléatoire à l'utilisateur à l'intérieur de la room 'drawer'
			io.in(socket.username).emit('draw word', newWord());


		}

		// s'il y a plus d'un nom d'utilisateurs
    // ou s'il y a une personne dans la room des drawer .
		else {

			// des utilisateurs supplémentaires rejoignent la room "guesser"
			socket.join('guesser');

			// server soumet l'événement 'guesser' à l'utilisateur
			io.in(socket.username).emit('guesser', socket.username);
			console.log(socket.username + ' est un devin');
		}

		// met à jour tous les clients avec la liste des utilisateurs
		io.emit('userlist', users);

	});




  // envoi du dessin sur canvas des autres clients
	socket.on('draw', function(obj) {
		socket.broadcast.emit('draw', obj);
	});

	// envoi des reponses de chaque client à tous les clients
	socket.on('guessword', function(data) {
		io.emit('guessword', { username: data.username, guessword: data.guessword})
		console.log('événement guessword déclenché sur le serveur de: ' + data.username + ' avec le mot : ' + data.guessword);
	});

  //
	socket.on('disconnect', function() {
		for (let i = 0; i < users.length; i++) {

			// supprime l'utilisateur de la liste des utilisateurs
			if (users[i] == socket.username) {
				users.splice(i, 1);
			};
		};
		console.log(socket.username + ' est déconnecté(e).');

		// soumet la liste des utilisateurs mise à jour à tous les clients
		io.emit('userlist', users);

		// si la room 'drawer' n'a pas de connexion ..
		if ( typeof io.sockets.adapter.rooms['drawer'] === "undefined") {

			// génére un nombre aléatoire en fonction de la longueur de la liste des utilisateurs
			let x = Math.floor(Math.random() * (users.length));
			console.log(users[x]);

			// soumet un nouvel événement de 'drawer' à l'utilisateur aléatoire dans la liste des utilisateurs
			io.in(users[x]).emit('new drawer', users[x]);
		};
	});

	socket.on('new drawer', function(name) {

		// retire l'utilisateur de la room 'guesser'
		socket.leave('guesser');

		// place l'utilisateur dans 'drawer' room
		socket.join('drawer');
		console.log('new drawer emit: ' + name);

		// envoi de l'événement 'drawer' au même utilisateur
		socket.emit('drawer', name);

		// envoi un mot aléatoire à l'utilisateur connecté à la room 'drawer'
		io.in('drawer').emit('draw word', newWord());
	});

	// initialisation avec l'événement 'dblclick' du dessinateur dans la liste des joueurs
	socket.on('swap rooms', function(data) {

		// le dessinateur quitte la room 'drawer' et rejoint la room 'guesser'
		socket.leave('drawer');
		socket.join('guesser');

		// soumet l'événement 'guesser' à l'utilisateur
		socket.emit('guesser', socket.username);

		// envoi de l'événement 'drawer' au joueur qui a été doubleclické
		io.in(data.to).emit('drawer', data.to);
    console.log('new drawer ou new drawer doubleclické ____'+data.to);

		// soumet un mot aléatoire au nouvel utilisateur
		io.in(data.to).emit('draw word', newWord());
		io.emit('reset', data.to);

	});

  //
	socket.on('correct answer', function(data) {
		io.emit('correct answer', data);
		console.log(data.username + ' a deviné correctement avec ' + data.guessword);
	});

  //
	socket.on('clear screen', function(name) {
		io.emit('clear screen', name);
	});

})

http.listen(port, () => console.log('listening on port ' + port));
//app.listen(PORT);
