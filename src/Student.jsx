
import { Router } from "solid-app-router";
import MainStudent from './components/Interactors/student.jsx'


function Student() {
  return (
    <>
      <Router>
        <MainStudent/>
      </Router>
    </>
  );
}

export default Student;
