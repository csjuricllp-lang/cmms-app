import { useNavigate } from 'react-router-dom';
import { CreateAssetModal } from '../components/CreateAssetModal';

export const CreateAssetPage = () => {
    const navigate = useNavigate();
    
    return (
        <CreateAssetModal 
            isOpen={true} 
            onClose={() => navigate('/assets')} 
        />
    );
};
