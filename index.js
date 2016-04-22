var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');
var moment = require('moment');

var token = "YOUR_TOKEN_HERE";

var opts = {
  key: fs.readFileSync(__dirname + '/private.key'),
  cert: fs.readFileSync(__dirname + '/certificate.crt'),
  ca: fs.readFileSync(__dirname + '/ca_bundle.pem')
};

var app = express(opts),
  https = require('https');
  
https.createServer(opts, app).listen(443);

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/webhook/', function (req, res) {

  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
	
	var timestamps = moment(event.timestamps).format();
	
	console.log(timestamps);
	
	if(event.postback){
		postbackAction(sender , event.postback.payload);
	}
	
	// For sticker
	// if(event.message.attachments){ 
		// var message = JSON.stringify(event.message.attachments);
		// sendMessage(sender , message);
	// }
	
    if (event.message && event.message.text) {
		text = event.message.text;
		commandsAction(sender , text);
    }
  }
  res.sendStatus(200);
});

function commandsAction(sender , message){
	// var userName = getUserFirstName(sender);
	// sendGenericMessage(sender);
	// sayHello(sender);
	
	switch(message.toLowerCase()) {
	case 'help':
        sendTextMessage(sender , "commands : menu");
        break;	
	case 'menu':
        sendMenu(sender);
        break;
    default:
        sayHello(sender);
	}

}

function postbackAction(sender , payload){
	switch(payload) {
    case 'FLIP_COIN':
        filpCoin(sender);
        break;
    case 'ROLL_DICE':
        rollDice(sender);
        break;    
	case 'OPEN_MENU':
		sendMenu(sender);
        break;	
    default:
        sendMenu(sender);
	}
}

function sayHello(userId){
	var api = 'https://graph.facebook.com/v2.6/' + userId;
	var userName;
	
	request({
    url: api,
    qs: {
		fields : 'first_name,last_name,profile_pic',
		access_token:token
		},
    method: 'GET',
	json : true
	}, function(error, response, body) {
		userName = body.first_name;
		sendWellcome(sender,userName);
		if (error || response.body.error) {
			userName =  'stranger';
			sendWellcome(sender,userName);
		}
	});
}

function sendWellcome(sender,userName) {
  messageData = {
     "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":"Hi , " + userName + " !",
            "subtitle":"What can I help you?",
            "buttons":[
              {
                "type":"postback",
                "title":"Open Menu",
				"payload":"OPEN_MENU"
              }
            ]
          }
        ]
      }
    }
  };
  
  sendMessage(sender,messageData);
}

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  
  sendMessage(sender,messageData);
}

function rollDice(sender){
	var result = Math.floor((Math.random() * 6) + 1);
	messageData = {
     "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":"Result :" + result,
            "buttons":[
              {
                "type":"postback",
                "title":"Retry",
				"payload":"ROLL_DICE"
              },
              {
                "type":"postback",
                "title":"Back to Menu",
                "payload":"OPEN_MENU"
              }              
            ]
          }
        ]
      }
    }
  };
  
  sendMessage(sender,messageData);
	
}

function filpCoin(sender){
	var result = Math.floor((Math.random() * 2) + 1) != 1 ? 'heads' : 'tails' ;
	
	messageData = {
     "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":"Result :" + result,
            "buttons":[
              {
                "type":"postback",
                "title":"Retry",
				"payload":"FLIP_COIN"
              },
              {
                "type":"postback",
                "title":"Back to Menu",
                "payload":"OPEN_MENU"
              }              
            ]
          }
        ]
      }
    }
  };
  
  sendMessage(sender,messageData);
	
}

function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  };
  
  sendMessage(sender,messageData);
}

function sendMenu(sender) {
  messageData = {
     "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":"Menu",
            "subtitle":"What can I help you?",
            "buttons":[
              {
                "type":"postback",
                "title":"Flip a Coin",
				"payload":"FLIP_COIN"
              },
              {
                "type":"postback",
                "title":"Roll the Dice",
				"payload":"ROLL_DICE"
              },
              {
                "type":"postback",
                "title":"Bookmark Item",
                "payload":"USER_DEFINED_PAYLOAD_FOR_ITEM100"
              }              
            ]
          }
        ]
      }
    }
  };
  
  sendMessage(sender,messageData);
}

function sendMessage(sender , messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}
