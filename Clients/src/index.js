import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';

import App from './App';
import { AuthProvider }           from './contexts/AuthContext';
import { ProjectsProvider }       from './contexts/ProjectsContext';
import { InventoryStockProvider } from './hooks/useInventoryStock';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InventoryStockProvider>
          <ProjectsProvider>
            <App />
          </ProjectsProvider>
        </InventoryStockProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
