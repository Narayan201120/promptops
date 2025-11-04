import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PromptNew from './pages/PromptNew';
import PromptDetail from './pages/PromptDetail';
import PromptVersions from './pages/PromptVersions';
import Analytics from './pages/Analytics';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/prompts/new"
              element={
                <PrivateRoute>
                  <PromptNew />
                </PrivateRoute>
              }
            />
            <Route
              path="/prompts/:id"
              element={
                <PrivateRoute>
                  <PromptDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/prompts/:id/versions"
              element={
                <PrivateRoute>
                  <PromptVersions />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
