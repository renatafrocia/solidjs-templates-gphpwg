
import { Router } from "solid-app-router";
import MainMentor from './components/Interactors/mentor.jsx'


function Mentor() {
  return (
    <>
      <Router>
        <MainMentor/>
      </Router>
    </>
  );
}

export default Mentor;
