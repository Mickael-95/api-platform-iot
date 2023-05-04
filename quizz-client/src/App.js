import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Home from './views/Home';
import QuizPage from './views/QuizPage';


function App() {
  return (
    <div className="App"> 
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={QuizPage} />
          <Route exact path="/quiz" component={QuizPage} />
        </Switch>
      </BrowserRouter>
    </div> 
  );
}

export default App;
