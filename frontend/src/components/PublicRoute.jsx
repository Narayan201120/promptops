import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
    const { user } = useAuth();

    // If user is logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    // Otherwise, show the public page (landing page)
    return children;
}
