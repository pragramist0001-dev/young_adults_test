import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, role }) => {
    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (role && user.role && user.role.toLowerCase() !== role.toLowerCase()) {
        // If admin, can access teacher routes? Usually yes, or strict separation.
        // Spec says Admin manages teachers, Teacher manages tests.
        // Admin checking 'teacher' route might be allowed if admin also teaches?
        // For now, strict check.
        if (user.role === 'admin' && role === 'teacher') return children; // Allow admin to see teacher dash? Maybe not.

        return <Navigate to="/" />;
    }

    return children;
};

export default PrivateRoute;
