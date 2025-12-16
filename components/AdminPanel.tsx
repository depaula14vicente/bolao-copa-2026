import React, { useState } from 'react';
import { AppConfig, ScoringRule, PrizeConfig, User, Match, Notification } from '../types';
import { Settings, Save, Target, RotateCcw, DollarSign, Percent, Zap, Plus, X, Users, CheckCircle, Bell, Send, Download, RefreshCw, Wallet, Search, Crown, AlertTriangle } from 'lucide-react';
import { INITIAL_SCORING_RULES, INITIAL_TICKET_PRICE, INITIAL_PRIZE_DISTRIBUTION, INITIAL_SPECIAL_TEAMS, INITIAL_SPECIAL_PHASES, TEAMS_LIST, PHASES_LIST, MOCK_MATCHES } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface AdminPanelProps {
  config: AppConfig;
  users: User[];
  onUpdateConfig: (newConfig: AppConfig) => void;
  onUpdateUsers: (updatedUsers: User[]) => void;
  onSendNotification: (notification: Notification) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, users, onUpdateConfig, onUpdateUsers, onSendNotification }) => {
  const [rules, setRules] = useState<ScoringRule[]>(config.scoringRules);
  const [ticketPrice, setTicketPrice] = useState(config.ticketPrice);
  const [prizeDist, setPrizeDist] = useState<PrizeConfig>(config.prizeDistribution);
  
  // Multipliers
  const [specialTeams, setSpecialTeams] = useState<string[]>(config.specialTeams);
  const [specialPhases, setSpecialPhases] = useState<string[]>(config.specialPhases);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');

  // Notifications State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'alert' | 'success'>('info');
  const [isNotifSent, setIsNotifSent] = useState(false);

  // Financial Filter State
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [justApproved, setJustApproved] = useState<string | null>(null);

  const handleRuleChange = (id: string, newPoints: string) => {
    const points = parseInt(newPoints) || 0;
    setRules(rules.map(r => r.id === id ? { ...r, points } : r));
    setIsSaved(false);
  };

  const handlePrizeChange = (key: keyof PrizeConfig, val: string) => {
      const num = parseInt(val) || 0;
      setPrizeDist({ ...prizeDist, [key]: num });
      setIsSaved(false);
  };

  const addSpecialTeam = () => {
    if (selectedTeam && !specialTeams.includes(selectedTeam)) {
        setSpecialTeams([...specialTeams, selectedTeam]);
        setSelectedTeam('');
        setIsSaved(false);
    }
  };

  const removeSpecialTeam = (team: string) => {
      setSpecialTeams(specialTeams.filter(t => t !== team));
      setIsSaved(false);
  };

  const addSpecialPhase = () => {
    if (selectedPhase && !specialPhases.includes(selectedPhase)) {
        setSpecialPhases([...specialPhases, selectedPhase]);
        setSelectedPhase('');
        setIsSaved(false);
    }
  };

  const removeSpecialPhase = (phase: string) => {
      setSpecialPhases(specialPhases.filter(p => p !== phase));
      setIsSaved(false);
  };
  
  const togglePayment = (username: string, currentStatus: boolean | undefined) => {
      const updatedUsers = users.map(u => u.username === username ? { ...u, paid: !currentStatus } : u);
      onUpdateUsers(updatedUsers);
      
      if (!currentStatus) {
        setJustApproved(username);
        setTimeout(() => setJustApproved(null), 3000);
      }
  };

  const handleSendNotif = () => {
      if (!notifTitle || !notifMessage) return;
      
      const newNotif: Notification = {
          id: Date.now().toString(),
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          date: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          read: false
      };

      onSendNotification(newNotif);
      setIsNotifSent(true);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setIsNotifSent(false), 2500);
  };

  const handleManualSync = async () => {
      if (isSyncing || syncSuccess) return;

      setIsSyncing(true);
      setSyncError('');
      
      try {
          // 1. Check if user is actually admin in DB (Double Check)
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado.");

          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role !== 'admin') {
              throw new Error("Seu usuário não tem permissão 'admin' no banco de dados. Execute o SQL de atualização no Supabase.");
          }

          const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true });
          
          const confirmMsg = count && count > 0 
            ? "Já existem jogos no banco. Deseja atualizar/inserir novos jogos? (Isso não apagará jogos existentes)" 
            : "A tabela de jogos está vazia. Deseja inserir a tabela oficial da Copa 2026?";

          if (confirm(confirmMsg)) {
             
              // Map MOCK_MATCHES to DB Schema, ensuring explicit ID
              const payload = MOCK_MATCHES.map(m => ({
                id: m.id, 
                team_a: m.teamA,
                team_b: m.teamB,
                date_time: m.date,
                group_name: m.group,
                location: m.location,
                is_brazil: m.isBrazil,
                // Do not overwrite scores if they exist in DB, unless we want to reset. 
                // Upsert handles new rows or updates. We generally shouldn't reset official scores here unless intended.
                // For initial sync, official scores in mock are usually undefined/null.
              }));

              const { error } = await supabase.from('matches').upsert(payload, { onConflict: 'id' });
              
              if (error) {
                  throw error;
              }
              
              setSyncSuccess(true);
              alert("Sincronização concluída com sucesso! Os jogos agora estão no banco de dados.");
              
              setTimeout(() => {
                  window.location.reload();
              }, 1500);
          } else {
              setIsSyncing(false);
          }

      } catch (err: any) {
          console.error("Erro ao sincronizar:", err);
          let msg = "Erro desconhecido";
          if (typeof err === 'string') msg = err;
          else if (err && typeof err === 'object') msg = err.message || JSON.stringify(err);
          
          if (msg.includes("new row violates row-level security policy")) {
              msg = "Permissão negada! O banco bloqueou a escrita. Verifique se você rodou o SQL de atualização de Admin.";
          }

          setSyncError(msg);
          setIsSyncing(false);
          setSyncSuccess(false);
      }
  };

  const handleSave = () => {
    onUpdateConfig({
      scoringRules: rules,
      ticketPrice: ticketPrice,
      prizeDistribution: prizeDist,
      specialTeams: specialTeams,
      specialPhases: specialPhases
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Tem certeza que deseja resetar para os valores padrão?")) {
        setRules(INITIAL_SCORING_RULES);
        setTicketPrice(INITIAL_TICKET_PRICE);
        setPrizeDist(INITIAL_PRIZE_DISTRIBUTION);
        setSpecialTeams(INITIAL_SPECIAL_TEAMS);
        setSpecialPhases(INITIAL_SPECIAL_PHASES);
        
        onUpdateConfig({
            scoringRules: INITIAL_SCORING_RULES,
            ticketPrice: INITIAL_TICKET_PRICE,
            prizeDistribution: INITIAL_PRIZE_DISTRIBUTION,
            specialTeams: INITIAL_SPECIAL_TEAMS,
            specialPhases: INITIAL_SPECIAL_PHASES
        });
    }
  };

  // Financial Calculations
  const activeUsers = users.filter(u => u.role === 'user');
  const paidUsers = activeUsers.filter(u => u.paid);
  const pendingUsers = activeUsers.filter(u => !u.paid);
  const totalRevenue = paidUsers.length * ticketPrice;
  const potentialRevenue = activeUsers.length * ticketPrice;
  const pendingRevenue = pendingUsers.length * ticketPrice;

  // Filtered Users for List
  const filteredUsers = activeUsers.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userFilter.toLowerCase()) || u.username.toLowerCase().includes(userFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
          ? true 
          : statusFilter === 'paid' ? u.paid 
          : !u.paid;
      return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Settings size={120} className="text-white" />
            </div>
            <h2 className="text-2xl font-black flex items-center gap-2 relative z-10">
                <Settings className="text-slate-300" /> Painel Admin
            </h2>
            <p className="text-slate-300 text-sm mt-1 opacity-90 relative z-10">
                Controle total sobre pagamentos, regras, notificações e resultados.
            </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-md transition-colors">
        
        {/* Section: Official Data Sync */}
        <div className="mb-8">
             <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Download size={16} />
                Dados Oficiais (FIFA)
            </h3>
            
            {syncError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mb-4 text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <span><strong>Erro na sincronização:</strong> {syncError}</span>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-3">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full h-fit text-blue-600 dark:text-blue-300">
                        <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-200">Criar/Sincronizar Tabela de Jogos</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Se os jogos não aparecerem para os usuários ou as apostas falharem, clique aqui para popular o banco de dados.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleManualSync}
                    disabled={isSyncing || syncSuccess}
                    className={`whitespace-nowrap font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm shadow-sm transition-all ${
                        syncSuccess 
                        ? 'bg-green-500 text-white cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white'
                    }`}
                >
                    {isSyncing ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Sincronizando...
                        </>
                    ) : syncSuccess ? (
                        <>
                            <CheckCircle size={16} />
                            Sucesso! Recarregando...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            Sincronizar Jogos
                        </>
                    )}
                </button>
            </div>
        </div>
        
        {/* New Section: Financial Management */}
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Wallet size={16} />
                Gestão Financeira e Usuários
            </h3>

            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Arrecadação Total</span>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <Users size={12}/> {paidUsers.length} pagantes
                    </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Pendente</span>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingRevenue)}
                    </div>
                     <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                        <Users size={12}/> {pendingUsers.length} pendentes
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Potencial Total</span>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mt-1 opacity-60">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(potentialRevenue)}
                    </div>
                </div>
            </div>

            {/* Users List with Actions */}
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                     <div className="relative w-full sm:w-64">
                         <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Buscar usuário..." 
                            className="w-full pl-9 p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                         />
                     </div>
                     <div className="flex gap-2 w-full sm:w-auto">
                         <button onClick={() => setStatusFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold border transition-colors ${statusFilter === 'all' ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Todos</button>
                         <button onClick={() => setStatusFilter('pending')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold border transition-colors ${statusFilter === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-transparent border-transparent hover:bg-orange-50 text-orange-600'}`}>Pendentes</button>
                         <button onClick={() => setStatusFilter('paid')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold border transition-colors ${statusFilter === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-transparent border-transparent hover:bg-green-50 text-green-600'}`}>Pagos</button>
                     </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Usuário</th>
                                    <th className="px-4 py-2 text-center">Contato</th>
                                    <th className="px-4 py-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredUsers.map(u => (
                                    <tr key={u.username} className="hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-800 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-slate-500">@{u.username}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="text-xs text-slate-500 flex flex-col items-center gap-0.5">
                                                {u.phone && <span>{u.phone}</span>}
                                                {u.email && <span className="opacity-70">{u.email}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => togglePayment(u.username, u.paid)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition-all ${u.paid ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-orange-100 text-orange-700 hover:bg-green-100 hover:text-green-700'}`}
                                            >
                                                {u.paid ? <><CheckCircle size={14}/> Pago</> : <><DollarSign size={14}/> Pendente</>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500 italic">Nenhum usuário encontrado.</div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Section: Send Notification */}
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Bell size={16} />
                Enviar Notificação
            </h3>
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                            <input 
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
                                value={notifTitle}
                                onChange={(e) => setNotifTitle(e.target.value)}
                                placeholder="Título da notificação"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                            <select 
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
                                value={notifType}
                                onChange={(e) => setNotifType(e.target.value as any)}
                            >
                                <option value="info">Informação</option>
                                <option value="alert">Alerta</option>
                                <option value="success">Sucesso</option>
                            </select>
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                        <textarea 
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
                            rows={3}
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            placeholder="Digite a mensagem para os usuários..."
                        />
                    </div>
                    <button 
                        onClick={handleSendNotif}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto flex items-center justify-center gap-2"
                        disabled={!notifTitle || !notifMessage}
                    >
                        <Send size={18} />
                        {isNotifSent ? 'Enviada!' : 'Disparar Notificação'}
                    </button>
                </div>
            </div>
        </div>

        {/* Section 1: Financial Settings (Price) */}
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <DollarSign size={16} />
                Configurações de Preço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Valor da Participação (R$):
                    </label>
                    <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                        value={ticketPrice}
                        onChange={(e) => { setTicketPrice(parseFloat(e.target.value)); setIsSaved(false); }}
                    />
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                        Distribuição de Prêmios (%): <Percent size={12}/>
                    </label>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1">
                            <span className="text-xs text-slate-500 block mb-1">1º Lugar</span>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={prizeDist.first}
                                onChange={(e) => handlePrizeChange('first', e.target.value)}
                            />
                        </div>
                         <div className="flex-1">
                            <span className="text-xs text-slate-500 block mb-1">2º Lugar</span>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={prizeDist.second}
                                onChange={(e) => handlePrizeChange('second', e.target.value)}
                            />
                        </div>
                         <div className="flex-1">
                            <span className="text-xs text-slate-500 block mb-1">3º Lugar</span>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={prizeDist.third}
                                onChange={(e) => handlePrizeChange('third', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 2: Scoring Rules */}
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Target size={16} />
                Regras de Pontuação
            </h3>
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
               {rules.map((rule) => (
                   <div key={rule.id} className="flex items-center justify-between gap-4">
                       <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{rule.criteria}</span>
                       <div className="w-20">
                           <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={rule.points}
                                onChange={(e) => handleRuleChange(rule.id, e.target.value)}
                           />
                       </div>
                   </div>
               ))}
            </div>
        </div>

         {/* Section 3: Multipliers */}
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Zap size={16} />
                Multiplicadores (Pontuação Dobrada)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Special Teams */}
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seleções Especiais (x2)</label>
                    <div className="flex gap-2 mb-3">
                        <select 
                            className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                        >
                            <option value="">Adicionar seleção...</option>
                            {TEAMS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={addSpecialTeam} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {specialTeams.map(team => (
                            <span key={team} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-yellow-200 dark:border-yellow-700">
                                {team}
                                <button onClick={() => removeSpecialTeam(team)} className="text-yellow-600 hover:text-red-500"><X size={14}/></button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Special Phases */}
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fases Especiais (x2)</label>
                     <div className="flex gap-2 mb-3">
                        <select 
                            className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            value={selectedPhase}
                            onChange={(e) => setSelectedPhase(e.target.value)}
                        >
                            <option value="">Adicionar fase...</option>
                            {PHASES_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button onClick={addSpecialPhase} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {specialPhases.map(phase => (
                            <span key={phase} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-yellow-200 dark:border-yellow-700">
                                {phase}
                                <button onClick={() => removeSpecialPhase(phase)} className="text-yellow-600 hover:text-red-500"><X size={14}/></button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Section 5: Danger Zone */}
         <div className="mb-8">
            <h3 className="text-sm font-bold uppercase text-red-400 mb-4 flex items-center gap-2">
                <RotateCcw size={16} />
                Ações de Perigo
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-200">Restaurar Padrões</h4>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">Isso irá reverter todas as regras e preços para a configuração original.</p>
                    </div>
                    <button 
                        onClick={handleReset}
                        className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                        Resetar Tudo
                    </button>
                </div>
            </div>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
            <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${isSaved ? 'bg-green-500' : 'bg-slate-900 dark:bg-green-600'}`}
            >
                {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                {isSaved ? 'Configurações Salvas!' : 'Salvar Alterações'}
            </button>
        </div>

      </div>
    </div>
  );
};