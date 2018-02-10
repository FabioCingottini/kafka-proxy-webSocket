# working for make this available on npm with `npm install kafkaproxywebsocket `

# !!!under construction!!!

little package for broadcasting messagges from a kafka topic to a multiple websocket clients, build with no-kafka and ws libraries

# kafka-proxy-webSocket

```nodejs
`use strict`

const kpws = require(`kafkaproxywebsocket`);

kpws({

    //kafka settings
    connectionString 	: `10.10.10.10:101010`,          //default: 127.0.0.1:9092
    groupId				: 1,                                       //default: 0,
    topic				: `myTopic`,			                                 //default: `test`
    
    //websocket server settings
    wssPort				: 10000,			                           //default: 8080
    pingDelay			: 10000,                         //default: 10000   
    
    //debug & logging
    logMessage			: 2,		           // default:3,   1 connect-disconnect //2 sent-messages //3
    logError			: true, 		         //default: true,
    
    //function for evaluating if provide connection or to refuse.. is a func that return true or false
    checkAuthFN			: function(request){   //default: undefined, so every incoming connection
        console.log(request);         //will be accepted
        if( 69 === 69) 
            return true;
        else
            return false;        
    } 	 

});

```