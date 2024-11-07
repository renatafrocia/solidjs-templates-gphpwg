//SolidJS
import { lazy, Suspense, createEffect } from "solid-js";
import { Router } from "solid-app-router";

//Components
const Home = lazy(() => import('./components/Home/home.jsx'));

function mainHome() {
  return (
    <>
      <Router>
        <Home/>
      </Router>
    </>
  );
}

export default mainHome;
