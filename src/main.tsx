import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { App } from './app/App';
import { OrientationGuard } from './app/OrientationGuard';
import { UpdatePrompt } from './app/UpdatePrompt';
import { ThemeProvider } from './app/providers/ThemeProvider';
import './styles/global.css';

const rootElement = document.querySelector<HTMLDivElement>('#root');

if (!rootElement) {
  throw new Error('Не найден корневой элемент приложения');
}

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
        <OrientationGuard />
        <UpdatePrompt />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
