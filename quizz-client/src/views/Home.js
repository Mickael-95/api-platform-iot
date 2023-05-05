import { useState, useEffect } from "react";
import mqtt from "mqtt";
import "./Home.css";
import Loading from "../components/loading";
import { useHistory } from "react-router-dom";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState(null);
  // const [connectStatus, setConnectStatus] = useState("");
  const [player, setPlayer] = useState([]);

  let history = useHistory();

  function startGame() {
    history.push("/quiz");
  }

  const mqttConnect = (host) => {
    setIsLoading(true);
    setClient(mqtt.connect(host));
  };

  useEffect(() => {}, [player]);

  useEffect(() => {
    if (client) {
      console.log(client);
      client.on("connect", () => {
        setIsLoading(false);
        client.subscribe("/player/name", function (err) {
          console.log(err);
        });
      });
      client.on("error", (err) => {
        console.error("Connection error: ", err);
        client.end();
      });
      client.on("reconnect", () => {
        setIsLoading(true);
      });
      client.on("message", (topic, message) => {
        // setPayload(payload);
        const data = message.toString();
        const dataJson = JSON.parse(data);
        console.log(dataJson);
        setPlayer((player) => [...player, dataJson]);
      });
    }
  }, [client]);

  useEffect(() => {
    mqttConnect("ws://broker.emqx.io:8083/mqtt");
  }, []);

  return (
    <div className="home">
      <h1>Bienvenue sur quizz life aaaaaa</h1>
      <h2>Liste des participants:</h2>
      {isLoading ? (
        <Loading />
      ) : (
        <div>
          <ul className="playersList">
            <p>Players:</p>
            {player.map((item, key) => (
              <li key={key}>{item.nodeIdentifier}</li>
            ))}
          </ul>
          <button onClick={startGame}>Start Game</button>
        </div>
      )}
    </div>
  );
}
