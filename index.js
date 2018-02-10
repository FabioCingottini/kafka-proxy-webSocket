`use strict`;

const kafka 			= require(`no-kafka`);
const WebSocket			= require(`ws`);

module.exports = function(configuration) {

	const config = {
		//kafka settings
		connectionString 	: configuration.connectionString || `127.0.0.1:9092`,
		groupId				: configuration.groupId			 || 0,
		topic				: configuration.topic			 || `test`,
		//websocket server settings
		wssPort				: configuration.wssPort			 || 8080,
		pingDelay			: configuration.pingDelay		 || 10000,
		//debug & logging
		logMessage			: configuration.logMessage		 || 3, //1 connect-disconnect //2 sent-messages //3
		logError			: configuration.logError		 || true,
		//function for evaluating if provide connection ok to refuse.. is a func that return true or false
		checkAuthFN			: configuration.checkAuthFN 	 || false,

	};

	const WebSocketServer 	= new WebSocket.Server({ port: config.wssPort});
	const consumer 			= new kafka.SimpleConsumer({
		groupId                 : config.groupId,
		connectionString        : config.connectionString //`10.8.1.1:9092`
	});

	(async function(){
		console.log(JSON.stringify(config));
		try {
			await consumer.init();
			await consumer.subscribe(config.topic, {time: kafka.LATEST_OFFSET}, _broadcastMessageSet); //return subscription === offset
			_wssConnectionEventsHandler();
		} catch (err) {
			if (config.logError)
				console.error(err)
		}
	})();

	const _wssConnectionEventsHandler = function(){
		try {
			WebSocketServer.on('connection', async function(ws, request)  {
				if (typeof(config.checkAuthFN) === `function` && await config.checkAuthFN(request) ||
					typeof(config.checkAuthFN) !== `function`)
				{
					if (config.logMessage >= 1)
						console.log(`CONNECTION ACCEPTED FROM ${request.connection.remoteAddress}`);
					ws.ip = request.connection.remoteAddress.slice(7);
					ws.isAlive = true;
					ws.on(`error`, () => {
						if(config.logMessage >= 1)
							console.log(`${ws.ip} DISCONNETTED`);
					});
					_testConnection(ws);
				} else {
					ws.terminate();
				}

			});
		} catch (err) {
			if (config.logError)
				console.error(`EVENT ERROR ON ACCEPTING CONNECTION FROM: ${ws ? ws.ip : `NO_IP`}. ${err}`);
		}
	};

	const _broadcastMessageSet = function(messageSet, test, partition){
		try{
			messageSet.forEach(async message => {
				if (config.logMessage >= 3)
					console.log(`test`, partition, message.offset, message.message.value.toString());
				WebSocketServer.clients.forEach(async ws => {
					if (ws.readyState === WebSocket.OPEN)
						ws.send(message.message.value.toString(), err => {  						//classic try catch will not catch all err
							if (err === undefined && config.logMessage >= 2) 													//all undefined error just say that msg is sent correctly
								console.log(`MESSAGE SENT SUCCESSFULLY TO ${ws.ip}`);
							else if (config.logError)
								console.error(`ERROR WHILE SENDING MSG TO ${ws.ip} : ${err}`)
						});
				});
			});
		} catch (err) {
			if (config.logError)
				console.error(`ERROR WHILE TRYING TO ITERATE OVER CLIENT: ${err}`);
		}
	};

	const _testConnection = function(ws) {
		ws
			.on(`close`,() => {
				if(config.logMessage >= 1)
					console.log(`CLOSE THE CONNECTION WITH ${ws.ip}`);
				clearInterval(interval);
			})
			.on(`pong`, () => {
				ws.isAlive = true;
				if(config.logMessage >= 3)
					console.log(`${ws.ip} SUCCESSFULLY RESPONSE TO PING`);
			});

		const interval = setInterval(() => {
			try {
				if(ws.isAlive === false)
					return ws.terminate();
				ws.isAlive = false;
				if(config.logMessage >= 3)
					console.log(`PINGING ${ws.ip}...`);
				ws.ping();
			} catch (err) {
				if (config.logError) console.error(`ERROR WHILE PINGING: ${ws.ip}. ${err}`);
			}
		}, config.pingDelay);
	};
};


