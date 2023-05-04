var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
//var storage = require("./storage")
require('dotenv').config()
const mqtt = require('mqtt');

const SERIAL_PORT = process.env.SERIAL_PORT;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

let serialport = new SerialPort(SERIAL_PORT, {
  baudRate: parseInt(process.env.SERIAL_BAUDRATE) || 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

serialport.on("open", function () {
  var frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
  };

  xbeeAPI.builder.write(frame_obj);

  frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "NI",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);

});

// All frames parsed by the XBee will be emitted here

// storage.listSensors().then((sensors) => sensors.forEach((sensor) => console.log(sensor.data())))

xbeeAPI.parser.on("data", function (frame) {

  //on new device is joined, register it

  //on packet received, dispatch event
  //let dataReceived = String.fromCharCode.apply(null, frame.data);
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);

  }
  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    // let dataReceived = String.fromCharCode.apply(null, frame.nodeIdentifier);
    console.log("NODE_IDENTIFICATION");
    console.log(frame);

    const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');

    client.on('connect', function () {
      client.subscribe('/player/name', function (err) {
        if (!err) {
          client.publish('/player/name', JSON.stringify({nodeIdentifier: frame.nodeIdentifier, remote64: frame.remote64}) )
        }
      })
    });

    client.on('message', function(topic, player){
      console.log(topic, player);
      client.end()
    })
    //storage.registerSensor(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {
    const timestamp = new Date().getTime();
    console.log("ZIGBEE_IO_DATA_SAMPLE_RX - " + timestamp)

    const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');

    client.on('connect', function () {
      client.subscribe('/player/playerTurn', function (err) {
        if (!err) {
          client.publish('/player/playerTurn', JSON.stringify({nodeIdentifier: frame.nodeIdentifier, remote64: frame.remote64, timestamp: timestamp}) )
        }
      })
    });
    // console.log(frame)

    //Envoyer au topic le NI/MAC de qui a appuyé sur le bouton + le timestamp
    
    // const { DIO1, DIO2, DIO3, DIO4 } = frame.digitalSamples;

    // const turn_red = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: "FFFFFFFFFFFFFFFF",
    //   command: "D2",
    //   commandParameter: [],
    // };

    // const turn_green = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: frame.remote64,
    //   command: "D3",
    //   commandParameter: [],
    // };

    // const turn_blue = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: frame.remote64,
    //   command: "D4",
    //   commandParameter: [],
    // };



    // xbeeAPI.builder.write(turn_blue);
    // xbeeAPI.builder.write(turn_red);

    //storage.registerSample(frame.remote64,frame.analogSamples.AD0 )

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    const timestamp = new Date().getTime();
    console.log("REMOTE_COMMAND_RESPONSE - " + timestamp)
    console.log(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived);
  } else {
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived);
  }

});
