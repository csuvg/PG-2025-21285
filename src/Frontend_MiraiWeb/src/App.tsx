import { MantineProvider } from '@mantine/core';
import { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './hooks/sidebar/Sidebar';
import Topbar from './hooks/topbar/topbar';
import Analiticas from './pages/analiticas';
import Foros from './pages/foros/foros';
import Comentarios from './pages/foros/comentarios';
import Testimoniosegresdos from './pages/testimoniosegresados/testimoniosegresdos';
import Gestionvocacional from './pages/gestionvocacional/gestionvocacional';
import Cuentas from './pages/cuentas/cuentas';
import Perfil from './pages/perfil/perfil';
import Login from './pages/login/login';
import Register from './pages/register/register';
import Infovocacional from './pages/infoorientacionvocacional/infovocacional';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <MantineProvider>
      <ModalsProvider>
      <Notifications />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/app/*"
            element={
              <div className="flex">
                <div 
                  style={{ 
                    width: sidebarCollapsed ? '80px' : '280px', 
                    flexShrink: 0,
                    transition: 'width 0.3s ease-in-out'
                  }}
                >
                  <Sidebar onCollapseChange={setSidebarCollapsed} />
                </div>
                <div className="flex-1 flex flex-col min-h-screen">
                  <Topbar />
                  <div className="flex-1">
                    <Routes>
                      <Route path="analiticas" element={<ProtectedRoute><Analiticas /></ProtectedRoute>} />
                      <Route path="foros" element={<ProtectedRoute><Foros /></ProtectedRoute>} />
                      <Route path="foros/:foroId" element={<ProtectedRoute><Comentarios /></ProtectedRoute>} />
                      <Route path="testimoniosegresdos" element={<ProtectedRoute><Testimoniosegresdos /></ProtectedRoute>} />
                      <Route path="gestionvocacional" element={<ProtectedRoute><Gestionvocacional /></ProtectedRoute>} />
                      <Route path="infovocacional" element={<ProtectedRoute><Infovocacional /></ProtectedRoute>} />
                      <Route path="cuentas" element={<ProtectedRoute><Cuentas /></ProtectedRoute>} />
                      <Route path="perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                    </Routes>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
      </ModalsProvider>
    </MantineProvider>
  );
}