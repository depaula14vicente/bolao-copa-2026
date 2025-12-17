import React, { useEffect } from 'react';
import { APP_LOGO_URL } from '../constants';

export const SplashScreen: React.FC = () => {
  useEffect(() => {
    // String Base64 válida para um arquivo WAV silencioso/curto
    const popSound = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==";
    
    const playSound = async () => {
        try {
            const a = new Audio(popSound);
            a.volume = 0.3;
            // O navegador pode bloquear o autoplay se não houver interação do usuário.
            // Usamos catch para garantir que o app não quebre se isso acontecer.
            await a.play().catch(() => {}); 
        } catch (e) {
            // Ignora silenciosamente erros de áudio
        }
    };
    
    // Pequeno delay
    const timer = setTimeout(playSound, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-slate-900 to-blue-900/40 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(15,23,42,0.8)_100%)]"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Logo Container */}
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
           <div className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-[spin_10s_linear_infinite] transform hover:scale-110 transition-transform duration-700">
              <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
           </div>
        </div>

        {/* Text Animations */}
        <div className="text-center space-y-2">
           <h2 className="text-2xl md:text-3xl font-bold text-slate-300 tracking-[0.2em] opacity-0 animate-[fadeInUp_1s_ease-out_0.5s_forwards]">
             BEM-VINDO AO BOLÃO
           </h2>
           <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-blue-500 opacity-0 animate-[fadeInUp_1s_ease-out_1s_forwards] drop-shadow-lg transform scale-90">
             COPA 2026
           </h1>
        </div>

        {/* Loading Bar */}
        <div className="mt-12 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden opacity-0 animate-[fadeIn_0.5s_ease-out_1.5s_forwards]">
           <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 w-0 animate-[loadingBar_2s_ease-in-out_1.8s_forwards]"></div>
        </div>
        
        <p className="mt-4 text-xs font-mono tracking-widest text-white font-bold opacity-0 animate-[fadeIn_1s_ease-out_2s_forwards]">
          CARREGANDO DADOS...
        </p>
      </div>

      {/* Developer Credits */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-20 opacity-0 animate-[fadeIn_1s_ease-out_2s_forwards]">
         <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-60">
            App Desenvolvido por De Paula 14 :: 2026
         </p>
      </div>

      {/* CSS Keyframes injected here for simplicity */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};