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
var isOpened = true;
var remote64FirstPlayer = '';

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
    // console.log("NODE_IDENTIFICATION");
    // console.log(frame);

    // Send NI and MAC to the /player/name topic when button pressed

    const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');

    client.on('connect', function () {
      client.subscribe('/player/name', function (err) {
        if (!err) {
          client.publish('/player/name', JSON.stringify({ nodeIdentifier: frame.nodeIdentifier, remote64: frame.remote64 }))
          client.end();
        }
      })
    });

    client.on('message', function (topic, player) {
      console.log(topic, player);
      client.end()
    })
    //storage.registerSensor(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {
    const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');

    if (isOpened) {
      // console.log("Here : isOpened");
      remote64FirstPlayer = frame.remote64;

      const turn_red = { // AT Request to be sent
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
        destination64: "FFFFFFFFFFFFFFFF",
        command: "D2",
        commandParameter: [04],
      };
      const turn_blue = { // AT Request to be sent
        type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
        destination64: remote64FirstPlayer,
        command: "D4",
        commandParameter: [04],
      };
      // console.log(remote64FirstPlayer);
      xbeeAPI.builder.write(turn_blue);
      xbeeAPI.builder.write(turn_red);

      client.on('connect', function () {
        client.subscribe('/player/playerTurn', function (err) {
          if (!err) {
            client.publish('/player/playerTurn', remote64FirstPlayer);
            client.end();
          }
        })
      });

      isOpened = false;
    }


    client.on('connect', function () {
      client.subscribe('/quizz/reset', function (err) {
        if (err) {
          console.log(err);
        }
      })
    });

    client.on("message", (topic, message) => {

      if (message.toString() === 'reset') {

        console.log("Here : reset");
        console.log(message.toString());
        isOpened = true;
        remote64FirstPlayer = ''

        const reset_red = { // AT Request to be sent
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: "FFFFFFFFFFFFFFFF",
          command: "D2",
          commandParameter: [00],
        };
        const reset_blue = { // AT Request to be sent
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: "FFFFFFFFFFFFFFFF",
          command: "D4",
          commandParameter: [00],
        };
        xbeeAPI.builder.write(reset_blue);
        xbeeAPI.builder.write(reset_red);
      }

      client.end()
    });

    // Change LED color depending on who buzzed first

    // const { DIO1, DIO2, DIO3, DIO4 } = frame.digitalSamples;

    // const turn_red = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: "FFFFFFFFFFFFFFFF",
    //   command: "D2",
    //   commandParameter: [04],
    // };

    // const turn_green = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: frame.remote64,
    //   command: "D3",
    //   commandParameter: [],
    // };

    // const turn_blue = { // AT Request to be sent
    //   type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    //   destination64: remote64FirstPlayer,
    //   command: "D4",
    //   commandParameter: [04],
    // };

    // xbeeAPI.builder.write(turn_blue);
    // xbeeAPI.builder.write(turn_red);

    //storage.registerSample(frame.remote64,frame.analogSamples.AD0 )

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    const timestamp = new Date().getTime();
    // console.log("REMOTE_COMMAND_RESPONSE - " + timestamp)
    // console.log(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    // console.log(dataReceived);
  } else {
    // console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    // console.log(dataReceived);
  }

});
