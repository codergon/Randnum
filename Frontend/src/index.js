import "./utils/axios";
import App from "./App";
import dayjs from "dayjs";
import React from "react";
import "./styles/main.scss";
import { RecoilRoot } from "recoil";
import ReactDOM from "react-dom/client";
import TimeAgo from "javascript-time-ago";
import duration from "dayjs/plugin/duration";
import "react-tooltip/dist/react-tooltip.css";
import isBetween from "dayjs/plugin/isBetween";
import en from "javascript-time-ago/locale/en.json";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
TimeAgo.addDefaultLocale(en);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </React.StrictMode>
);
