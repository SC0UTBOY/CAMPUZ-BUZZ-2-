
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeDeployment } from "./utils/deploymentConfig";
import { RootErrorBoundary } from "./components/common/RootErrorBoundary";

// Initialize deployment configuration
initializeDeployment().then((config) => {
  console.log('CampuzBuzz initialized successfully:', config.environment);
}).catch((error) => {
  console.error('Failed to initialize deployment:', error);
  // Don't prevent app loading if deployment config fails
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found. Please check your HTML template.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
