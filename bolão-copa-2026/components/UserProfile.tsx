import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Phone, Lock, Save, CheckCircle2, AlertCircle, Camera, Wallet, KeyRound } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  ticketPrice: number;
}

// Predefined Avatar List (Emojis + Background Colors)
const AVATAR_OPTIONS = [
  { id: '1', emoji: '🦁', color: 'bg-yellow-500' },
  { id: '2', emoji: '⚽', color: 'bg-green-500' },
  { id: '3', emoji: '🦊', color: 'bg-orange-500' },
  { id: '4', emoji: '👽', color: 'bg-purple-500' },
  { id: '5', emoji: '🤖', color: 'bg-slate-500' },
  { id: '6', emoji: '🦄', color: 'bg-pink-500' },
  { id: '7', emoji: '😎', color: 'bg-blue-500' },
  { id: '8', emoji: '🇧🇷', color: 'bg-green-600' },
  { id: '9', emoji: '🔥', color: 'bg-red-500' },
  { id: '10', emoji: '💎', color: 'bg-cyan-500' },
  { id: '11', emoji: '👑', color: 'bg-amber-400' },
  { id: '12', emoji: '🚀', color: 'bg-indigo-500' },
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, ticketPrice }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '');
  
  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // Real-time check
  const passwordsMatch = !confirmNewPassword || newPassword === confirmNewPassword;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    // (11) 91234-5678 (11 digits)
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
        value = `(${value.substring(0,2)}) ${value.substring(2)}`;
    }
    if (value.length > 10) {
        value = `${value.substring(0,10)}-${value.substring(10)}`;
    }
    setPhone(value);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let updatedPassword = user.password;

    // Password change logic
    if (newPassword) {
        if (currentPasswordInput !== user.password) {
            setError('Senha atual incorreta.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError('As novas senhas não coincidem.');
            return;
        }
        if (newPassword.length < 3) {
            setError('A nova senha deve ter pelo menos 3 caracteres.');
            return;
        }
        updatedPassword = newPassword;
    }

    onUpdateUser({
      ...user,
      name,
      email,
      phone,
      avatar: selectedAvatar,
      password: updatedPassword
    });

    // Reset password fields
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmNewPassword('');

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
       
       <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-md transition-colors">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
               <UserIcon size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white">Meu Perfil</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus dados e personalize sua conta</p>
             </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                <AlertCircle size={16} />
                {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
              
              {/* Avatar Section */}
              <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Escolha seu Avatar</label>
                  <div className="flex flex-col items-center sm:flex-row gap-6">
                      {/* Current Preview */}
                      <div className="flex flex-col items-center gap-2">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-slate-700 ${currentAvatar ? currentAvatar.color : 'bg-gray-200 dark:bg-slate-700'}`}>
                              {currentAvatar ? currentAvatar.emoji : <UserIcon size={40} className="text-slate-400"/>}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Atual</span>
                      </div>

                      {/* Grid */}
                      <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 justify-items-center">
                              {AVATAR_OPTIONS.map((opt) => (
                                  <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => setSelectedAvatar(opt.id)}
                                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-95 ${opt.color} ${selectedAvatar === opt.id ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 shadow-lg scale-110' : 'opacity-80 hover:opacity-100'}`}
                                  >
                                      {opt.emoji}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Nome Completo</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white font-medium"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome Sobrenome"
                      />
                  </div>
                  
                   <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Usuário (Login)</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Lock size={16} />
                          </div>
                          <input 
                            type="text" 
                            disabled
                            className="w-full pl-10 p-3 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                            value={user.username}
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Email</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Mail size={18} />
                          </div>
                          <input 
                            type="email" 
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">WhatsApp</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                             <Phone size={18} />
                          </div>
                          <input 
                            type="tel" 
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white font-medium"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                            placeholder="(11) 91234-5678"
                          />
                      </div>
                  </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <KeyRound size={18} />
                      Alterar Senha
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-900/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Senha Atual</label>
                          <input 
                            type="password" 
                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white"
                            placeholder="••••••"
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label>
                          <input 
                            type="password" 
                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors dark:text-white"
                            placeholder="Nova senha"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nova</label>
                          <input 
                            type="password" 
                            className={`w-full p-2.5 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 outline-none transition-colors dark:text-white ${!passwordsMatch ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'}`}
                            placeholder="Repita a nova senha"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                          />
                          {!passwordsMatch && (
                              <p className="text-[10px] text-red-500 font-bold mt-1">As senhas não conferem</p>
                          )}
                      </div>
                  </div>
              </div>

              {/* Status Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600 text-slate-500">
                          <Wallet size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Status da Inscrição</h4>
                          <p className="text-xs text-slate-500">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketPrice)}</p>
                      </div>
                  </div>
                  
                  {user.paid ? (
                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg font-bold text-sm">
                          <CheckCircle2 size={18} />
                          Pagamento Confirmado
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg font-bold text-sm">
                          <AlertCircle size={18} />
                          Aguardando Aprovação
                      </div>
                  )}
              </div>

              <div className="pt-4 flex justify-end">
                  <button 
                      type="submit"
                      className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                      {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                      {isSaved ? 'Dados Salvos!' : 'Salvar Alterações'}
                  </button>
              </div>

          </form>
       </div>
    </div>
  );
};
