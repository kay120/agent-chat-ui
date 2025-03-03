import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { StreamProvider } from "./providers/Stream.tsx";

createRoot(document.getElementById("root")!).render(
  <StreamProvider>
    <App />
  </StreamProvider>,
);
