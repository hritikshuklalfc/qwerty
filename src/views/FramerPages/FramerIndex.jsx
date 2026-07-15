import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FramerIndex() {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'NAVIGATE' && e.data.path) {
        navigate(e.data.path);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div className="w-full h-screen overflow-hidden" style={{ isolation: 'isolate' }}>
      <iframe 
        src={`/framer/index.html?v=${Date.now()}${session ? '&auth=true' : ''}`}
        className="w-full h-full border-none m-0 p-0 block"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', willChange: 'transform' }}
        title="FramerIndex"
      />
    </div>
  );
}
