import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    // Wait for the user to respond to the prompt
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setSupportsPWA(false); // Hide button after install
      } else {
        console.log('User dismissed the install prompt');
      }
    });
  };

  if (!supportsPWA || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-[90] animate-bounce-in">
      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-2xl p-1 pr-4 flex items-center gap-3 border border-slate-700 dark:border-slate-200">
        <button 
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-colors"
        >
            <X size={16} />
        </button>
        <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Instalar App</span>
            <span className="text-sm font-black leading-none">Acesso Rápido</span>
        </div>
        <button
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 ml-2"
          onClick={onClick}
          title="Instalar Aplicativo"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};