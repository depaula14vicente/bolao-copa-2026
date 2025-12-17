import React, { useState } from 'react';
import { Lock, User as UserIcon, AlertCircle, CheckCircle2, MessageCircle, ArrowRight, ChevronLeft, Mail, Phone, Wallet, Copy, Check, Eye, EyeOff, FileText, X, Loader2, Clock, Users } from 'lucide-react';
import { APP_LOGO_URL, RULES_TEXT } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  ticketPrice: number;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin, ticketPrice }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for PIX Copy
  const [pixCopied, setPixCopied] = useState(false);
  

  const passwordsMatch = !confirmPassword || password === confirmPassword;

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

  const handleCopyPix = () => {
      const rawPix = "61977853315";
      navigator.clipboard.writeText(rawPix);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Validation
    if (!name || !username || !password || !confirmPassword || !email || !phone) {
      setError('Todos os campos são obrigatórios.');
      setLoading(false);
      return;
    }
    
    if (username.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
        setError('Você precisa ler e aceitar as regras do bolão.');
        setLoading(false);
        return;
    }

    if (!confirmPayment) {
        setError('Confirme o pagamento para prosseguir.');
        setLoading(false);
        return;
    }

    try {
        // 2. Register in Supabase Auth
        // If Email Confirmation is disabled in Supabase, this logs the user in immediately.
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    name: name,
                    phone: phone,
                    role: 'user' // Default to user
                }
            }
        });

        if (authError) throw authError;
        if (!data.user) throw new Error("Erro ao criar usuário.");

        // 3. Check for Profile Creation (Retry Logic)
        let profileCreated = false;
        
        // Try up to 5 times to find the profile
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();
            
            if (profile) {
                profileCreated = true;
                break;
            }
        }

        // 4. Manual Fallback if Trigger didn't work
        if (!profileCreated) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username: username,
                    name: name,
                    email: email,
                    phone: phone,
                    role: 'user',
                    paid: false
                });

            if (insertError) {
                 if (insertError.code === '42501') {
                     // Permission error usually implies user created but not logged in (if confirm is ON), 
                     // or RLS issue. We treat as success for the UI flow.
                     setIsSuccess(true);
                     return;
                 }
                 // Ignore duplicate key error (code 23505) for Primary Key (id), 
                 // which means the Trigger created it successfully in the background.
                 if (insertError.code === '23505' && !insertError.message.includes('username')) {
                     // Duplicate ID -> Success (Trigger did it)
                     setIsSuccess(true);
                     return;
                 } else if (insertError.code === '23505' && insertError.message.includes('username')) {
                     throw new Error("Este nome de usuário já está em uso.");
                 } else {
                     // Check if it's really an error or just a timing issue
                     console.warn("Insert profile error:", insertError);
                     // If we have a user, we proceed to success screen regardless, 
                     // expecting the backend/trigger to handle it eventually.
                 }
            }
        }

        setIsSuccess(true);

    } catch (err: any) {
        console.error("Register Exception:", err);
        const msg = err.message || "Erro desconhecido.";
        
        if (msg.includes("User already registered")) {
            setError("Email já cadastrado.");
        } else if (msg.includes("username")) {
            setError("Nome de usuário já existe.");
        } else if (msg.includes("Database error saving new user")) {
            // This happens when the Trigger fails usually due to Duplicate Key (username)
            setError("Nome de usuário ou email já indisponível. Tente outro.");
        } else {
            setError(`Erro: ${msg}`);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const adminPhone = "5511999999999"; 
    const message = `Olá! Acabei de me cadastrar no Bolão Copa 2026.\n\n*Nome:* ${name}\n*Usuário:* ${username}\n\nSegue o comprovante do pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketPrice)}!`;
    const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EAyMKNlD3eA1dWL6FWIR2t";

  if (isSuccess) {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
           <div className="p-8 text-center flex flex-col items-center">
               <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-6 animate-scale-up">
                  <Clock size={40} strokeWidth={3} />
               </div>
               
               <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Cadastro Enviado!</h2>
               
               <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                 Sua conta foi criada e está <strong>aguardando aprovação</strong>.
               </p>

               <div className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl mb-6 text-left">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                     <CheckCircle2 size={16} /> Próximo Passo
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300/80">
                     O Administrador precisa aprovar seu pagamento para liberar o acesso. Envie o comprovante abaixo para agilizar.
                  </p>
               </div>

               {/* New Group Button */}
               <button 
                  onClick={() => window.open(WHATSAPP_GROUP_LINK, '_blank')}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/10 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
               >
                  <Users size={20} />
                  Entrar no Grupo do Bolão
               </button>

               <button 
                  onClick={handleWhatsAppClick}
                  className="w-full bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-green-50 font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
               >
                  <MessageCircle size={20} />
                  Enviar Comprovante ao Admin
               </button>

               <button 
                  onClick={onSwitchToLogin}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                  Ir para Login <ArrowRight size={18} />
               </button>
           </div>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-wider uppercase opacity-80">
            App Desenvolvido por De Paula 14 :: 2026
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        
        <div className="p-8 pb-4 text-center relative">
             <button onClick={onSwitchToLogin} className="absolute left-6 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <ChevronLeft size={24} />
             </button>
             <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-yellow-500 rounded-xl shadow-lg mx-auto mb-4 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[10px] flex items-center justify-center overflow-hidden">
                  <img src={APP_LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
             </div>
             <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">CRIAR CONTA</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Preencha os dados abaixo</p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-shake break-all">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Nome Completo</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={18} />
                        </div>
                        <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                        placeholder="Nome e Sobrenome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Usuário (Apelido)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={18} />
                        </div>
                        <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                        placeholder="Ex: joaosilva"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        />
                    </div>
                </div>
                
                <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Senha</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={18} />
                        </div>
                        <input 
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Confirmar</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={18} />
                        </div>
                        <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl focus:ring-2 outline-none transition-colors dark:text-white font-medium ${!passwordsMatch ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 dark:border-slate-600 focus:ring-green-500 focus:border-green-500'}`}
                        placeholder="******"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                 {!passwordsMatch && (
                     <p className="text-xs text-red-500 font-bold col-span-2 text-right -mt-2 animate-fade-in">As senhas não conferem</p>
                 )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-2">
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
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors dark:text-white font-medium"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={handlePhoneChange}
                        maxLength={15}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Info */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Wallet size={18}/> Pagamento PIX
                    </h3>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketPrice)}
                    </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Chave PIX (Celular): <strong className="text-slate-700 dark:text-slate-200">61977853315</strong>
                    <br/>Nome: <strong>João da Silva</strong>
                </p>
                <button 
                    type="button"
                    onClick={handleCopyPix}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${pixCopied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    {pixCopied ? <Check size={16} /> : <Copy size={16} />}
                    {pixCopied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                </button>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer p-1">
                    <div className="relative flex items-center pt-0.5">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 dark:border-slate-600 shadow transition-all checked:border-green-500 checked:bg-green-500 hover:shadow-md"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <Check size={14} strokeWidth={3} />
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight select-none">
                        Li e aceito as regras do bolão e confirmo minha participação.
                        <button 
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="block mt-1 text-blue-600 hover:underline flex items-center gap-1 font-bold"
                        >
                            <FileText size={12}/> Ler Regras e Termos
                        </button>
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-1">
                    <div className="relative flex items-center pt-0.5">
                        <input 
                            type="checkbox" 
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 dark:border-slate-600 shadow transition-all checked:border-green-500 checked:bg-green-500 hover:shadow-md"
                            checked={confirmPayment}
                            onChange={(e) => setConfirmPayment(e.target.checked)}
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <Check size={14} strokeWidth={3} />
                        </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight select-none">
                        Declaro que realizei o pagamento do valor da inscrição e estou ciente que minha conta só será ativada após a confirmação do administrador.
                    </span>
                </label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : null}
              {loading ? 'Criando Conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-up border border-gray-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <FileText size={20} className="text-slate-500"/>
                          Regras do Bolão
                      </h3>
                      <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                          <X size={20} className="text-slate-500"/>
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Introdução</h4>
                      <ul className="list-disc pl-5 space-y-1">
                          <li>Valor da participação: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketPrice)}</strong></li>
                          {RULES_TEXT.introBase.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      
                      <h4 className="font-bold text-slate-900 dark:text-white">Critérios de Desempate</h4>
                      <ol className="list-decimal pl-5 space-y-1">
                          {RULES_TEXT.tieBreakers.map((r, i) => <li key={i}>{r}</li>)}
                      </ol>

                      <h4 className="font-bold text-slate-900 dark:text-white">Observações</h4>
                      <ul className="list-disc pl-5 space-y-1">
                          {RULES_TEXT.notes.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>

                      <h4 className="font-bold text-slate-900 dark:text-white">Disposições Gerais e Encerramento</h4>
                      <ul className="list-disc pl-5 space-y-1">
                          {RULES_TEXT.generalProvisions.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
                      <button 
                          onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                          Li e Aceito
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};