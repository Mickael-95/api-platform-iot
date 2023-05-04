import React, { useState } from "react";
import quizData from "../questions.json";
import "../Quiz.css";

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

  const handleAnswerClick = (option) => {
    if (answerStatus === 'correct') return;

    setSelectedOption(option);

    if (option === quizData.questions[currentQuestion].answer) {
      setAnswerStatus('correct');
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
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswerStatus(null);
      setSelectedOption(null);
      setOptionBackgrounds({ 0: '#f0f0f0', 1: '#f0f0f0', 2: '#f0f0f0', 3: '#f0f0f0' });
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
          <span className="result-symbol">&#10004;</span> Bonne réponse !
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
      {renderQuestion()}
      {renderResultMessage()}
    </div>
  );
}