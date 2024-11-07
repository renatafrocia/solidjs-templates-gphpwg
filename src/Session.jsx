//SolidJS
import { lazy, Suspense, createEffect } from "solid-js";
import { Router } from "solid-app-router";

//Components
const Sessions = lazy(() => import('./components/Home/sessions.jsx'));

function mainSessions() {
  return (
    <>
      <Router>
        <Sessions/>
      </Router>
    </>
  );
}

export default mainSessions;
