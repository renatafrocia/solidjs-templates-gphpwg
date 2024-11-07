//SolidJS
import { lazy, Suspense, createEffect } from "solid-js";
import { Router } from "solid-app-router";

//Components
const Test = lazy(() => import('./components/Test/test.jsx'));

function mainTest() {
  return (
    <>
      <Router>
        <Test/>
      </Router>
    </>
  );
}

export default mainTest;
