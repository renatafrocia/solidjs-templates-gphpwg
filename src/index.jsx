// External Library Imports
import { lazy } from "solid-js";
import { Route, Router, Routes } from "@solidjs/router";
import { render } from "solid-js/web";

// Internal Module Imports
import history from './history';

// Lazy Loaded Components
const Home = lazy(() => import("./Home"));
const Sessions = lazy(() => import("./Session"));
const Upload = lazy(() => import("./Upload"));
const Test = lazy(() => import("./Test"));
const TestTry = lazy(() => import("./TestTry"));
const Student = lazy(() => import("./Student"));
const Mentor = lazy(() => import("./Mentor"));
const Comparison = lazy(() => import("./Comparison"));
// Runs on each app load
function init() {
  renderApp()
}

// Main app initialization
init();

function renderApp() {
  render(
    () => (
      <Router history={history}>
        <Routes>
          <Route path="/" component={Home}/>
          <Route path="/sessions" component={Sessions}/>
          <Route path="/sessions/:testId" component={Test}/>
          <Route path="/sessions/:testId/:testTry" component={TestTry}/>
          <Route path="/student/:studentId" component={Student}/>
          <Route path="/mentor/:mentorId" component={Mentor}/>
          <Route path="/upload" component={Comparison}/>
        </Routes>
      </Router>
    ),
    document.getElementById('root')
  );
}

// Views handler
history.listen(({ action, location }) =>  {
  
  if(['POP'].includes(action)) {
    return history.go(0);
  } else if(['PUSH'].includes(action)) {
    // View push
    document.getElementById('root').innerHTML = '';
    renderApp();
    handleTokenAndNotifications(token)
  }
  window.scrollTo(0, 0);
});

