import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RuntimeProvider } from "./providers/Runtime.tsx";

createRoot(document.getElementById("root")!).render((
  <RuntimeProvider>
    <App />
  </RuntimeProvider>
));
