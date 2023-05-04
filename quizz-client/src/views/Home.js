import { useState, useEffect } from "react";
import mqtt from "mqtt";

export default function Home() {
  const [client, setClient] = useState(null);
  const [payload, setPayload] = useState(null);
  const [connectStatus, setConnectStatus] = useState("");

  const mqttConnect = (host) => {
    setConnectStatus("Connecting");
    setClient(mqtt.connect(host));
  };
  useEffect(() => {
    if (client) {
      console.log(client);
      client.on("connect", () => {
        setConnectStatus("Connected");
      });
      client.on("error", (err) => {
        console.error("Connection error: ", err);
        client.end();
      });
      client.on("reconnect", () => {
        setConnectStatus("Reconnecting");
      });
      client.on("message", (topic, message) => {
        const payload = { topic, message: message.toString() };
        setPayload(payload);
      });
    }
  }, [client]);

  useEffect(() => {
    mqttConnect("ws://broker.emqx.io:8083/mqtt", {});
  }, []);

  return (
    <div>
      <p>{connectStatus}</p>
      <h1>Bienvenue sur quizz life aaaaaa</h1>
      <h2>Liste des participants:</h2>
      <p>Payload: {payload ? JSON.stringify(payload) : "None"}</p>
    </div>
  );
}
