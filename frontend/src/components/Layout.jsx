import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                PromptOps
              </Link>
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900"
              >
                Prompts
              </Link>
              <Link
                to="/analytics"
                className="text-gray-700 hover:text-gray-900"
              >
                Analytics
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <span className="text-xs text-gray-400">{user?.tenant?.name}</span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
