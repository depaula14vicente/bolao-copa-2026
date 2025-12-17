import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detect Standalone (App already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (isStandalone) return; 

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (ios) {
        setSupportsPWA(true);
        setIsVisible(true);
    }

    // Detect Android/Desktop PWA prompt
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (isIOS) {
        setShowIOSInstructions(true);
    } else if (promptInstall) {
        promptInstall.prompt();
        promptInstall.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setIsVisible(false);
            }
        });
    }
  };

  if (!supportsPWA || !isVisible) {
    return null;
  }

  return (
    <>
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

        {showIOSInstructions && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowIOSInstructions(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up border-t sm:border border-gray-200 dark:border-slate-700 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                    
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        Instalar no iPhone
                    </h3>
                    
                    <ol className="space-y-4 text-slate-600 dark:text-slate-300 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                            <span>Toque no botão <strong>Compartilhar</strong> <Share size={16} className="inline mx-1" /> na barra inferior do Safari.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                            <span>Role para cima e toque em <strong>Adicionar à Tela de Início</strong> <PlusSquare size={16} className="inline mx-1" />.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                            <span>Confirme clicando em <strong>Adicionar</strong> no canto superior direito.</span>
                        </li>
                    </ol>
                    
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => setShowIOSInstructions(false)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-lg">
                            Entendi
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};