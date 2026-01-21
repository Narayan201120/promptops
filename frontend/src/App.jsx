import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Prompts from './pages/Prompts';
import PromptNew from './pages/PromptNew';
import PromptDetail from './pages/PromptDetail';
import PromptVersions from './pages/PromptVersions';
import Analytics from './pages/Analytics';
import Search from "./pages/Search";
import BenchmarkRun from "./pages/BenchmarkRun";
import BenchmarkDetail from "./pages/BenchmarkDetail";
import Datasets from "./pages/Datasets";
import BatchRunConfig from "./pages/BatchRunConfig";
import BatchRunDetail from "./pages/BatchRunDetail";
import Settings from "./pages/Settings";
import LandingPage from './pages/LandingPage';

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

              {/* Public Landing Page - redirects to dashboard if logged in */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                }
              />

              {/* Dashboard moved to /dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/prompts"
                element={
                  <PrivateRoute>
                    <Prompts />
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
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <Search />
                  </PrivateRoute>
                }
              />
              <Route
                path="/prompts/:id/benchmark"
                element={
                  <PrivateRoute>
                    <BenchmarkRun />
                  </PrivateRoute>
                }
              />
              <Route
                path="/benchmarks/:id"
                element={
                  <PrivateRoute>
                    <BenchmarkDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/datasets"
                element={
                  <PrivateRoute>
                    <Datasets />
                  </PrivateRoute>
                }
              />
              <Route
                path="/prompts/:id/batch"
                element={
                  <PrivateRoute>
                    <BatchRunConfig />
                  </PrivateRoute>
                }
              />
              <Route
                path="/batch-runs/:id"
                element={
                  <PrivateRoute>
                    <BatchRunDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
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
