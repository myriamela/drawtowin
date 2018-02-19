'use strict';

let socket = io();
let user;

function usernameAsk() {
  //const $registerformuname = $('#register-form-uname');


    $('.grey-out').fadeIn(500);
    $('.user').fadeIn(500);
    $('.user').submit(function(){
        event.preventDefault();
  //user =$registerformuname.val();
  console.log(user);
        user = $('#username').val().trim();

        if (user == '') {
            return false
        };

        let index = users.indexOf(user);

        if (index > -1) {
            alert(user + ' already exists');
            return false
        };

        socket.emit('join', user);
        $('.grey-out').fadeOut(300);
        $('.user').fadeOut(300);
        $('input.guess-input').focus();
    });
};

let context;
let canvas;
let click = false;

let clearScreen = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
};

let guesser = function() {
    clearScreen();
    click = false;
    //console.log('draw status: ' + click);
    $('.draw').hide();
    $('#guesses').empty();
  //  console.log('You are a guesser');
    $('#guess').show();
    $('.guess-input').focus();

    $('#guess').on('submit', function() {
        event.preventDefault();
        let guess = $('.guess-input').val();

        if (guess == '') {
            return false
        };

    //    console.log(user + "'s guess: " + guess);
        socket.emit('guessword', {username: user, guessword: guess});
        $('.guess-input').val('');
    });
};

let guessword = function(data){
  //  $('#guesses').text(data.username + "'s guess: " + data.guessword);

    if (click == true && data.guessword == $('span.word').text() ) {
      //  console.log('guesser: ' + data.username + ' draw-word: ' + $('span.word').text());
      //  socket.emit('correct answer', {username: data.username, guessword: data.guessword});
        socket.emit('swap rooms', {from: user, to: data.username});
        click = false;
    }
};

let drawWord = function(word) {
    $('span.word').text(word);
  //  console.log('Your word to draw is: ' + word);
};

let users = [];

let userlist = function(names) {
    users = names;
    let html = '<p class="chatbox-header">'+'<br>' + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +'<img src="images/head.gif" height=70px  width=70px><img src="images/head.gif" height=70px  width=70px>'+ '</p>';
      html +='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;';
    for (let i = 0; i < names.length; i++) {
        html += '<li>' + names[i] + '</li>';
    };
    $('ul').html(html);
};

let newDrawer = function() {
    socket.emit('new drawer', user);
    clearScreen();
    $('#guesses').empty();
};
/*
let correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.username + ' guessed correctly!' + '</p>');
};
*/
/*
let reset = function(name) {
    clearScreen();
    $('#guesses').empty();
  //  console.log('New drawer: ' + name);
  //  $('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
};
*/
let draw = function(obj) {
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y,
                     2, 0, 2 * Math.PI);

    context.fill();
};

let pictionary = function() {
    clearScreen();
    click = true;
  //  console.log('draw status: ' + click);
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    let drawing;
    let color;
    let obj = {};

    $('.draw-buttons').on('click', 'button', function(){
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('clear screen', user);
            context.fillStyle = 'white';
            return;
        };
    });

  //  console.log('You are the drawer');

  /*  $('.users').on('dblclick', 'li', function() {
        if (click == true) {
            let target = $(this).text();
            socket.emit('swap rooms', {from: user, to: target});
        };
    });
*/
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

$(document).ready(function() {

    canvas = $('#canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    usernameAsk();

    socket.on('userlist', userlist);
    socket.on('guesser', guesser);
    socket.on('guessword', guessword);
    socket.on('draw', draw);
    socket.on('draw word', drawWord);
    socket.on('drawer', pictionary);
    socket.on('new drawer', newDrawer);
    //socket.on('correct answer', correctAnswer);
  //  socket.on('reset', reset);
    socket.on('clear screen', clearScreen);

});

/* function time over */

function myFunction() {
    //alert('TIME OVER');
    console.log('TIME OVER');
}
