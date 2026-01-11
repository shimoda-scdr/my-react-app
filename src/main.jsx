import React from "react";
import ReactDOM from "react-dom/client"; // 'client' が付くのが新しいルール
import { App } from "./App";
import { CssModules } from "./components/CssModules";
// 1. まず「root（根っこ）」を作る
const root = ReactDOM.createRoot(document.getElementById("root"));

// 2. そのrootに対してrenderを指示する
root.render(CssModules());