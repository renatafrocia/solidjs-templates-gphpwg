
import { Router } from "solid-app-router";
import MainUpload from './components/Upload/upload.jsx'


function Upload() {
  return (
    <>
      <Router>
        <MainUpload/>
      </Router>
    </>
  );
}

export default Upload;
