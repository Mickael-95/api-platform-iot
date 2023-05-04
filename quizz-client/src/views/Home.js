import React, { useState, useEffect } from 'react';
import Loading from '../components/loading';
import '../App.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsLoading(false);
  //   }, 3000);

  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <div>
      {isLoading && <Loading />}
      <h1>Bienvenue sur quizz life</h1>
      <div className="bodyhome">
        <h2>Veuillez connecter les joueurs</h2>
      </div>
    </div>
  );
}