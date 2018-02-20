//'use strict';
const BASE_URL = 'http://localhost:3000/';

/*const pour login form*/
const $loginformemail = $('#login-form-email');// input from user
const $loginformpassword = $('#login-form-password');
const $loginformsubmit = $('#login-form-submit');

/*const pour inscription form*/
const $registerformuname = $('#register-form-uname');
const $registerformemail = $('#register-form-email');
const $registerformpassword = $('#register-form-password');
const $registerformcpassword = $('#register-form-cpassword');
const $registerformsubmit = $('#Register-form-submit');

function Gamer(email, name, password, etat) {
	this.email = email;
	this.name = name;
  this.password = password;
  this.etat = true;
}

function Partie(gamer1, gamer2, scoreGamer1, scoreGamer2) {
	this.gamer1 = gamer1;
	this.gamer2 = gamer2;
  this.scoreGamer1 = scoreGamer1;
  this.scoreGamer2 = scoreGamer2;
}

$registerformsubmit.on('click', register);


function register(){
let newGamer = new Gamer($registerformemail.val(), $registerformuname.val(), $registerformpassword.val());
  $.ajax({
  		url: BASE_URL + 'gamer',
  		type: 'POST',
  		data: { newGamer },
  		dataType: 'json',
  		success: function(){
  			alert('super');
        console.log(newGamer);
        window.location.href = './canvas2.html';
  		},
  		error: function(){
  			console.log('HTTP error');
        console.log(newGamer);
  		}
	})
}

$loginformsubmit.on('click', login);
let userconn = '';
function login(){
  console.log($loginformemail.val().trim());
  console.log($loginformpassword.val().trim());
  $.ajax({
  		url: BASE_URL + 'gamer/login',
  		type: 'POST',
  		data: { email : $loginformemail.val().trim(),
              password : $loginformpassword.val().trim()
            },
  		dataType: 'json',
  		success: function(resp){
        console.log(resp);
        if(resp['Error']){
          alert("Message : "+ resp['Message']);
        }else{
          alert("Message : "+ resp['Message'] +' & Joueur : '+ resp['gamer'][0]['name']);
          window.location.href = './canvas2.html';

        }
  		},
  		error: function(resp){
  			console.log(resp['Message']);
  		}
	})
}

//export { userinsc, userconn };
