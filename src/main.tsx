import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { StreamProvider } from "./providers/Stream.tsx";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

createRoot(document.getElementById("root")!).render(
  <QueryParamProvider adapter={ReactRouter6Adapter}>
    <StreamProvider>
      <App />
    </StreamProvider>
  </QueryParamProvider>
);
