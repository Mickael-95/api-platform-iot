import React, { useState, useEffect } from "react";
import quizData from "../questions.json";
import "../Quiz.css";
import mqtt from "mqtt";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionBackgrounds, setOptionBackgrounds] = useState({
    0: '#f0f0f0',
    1: '#f0f0f0',
    2: '#f0f0f0',
    3: '#f0f0f0',
  });

  const [mainTimer, setMainTimer] = useState(12);
  const [mainTimerActive, setMainTimerActive] = useState(true);
  const [secondaryTimer, setSecondaryTimer] = useState(5);
  const [secondaryTimerActive, setSecondaryTimerActive] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [prevMainTimer, setPrevMainTimer] = useState(null);
  const [playerTurn, setPlayerTurn] = useState('');
  const [client, setClient] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [teamAPoints, setTeamAPoints] = useState(0);
  const [teamBPoints, setTeamBPoints] = useState(0);

  const mqttConnect = (host) => {
    // setIsLoading(true);
    setClient(mqtt.connect(host));
  };

  useEffect(() => {}, [playerTurn]);

  useEffect(() => {
    if (client) {
      // console.log(client);
      client.on("connect", () => {
        // setIsLoading(false);
        client.subscribe("/player/playerTurn", function (err) {
          console.log(err);
        });
      });
      client.on("error", (err) => {
        console.error("Connection error: ", err);
        client.end();
      });
      client.on("reconnect", () => {
        // setIsLoading(true);
      });
      client.on("message", (topic, message) => {
        const data = message.toString();
        // console.log(data);
        setPlayerTurn(data);
      });
    }
  }, [client]);

  useEffect(() => {
    mqttConnect("ws://broker.emqx.io:8083/mqtt");
  }, []);

  useEffect(() => {
    if (!mainTimerActive) return;
  
    const mainTimerInterval = setInterval(() => {
      if (mainTimer > 0) {
        setMainTimer((prevTime) => prevTime - 1);
      }
    }, 1000);
  
    return () => {
      clearInterval(mainTimerInterval);
    };
  }, [mainTimerActive, mainTimer]);

  useEffect(() => {
    if (!secondaryTimerActive) return;
  
    const secondaryTimerInterval = setInterval(() => {
      if (secondaryTimer > 0) {
        setSecondaryTimer((prevTime) => prevTime - 1);
      }
    }, 1000);
  
    return () => {
      clearInterval(secondaryTimerInterval);
    };
  }, [secondaryTimerActive, secondaryTimer]);

  useEffect(() => {
    if (secondaryTimerActive && secondaryTimer === 0) {
      setSecondaryTimerActive(false);
      setMainTimerActive(true);
      setTeamName('');
    }
  }, [secondaryTimerActive, secondaryTimer]);

  useEffect(() => {
    if (mainTimerActive && mainTimer === 0) {
      setAnswerStatus('correct');
      setMainTimerActive(false);
      setResultMessage('Temps épuisé');
  
      const newBackgrounds = quizData.questions[currentQuestion].options.reduce(
        (backgrounds, currentOption, index) => {
          if (currentOption === quizData.questions[currentQuestion].answer) {
            backgrounds[index] = '#27ae60';
          } else {
            backgrounds[index] = '#c0392b';
          }
          return backgrounds;
        },
        {}
      );
      setOptionBackgrounds(newBackgrounds);
    }
  }, [mainTimerActive, mainTimer]);

  const handleBuzzerPress = (team) => {
    if (!secondaryTimerActive && mainTimer > 0) {
      setPrevMainTimer(mainTimer);
      setMainTimerActive(false);
      setSecondaryTimerActive(true);
      setTeamName(team);
      setSecondaryTimer(5);
    } else if (secondaryTimer === 0) {
      setSecondaryTimerActive(false);
      setMainTimerActive(true);
      setTeamName('');
      if (prevMainTimer !== null) {
        setMainTimer(prevMainTimer);
      }
    }
  };

  const handleAnswerClick = (option) => {
    if (answerStatus === 'correct') return;
  
    setSelectedOption(option);
  
    if (option === quizData.questions[currentQuestion].answer) {
      setAnswerStatus('correct');
      setMainTimerActive(false);
      setSecondaryTimerActive(false);
  
      if (teamName === 'Équipe A') {
        setTeamAPoints(teamAPoints + 1);
      } else if (teamName === 'Équipe B') {
        setTeamBPoints(teamBPoints + 1);
      }
  
      const newBackgrounds = quizData.questions[currentQuestion].options.reduce(
        (backgrounds, currentOption, index) => {
          backgrounds[index] = currentOption === option ? '#27ae60' : '#c0392b';
          return backgrounds;
        },
        {}
      );
      setOptionBackgrounds(newBackgrounds);
    } else {
      setAnswerStatus('incorrect');
      const newBackgrounds = { ...optionBackgrounds };
      newBackgrounds[quizData.questions[currentQuestion].options.indexOf(option)] = '#c0392b';
      setOptionBackgrounds(newBackgrounds);
      setSecondaryTimerActive(false);
      setMainTimerActive(true);
      setTeamName('');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswerStatus(null);
      setSelectedOption(null);
      setOptionBackgrounds({ 0: '#f0f0f0', 1:
      '#f0f0f0', 2: '#f0f0f0', 3: '#f0f0f0' });
      setMainTimer(12);
      setMainTimerActive(true);
      setSecondaryTimer(5);
      setSecondaryTimerActive(false);
      setTeamName('');
      client.publish('/quizz/reset', 'reset');
    }
  };

  const renderQuestion = () => {
    const question = quizData.questions[currentQuestion];
    return (
      <div>
        <h2>{question.question}</h2>
        <div className="options-wrapper">
          {question.options.map((option, index) => (
            <div key={index} className="option-container">
              <button
                className="quiz-option"
                onClick={() => handleAnswerClick(option)}
                style={{ backgroundColor: optionBackgrounds[index], color: 'black' }}
                disabled={answerStatus === 'correct'}
              >
                {option}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResultMessage = () => {
    if (answerStatus === 'correct') {
      return (
        <div className="correct-answer">
          <span className="result-symbol">&#10004;</span> {resultMessage}
          <button className="next-question" onClick={handleNextQuestion}>
            Question suivante
          </button>
        </div>
      );
    } else if (answerStatus === 'incorrect') {
      return (
        <div className="incorrect-answer">
          <span className="result-symbol">&#10008;</span> Mauvaise réponse, veuillez réessayer.
        </div>
      );
    }
  };

  return (
    <div className="quiz-container">
      <div className="containerPoint">
        <h3>
            Équipe A : 
            <p className="points">{teamAPoints} points{teamAPoints > 1 ? 's' : ''}</p>
        </h3>
        <h3>
            Équipe B : 
            <p className="points">{teamBPoints} points{teamBPoints > 1 ? 's' : ''}</p>
        </h3>
      </div>
      {renderQuestion()}
      {renderResultMessage()}
      <div className="timer-container">
        <div className="main-timer">{mainTimer} secondes</div>
      </div>
      <div className="containerTeamName">
        <div className="team-name">{teamName}</div>
        <div className="secondary-timer">{secondaryTimerActive ? `(${secondaryTimer} secondes)` : ''}</div>
      </div>
      <button onClick={() => handleBuzzerPress('Équipe A')}>Simuler buzzer Équipe A</button>
      <button onClick={() => handleBuzzerPress('Équipe B')}>Simuler buzzer Équipe B</button>
    </div>
  );
}