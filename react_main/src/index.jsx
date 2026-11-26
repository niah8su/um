import React from "react";
import ReactDOM from "react-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "lib/firebaseConfig";

import Main from "./Main";
import { BrowserRouter } from "react-router-dom";

initializeApp(firebaseConfig);

try {
  if (window.localStorage.getItem("um-skin-redesign") === "1") {
    document.documentElement.classList.add("skin-redesign");
  }
} catch (e) {}

ReactDOM.render(
  <BrowserRouter>
    <Main />
  </BrowserRouter>,
  document.getElementById("root")
);
