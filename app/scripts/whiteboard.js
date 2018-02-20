'use strict';
//import { userinsc, userconn } from 'form';

const BASE_URL = 'http://localhost:3000/';

let socket = io();
let user;
let context;
let canvas;
let click = false;

// comme init
$(document).ready(function() {

    // initialisation canvas
    canvas = $('#canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    // alert pseudonyme
    usernameAsk();

    //
    socket.on('userlist', userlist);
    socket.on('guesser', guesser);
    socket.on('guessword', guessword);
    socket.on('draw', draw);
    socket.on('draw word', drawWord);
    socket.on('drawer', pictionary);
    socket.on('new drawer', newDrawer);
    socket.on('clear screen', clearScreen);

});



//
function usernameAsk() {
        $.ajax({
            url: BASE_URL + 'gamer',
            type: 'GET',
            dataType: 'json',
            success: function(data){
              alert('super');
              console.log(data);
              if(typeof (data) === 'object' ){
                user = data[0]['name'];
              }else{
                user = data;
              }
              socket.emit('join', user);
              console.log('user_____'+user);
            },
            error: function(data){
              console.log(data);
              console.log('HTTP error');
            }
        });
        $('input.guess-input').focus();

};



// celui qui devine
let guesser = function() {
    clearScreen();
    click = false;
    console.log('draw status: ' + click);
    $('.draw').hide();
    $('#guesses').empty();
    console.log(user + ' est un devin');
    $(".titre").text('Bienvenue '+ user + ' dans Pictionary');
    $('#guess').show();
    $('.guess-input').focus();

    $('#guess').on('submit', function() {
        event.preventDefault();
        let guess = $('.guess-input').val();

        if (guess == '') {
            return false
        };

        console.log(user + " a tappé le mot " + guess);
        socket.emit('guessword', {username: user, guessword: guess});
        $('.guess-input').val('');
    });
};

// reponse envoyé par le joueur qui doit deviner
let guessword = function(data){
    //$('#guesses').text(data.username + " devine : " + data.guessword);

    if (click == true && data.guessword == $('span.word').text() ) {
        console.log('devin : ' + data.username + ' mot à dessiner : ' + $('span.word').text());
        socket.emit('swap rooms', {from: user, to: data.username});
        click = false;
    }
};

// mot a deviner
let drawWord = function(word) {
    $('span.word').text(word);
    console.log('Le mot à dessiner est : ' + word);
};

// tableau des joueurs
let users = [];

// liste des joueurs
let userlist = function(names) {
    users = names;
    //let html = '<p class="chatbox-header">' + 'Joueurs' +'<img src="images/head.gif" height=70px  width=70px><img src="images/head.gif" height=70px  width=70px>'+ '</p>';
    let html ='';
    for (let i = 0; i < names.length; i++) {
        html += '<li><img src="images/head2.gif" height=50px  width=50px>' + names[i] + '</li>';
    };
    $('ul').html(html);
};

// joueur qui devient un nouveau dessinateur
let newDrawer = function() {
    socket.emit('new drawer', user);
    clearScreen();
    $('#guesses').empty();
};

// fonction pour faire un point
let draw = function(obj) {
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y, 2, 0, 2 * Math.PI);
    context.fill();
    console.log('dessine');

};

// celui qui dessine
let pictionary = function() {
    clearScreen();
    click = true;
    console.log('draw status: ' + click);
    $(".titre").text('Bienvenue '+ user + ' dans Pictionary');
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    let drawing;
    let color;
    let obj = {};

    // evenement pour changer de couleur
    $('.draw-buttons').on('click', 'button', function(){
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('clear screen', user);
            context.fillStyle = 'white';
            return;
        };
    });

    console.log(user +' est le dessinateur');

    canvas.on('mousedown', function(event) {
        drawing = true;
    });
    canvas.on('mouseup', function(event) {
        drawing = false;
    });

    canvas.on('mousemove', function(event) {
        let offset = canvas.offset();
        obj.position = {x: event.pageX - offset.left,
                        y: event.pageY - offset.top};

        if (drawing == true && click == true) {

            draw(obj);
            socket.emit('draw', obj);
        };
    });

};

// efface le canvas
let clearScreen = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
};

/* function time over */

function myFunction() {
    //alert('TIME OVER');
    console.log('TIME OVER');
}
