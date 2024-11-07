
import { Router } from "solid-app-router";
import MainComparison from './components/Comparison/comparison.jsx'


function Comparison() {
  return (
    <>
      <Router>
        <MainComparison/>
      </Router>
    </>
  );
}

export default Comparison;
