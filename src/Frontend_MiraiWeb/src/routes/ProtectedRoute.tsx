import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import React from "react";

export const ProtectedRoute = ({children}:{children: React.ReactNode}) => {
    const { isLoaded, isSignedIn } = useUser();

    // componente de carga mientras se verifica el estado de autenticación
    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    // si no está autenticado, redirigir al login
    if (!isSignedIn) {
        return <Navigate to="/" />;
    }

    return children
}
    