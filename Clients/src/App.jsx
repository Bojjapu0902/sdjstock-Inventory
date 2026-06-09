import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth }                from './contexts/AuthContext';
import { InventoryStockProvider } from './hooks/useInventoryStock';
import { ProjectsProvider }       from './contexts/ProjectsContext';

import Layout         from './components/layout/Layout';
import Loader         from './components/common/Loader';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Inventory      from './pages/Inventory';
import UpdateStock    from './pages/UpdateStock';
import PurchaseOrders from './pages/PurchaseOrders';
import Suppliers      from './pages/Suppliers';
import Wastage        from './pages/Wastage';
import Reports        from './pages/Reports';
import Settings       from './pages/Settings';
import Projects       from './pages/Projects';
import AddItems       from './pages/AddItems';
import ProjectDetails from './pages/ProjectDetails';
import Users          from './pages/Users';

const App = () => {
  const { user, login } = useAuth();
  const [loadingDone, setLoadingDone] = useState(false);

  if (!loadingDone) return <Loader onComplete={() => setLoadingDone(true)} />;
  if (!user)        return <Login onLogin={login} />;

  const rootRedirect = user.role === 'User' && user.projectId
    ? `/project/${user.projectId}`
    : '/inventory';

  return (
    <InventoryStockProvider>
      <ProjectsProvider>
        <Routes>
          {/* Project-user view: no sidebar */}
          <Route path="/project/:projectId" element={<ProjectDetails />} />

          {/* Admin / operator view: full Layout with sidebar */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/"             element={<Navigate to={rootRedirect} replace />} />
                <Route path="/inventory"    element={<Inventory />}      />
                <Route path="/add-items"    element={<AddItems />}       />
                <Route path="/stock-update" element={<UpdateStock />}    />
                <Route path="/orders"       element={<PurchaseOrders />} />
                <Route path="/suppliers"    element={<Suppliers />}      />
                <Route path="/wastage"      element={<Wastage />}        />
                <Route path="/reports"      element={<Reports />}        />
                <Route path="/settings"     element={<Settings />}       />
                <Route path="/projects"     element={<Projects />}       />
                <Route path="/users"        element={<Users />}          />
                <Route path="*"             element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </ProjectsProvider>
    </InventoryStockProvider>
  );
};

export default App;
