import React, { useState } from 'react';
import { LogIn, Lock, AlertCircle, Eye, EyeOff, Mail, Loader2 } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email e senha são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Login successful, App.tsx will handle state change
      
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err.message || 'Erro ao fazer login.';
      
      // Translate common Supabase errors
      if (msg === 'Invalid login credentials') {
          msg = 'Email ou senha incorretos.';
      } else if (msg.includes('Email not confirmed')) {
          msg = 'Erro de verificação: Se você é o admin, execute o comando SQL de correção no painel do Supabase.';
      }

      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl shadow-lg mx-auto mb-6 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[14px] flex items-center justify-center overflow-hidden">
                  <img src={APP_LOGO_URL} alt="Logo" className="w-12 h-12 object-contain" />
                </div>
             </div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">BOLÃO COPA 2026</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Faça login para continuar</p>
        </div>

        {/* Form */}
        <div className="p-8 pt-0 space-y-6">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="text-center pt-2 pb-2">
             <span className="text-sm text-slate-500 dark:text-slate-400">Não tem uma conta?</span>
             <button onClick={onSwitchToRegister} className="ml-1 text-sm font-bold text-green-600 hover:underline">Cadastre-se</button>
          </div>
        </div>
      </div>
      
      {/* Footer Credits */}
      <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-wider uppercase opacity-80">
         App Desenvolvido por De Paula 14 :: 2026
      </p>
    </div>
  );
};
