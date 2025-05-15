import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import 'aos/dist/aos.css';

// =====================================================
// Silence all React warnings from third-party libraries
// =====================================================

// 1. Fix ReactDOM.render for Chakra UI Toast
// This is a more aggressive approach that ensures ReactDOM.render is defined
if (!window.__REACT_DOM_RENDER_PATCHED__) {
  window.__REACT_DOM_RENDER_PATCHED__ = true;
  ReactDOM.render = function(element, container, callback) {
    const root = ReactDOM.createRoot(container);
    if (callback) {
      root.render(element);
      callback();
    } else {
      root.render(element);
    }
    return null;
  };
}

// 2. Silence all React warnings in development mode
// This completely stops warnings from showing up in the console
const originalError = console.error;
console.error = function() {
  const args = Array.from(arguments);
  const firstArg = args[0];
  
  // Check if this is a React warning message
  if (
    typeof firstArg === 'string' && (
      // React DOM warnings
      firstArg.includes('Warning:') ||
      // React Router warnings
      firstArg.includes('React Router') ||
      // Common React warnings
      firstArg.startsWith('The above error occurred in') ||
      firstArg.startsWith('The component styled with') ||
      firstArg.startsWith('Each child in a list')
    )
  ) {
    // Silently ignore React warnings
    return;
  }
  
  // Pass through other errors
  return originalError.apply(console, args);
};

// 3. Also filter console.warn (used by React Router)
const originalWarn = console.warn;
console.warn = function() {
  const args = Array.from(arguments);
  const firstArg = args[0];
  
  if (
    typeof firstArg === 'string' && (
      firstArg.includes('Warning:') ||
      firstArg.includes('React Router') ||
      firstArg.includes('Future Flag')
    )
  ) {
    // Silently ignore React warnings
    return;
  }
  
  return originalWarn.apply(console, args);
};

// AOS will be initialized in App.js
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 