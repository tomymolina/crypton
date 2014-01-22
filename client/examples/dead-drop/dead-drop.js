var app = {};

app.init = function (session) {
  app.session = session;
  app.peers = {};

  $('#header').css({
    top: 0
  });

  $('#sidebar').css({
    left: 0
  });

  $('#container').css({
    left: '300px'
  });
  app.bindActions();
  app.setUsername();
  app.setStatus(" ");
  app.session.on('message', function (data) {
    app.session.inbox.get(data.messageId, function (err, message) {
      if (message.headers.app == 'deadDrop') {
        app.processMessage(message);
        app.session.inbox.delete(data.messageId, function (err) {
          if (err) {
            alert(err);
          }
        });
      }
    });
  });
};

app.bindActions = function () {
  $('#lookup-peer-btn').click(function () {
    app.lookupPeer();
  });

  $('#lookup-peer').keyup(function () {
    if (event.keyCode == '13') {
      app.lookupPeer();
    }
    return false;
  });

  $('#encrypt-send-btn').click(function () {
    app.sendMessage();
  });
};

app.processMessage = function (message) {
  // add message to messages list:
  var html = '<ul>' + message + '</ul>';
  var node = $(html);
  node.click(function () {
    $('#read-message').show();
    $('#compose').hide();
    // display the message in the <pre>, etc
  });
  $('#messages').append();
  // XXX: notify user of new message
};

app.setUsername = function () {
  $('#nav .username').text(app.session.account.username);
};

app.setStatus = function (message) {
  $('#header .status').text(message);
};

app.bind = function (callback) {
  $('#nav a').click(function (e) {
    e.preventDefault();
    var action = $(this).attr('data-action');
    app[action]();
  });

  callback();
};

app.lookupPeer = function () {
  var peerName = $('#lookup-peer').val();
  if (!peerName) {
    return;
  }
  this.getPeer(peerName, function (err, peer) {
    if (err) {
      alert("Cannot find peer: " + err);
    }
    // Set the username
    $('#compose-to').text(peerName);
    $('#compose').show();
  });
};

app.getPeer = function (username, callback) {
  app.session.getPeer(username, function (err, peer) {
    if (err) {
      callback(err);
      return;
    }
    app.peers[username] = peer;
    callback();
  });
};

app.sendMessage = function () {
  var message = {
    to: $('#compose-to').text(),
    content: $('#compose-message').val()
  };

  var receiver = message.to;
  var peer = app.peers[receiver];

  var headers = {
    app: 'deadDrop',
    type: 'message',
    from: app.session.account.username
  };

  var signedCiphertext = peer.encryptAndSign(message, app.session);
  console.log(signedCiphertext)
  if (signedCiphertext.error) {
    alert(signedCiphertext.error);
    // app.resetUI();
    return;
  }
  var payload = signedCiphertext;

  peer.sendMessage(headers, payload, function (err, messageId) {
    // reset the UI, XXX: add the sent message to a container for sent messages
    app.resetUI();
  });
};

app.resetUI = function () {
  $('#compose-to').text("");
  $('#compose-message').val("");
  $('#lookup-peer').val("");
  $('#compose').hide();
  $('#read-message').hide();
};

app.logout = function () {
  app.session = null;
  app.conversations = null;

  $('#sidebar').html('');
  $('#messages').html('');

  $('#login .status').text('Logged out');

  $('body').css({
    background: '#6ab06e'
  });

  $('#header').css({
    top: '-50px'
  });

  $('#sidebar').css({
    left: '-350px'
  });

  $('#container').css({
    left: '10000px'
  });

  $('#login').css({
    top: 0
  });

  $('#login input')[0].focus();
};
