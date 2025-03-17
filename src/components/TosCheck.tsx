import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function TosCheck() {
    const navigate = useNavigate();

    useEffect(() => {
        const tosStatus = localStorage.getItem('disclaimerAccepted');
        if (!tosStatus) {
            navigate('/');
        }
    }, [navigate]);

    return null;
} 