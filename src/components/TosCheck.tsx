import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOS_STORAGE_KEY = 'mgf_tos_agreed';

export function TosCheck() {
    const navigate = useNavigate();

    useEffect(() => {
        const tosStatus = localStorage.getItem(TOS_STORAGE_KEY);
        if (!tosStatus) {
            navigate('/');
        }
    }, [navigate]);

    return null;
} 