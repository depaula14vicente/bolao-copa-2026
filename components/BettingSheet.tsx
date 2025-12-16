import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match, ExtraBet, User, ScoringRule } from '../types';
import { MatchCard } from './MatchCard';
import { MatchDetailsModal } from './MatchDetailsModal';
import { TEAMS_LIST, TEAM_FLAGS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Save, Trophy, ChevronDown, ChevronUp, LayoutGrid, Sword, Filter, ListCollapse, AlertTriangle, Loader2, Target, Crown, ShieldQuestion, Shirt, CheckCircle2 } from 'lucide-react';

interface BettingSheetProps {
  matches: Match[];
  extraBets: ExtraBet;
  onMatchesChange: (matches: Match[]) => void;
  onExtraBetsChange: (bets: ExtraBet) => Promise<void> | void;
  specialTeams: string[];
  specialPhases: string[];
  scoringRules: ScoringRule[];
  currentUser: User;
  allUsers: User[];
}

export const BettingSheet: React.FC<BettingSheetProps> = ({
  matches,
  extraBets,
  onMatchesChange,
  onExtraBetsChange,
  specialTeams,
  specialPhases,
  scoringRules,
  currentUser,
  allUsers
}) => {
  const [viewMode, setViewMode] = useState<'MATCHES' | 'EXTRAS'>('MATCHES');
  const [filterMode, setFilterMode] = useState<'GROUPS' | 'KNOCKOUT'>('GROUPS');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Grupo A']));
  const [savingMatches, setSavingMatches] = useState<Set<string>>(new Set());
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Extra Bets State
  const [isSavingExtras, setIsSavingExtras] = useState(false);
  
  // State for Top Scorer Complex Input (Team + Number)
  const [tsTeam, setTsTeam] = useState('');
  const [tsNumber, setTsNumber] = useState('');

  // Generate Roster Numbers 1-26
  const ROSTER_NUMBERS = Array.from({length: 26}, (_, i) => i + 1);

  // Sync local TopScorer inputs when props change (initial load)
  useEffect(() => {
      if (extraBets.topScorer) {
          // Expected format: "Team - Camisa X"
          const parts = extraBets.topScorer.split(' - Camisa ');
          if (parts.length === 2) {
              setTsTeam(parts[0]);
              setTsNumber(parts[1]);
          } else {
              // Handle legacy or manual text if exists
              setTsTeam('');
              setTsNumber('');
          }
      }
  }, [extraBets.topScorer]);

  // Helper para bandeiras
  const getFlagUrl = (teamName: string) => {
    const code = TEAM_FLAGS[teamName];
    return code ? `https://flagcdn.com/w160/${code}.png` : null;
  };

  // Toggle Accordion
  const toggleGroup = (group: string) => {
      const newSet = new Set(expandedGroups);
      if (newSet.has(group)) {
          newSet.delete(group);
      } else {
          newSet.add(group);
      }
      setExpandedGroups(newSet);
  };

  const collapseAll = () => setExpandedGroups(new Set());

  // Handlers
  const handleScoreChange = async (matchId: string, team: 'A' | 'B', value: string) => {
    // Treat empty string as undefined (deletion trigger)
    const intVal = value === '' ? undefined : parseInt(value);
    
    // Prevent invalid numbers (NaN) unless it's undefined (cleared)
    if (intVal !== undefined && (isNaN(intVal) || intVal < 0)) return;

    // Snapshot for optimistic rollback
    const previousMatches = [...matches];

    // 1. Optimistic UI Update (Update Local State)
    const match = matches.find(m => m.id === matchId);
    
    // Determine existing scores from local state
    const currentBets = match?.bets?.[currentUser.username];
    const existingScoreA = match?.userScoreA ?? currentBets?.scoreA;
    const existingScoreB = match?.userScoreB ?? currentBets?.scoreB;

    const newScoreA = team === 'A' ? intVal : existingScoreA;
    const newScoreB = team === 'B' ? intVal : existingScoreB;

    // Update the full matches array with new values
    const newMatches = matches.map(m => {
      if (m.id === matchId) {
        const userBet = m.bets?.[currentUser.username] || { scoreA: undefined, scoreB: undefined };
        const updatedUserBet = {
             ...userBet,
             [team === 'A' ? 'scoreA' : 'scoreB']: intVal
        };

        return {
           ...m,
           userScoreA: newScoreA,
           userScoreB: newScoreB,
           bets: {
               ...m.bets,
               [currentUser.username]: updatedUserBet
           }
        };
      }
      return m;
    });
    
    onMatchesChange(newMatches);

    // 2. AUTO-SAVE LOGIC
    setSavingMatches(prev => new Set(prev).add(matchId));
    setErrorMsg(null);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // CASE A: Both scores are valid numbers -> SAVE/UPDATE
            if (newScoreA !== undefined && newScoreB !== undefined && !isNaN(newScoreA) && !isNaN(newScoreB)) {
                
                const payload = {
                    user_id: user.id,
                    match_id: matchId,
                    score_a: newScoreA, 
                    score_b: newScoreB
                };

                // Try to save bet
                let { error } = await supabase
                    .from('bets')
                    .upsert(payload, { onConflict: 'user_id, match_id' });

                // ERROR 23503: Foreign Key Violation (Match doesn't exist in DB yet)
                if (error && error.code === '23503') {
                    console.warn(`Match ${matchId} missing in DB. Attempting lazy creation...`);
                    
                    if (match) {
                        const matchPayload = {
                            id: match.id,
                            team_a: match.teamA,
                            team_b: match.teamB,
                            date_time: match.date,
                            group_name: match.group,
                            location: match.location,
                            is_brazil: match.isBrazil
                        };

                        const { error: creationError } = await supabase.from('matches').insert(matchPayload);
                        
                        if (!creationError) {
                            const { error: retryError } = await supabase
                                .from('bets')
                                .upsert(payload, { onConflict: 'user_id, match_id' });
                            
                            if (retryError) throw retryError;
                        } else {
                            throw creationError;
                        }
                    }
                } else if (error) {
                    throw error;
                }
            } 
            // CASE B: One or both scores cleared -> DELETE BET
            else {
                const { error } = await supabase
                    .from('bets')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('match_id', matchId);
                
                if (error) throw error;
            }
        }
    } catch (error: any) {
        console.error("Auto-save failed:", error);
        // Rollback state if save failed
        onMatchesChange(previousMatches);
        
        let friendlyMsg = "Erro ao salvar palpite.";
        if (error.message?.includes('policy')) friendlyMsg = "Erro de Permissão: O administrador precisa atualizar as regras do banco (RLS DELETE).";
        setErrorMsg(friendlyMsg);
        
        // Auto-hide error after 5s
        setTimeout(() => setErrorMsg(null), 5000);
    } finally {
        setTimeout(() => {
            setSavingMatches(prev => {
                const next = new Set(prev);
                next.delete(matchId);
                return next;
            });
        }, 500);
    }
  };

  const handleExtraBetChange = async (key: keyof ExtraBet, value: string) => {
      setIsSavingExtras(true);
      // Small delay to ensure spinner is visible and avoid flicker
      const minDelay = new Promise(resolve => setTimeout(resolve, 500));
      const savePromise = Promise.resolve(onExtraBetsChange({ ...extraBets, [key]: value }));
      await Promise.all([minDelay, savePromise]);
      setIsSavingExtras(false);
  };

  const handleTopScorerUpdate = (newTeam: string, newNumber: string) => {
      setTsTeam(newTeam);
      setTsNumber(newNumber);
      
      if (newTeam && newNumber) {
          const formattedValue = `${newTeam} - Camisa ${newNumber}`;
          handleExtraBetChange('topScorer', formattedValue);
      } else if (!newTeam && !newNumber) {
          handleExtraBetChange('topScorer', '');
      }
  };

  // Group Matches Logic
  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      matches.forEach(m => {
          // Filter based on selected mode
          const isGroupStage = m.group.startsWith('Grupo');
          if (filterMode === 'GROUPS' && !isGroupStage) return;
          if (filterMode === 'KNOCKOUT' && isGroupStage) return;

          if (!groups[m.group]) groups[m.group] = [];
          groups[m.group].push(m);
      });
      return groups;
  }, [matches, filterMode]);

  // Progress Calculation
  const totalMatches = matches.length;
  const userBetsCount = matches.filter(m => {
      const b = m.bets?.[currentUser.username];
      return b && b.scoreA !== undefined && b.scoreB !== undefined;
  }).length;
  const progressPercent = Math.round((userBetsCount / totalMatches) * 100);


  return (
    <div className="space-y-6 animate-fade-in pb-20">
       
       {errorMsg && (
           <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-bounce-in max-w-sm">
               <AlertTriangle size={20} />
               <span className="text-sm font-bold">{errorMsg}</span>
           </div>
       )}

       {/* Progress Bar Header */}
       <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Seu Progresso:</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{userBetsCount}/{totalMatches}</span>
                </div>
                <span className="text-xs font-bold text-slate-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-gradient-to-r from-green-500 to-yellow-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
       </div>

       {/* View Toggles (Tabs) */}
       <div className="flex bg-gray-200 dark:bg-slate-700 p-1 rounded-xl">
           <button 
               onClick={() => setViewMode('MATCHES')}
               className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'MATCHES' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
           >
               <LayoutGrid size={16} /> Jogos
           </button>
           <button 
               onClick={() => setViewMode('EXTRAS')}
               className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'EXTRAS' ? 'bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
           >
               <Trophy size={16} /> Palpites Extras
           </button>
       </div>

       {viewMode === 'MATCHES' && (
           <>
             {/* Sub-Filters */}
             <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                     <button
                        onClick={() => setFilterMode('GROUPS')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 ${filterMode === 'GROUPS' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                     >
                        <LayoutGrid size={14} /> GRUPOS
                     </button>
                     <button
                        onClick={() => setFilterMode('KNOCKOUT')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 ${filterMode === 'KNOCKOUT' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                     >
                        <Sword size={14} /> MATA-MATA
                     </button>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <button className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors">
                        <Filter size={14} /> Filtros
                     </button>
                 </div>
             </div>

             {/* Banner Seus Palpites */}
             <div className="bg-[#22c55e] rounded-xl p-6 text-white relative overflow-hidden shadow-md flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-black flex items-center gap-2 relative z-10">
                        <ListCollapse className="text-green-200" /> Seus Palpites
                    </h2>
                    <p className="text-green-50 text-xs mt-1 relative z-10 max-w-[80%]">
                        Preencha os placares e torça! Pontos em dobro para jogos do Brasil e Finais.
                    </p>
                 </div>
                 <LayoutGrid size={80} className="absolute -right-4 -bottom-4 text-green-700/20" />
             </div>

             {/* Collapse All Link */}
             <button onClick={collapseAll} className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 font-bold flex items-center gap-1 transition-colors">
                 <ChevronUp size={14} /> Recolher Todos
             </button>

             {/* Matches List (Accordion Style) */}
             <div className="space-y-4">
                 {Object.keys(groupedMatches).length === 0 && (
                     <div className="text-center py-10 text-slate-400 italic">
                         Nenhum jogo encontrado para este filtro.
                     </div>
                 )}

                 {Object.entries(groupedMatches).map(([groupName, groupMatches]) => {
                     const isExpanded = expandedGroups.has(groupName);
                     const filledCount = groupMatches.filter(m => {
                         const b = m.bets?.[currentUser.username];
                         return b && b.scoreA !== undefined && b.scoreB !== undefined;
                     }).length;

                     return (
                         <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm transition-all">
                             
                             {/* Accordion Header */}
                             <button 
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
                             >
                                 <div className="flex items-center gap-3">
                                     <h3 className="font-bold text-slate-800 dark:text-white uppercase">{groupName}</h3>
                                     <span className="text-xs font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                                         {filledCount}/{groupMatches.length}
                                     </span>
                                 </div>
                                 {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                             </button>

                             {/* Accordion Content */}
                             {isExpanded && (
                                 <div className="p-4 bg-white dark:bg-slate-800 animate-fade-in">
                                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                         {groupMatches.map(match => (
                                             <div key={match.id} className="relative">
                                                <MatchCard 
                                                    match={match} 
                                                    userId={currentUser.username}
                                                    onScoreChange={handleScoreChange}
                                                    onViewDetails={setSelectedMatchForDetails}
                                                    specialTeams={specialTeams}
                                                    specialPhases={specialPhases}
                                                    scoringRules={scoringRules}
                                                    isAdmin={currentUser.role === 'admin'}
                                                />
                                                {savingMatches.has(match.id) && (
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg animate-pulse z-10">
                                                        <Save size={12} />
                                                    </div>
                                                )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                     );
                 })}
             </div>
           </>
       )}

       {viewMode === 'EXTRAS' && (
           <div className="space-y-6 animate-fade-in">
               
               {/* 1. PÓDIO DA COPA */}
               <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Trophy size={100} />
                   </div>
                   
                   <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                       <Trophy size={24} className="text-yellow-500" />
                       Pódio da Copa
                       {isSavingExtras && (
                           <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                               <Loader2 size={12} className="animate-spin" /> Salvando...
                           </span>
                       )}
                   </h3>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       
                       {/* Campeão */}
                       <div className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-xl border border-yellow-200 dark:border-yellow-700/50 flex flex-col items-center text-center relative hover:shadow-md transition-shadow">
                           {/* Bandeira ou Número */}
                           {extraBets.champion && getFlagUrl(extraBets.champion) ? (
                               <div className="relative mb-3 group">
                                   <img src={getFlagUrl(extraBets.champion)!} alt={extraBets.champion} className="w-20 h-14 object-cover rounded-lg shadow-md ring-2 ring-yellow-400 group-hover:scale-105 transition-transform" />
                                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-black text-yellow-900 shadow-sm border-2 border-white dark:border-slate-800 text-sm">1</div>
                               </div>
                           ) : (
                               <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-black text-yellow-900 shadow-sm mb-3 text-xl ring-4 ring-yellow-400/20">1</div>
                           )}
                           
                           <h4 className="font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide text-sm mb-2">Campeão</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Quem levanta a taça?</p>
                           <select 
                               value={extraBets.champion || ''} 
                               onChange={(e) => handleExtraBetChange('champion', e.target.value)}
                               className="w-full p-3 bg-white dark:bg-slate-900 border border-yellow-300 dark:border-yellow-600 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
                           >
                               <option value="">Selecione...</option>
                               {TEAMS_LIST.map(t => {
                                   const disabled = t === extraBets.viceChampion || t === extraBets.thirdPlace;
                                   return (
                                       <option key={t} value={t} disabled={disabled}>
                                           {t}{disabled ? ' (Já escolhido)' : ''}
                                       </option>
                                   )
                               })}
                           </select>
                       </div>

                       {/* Vice */}
                       <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center relative hover:shadow-md transition-shadow">
                           {/* Bandeira ou Número */}
                           {extraBets.viceChampion && getFlagUrl(extraBets.viceChampion) ? (
                               <div className="relative mb-3 group">
                                   <img src={getFlagUrl(extraBets.viceChampion)!} alt={extraBets.viceChampion} className="w-20 h-14 object-cover rounded-lg shadow-md ring-2 ring-slate-300 group-hover:scale-105 transition-transform" />
                                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center font-black text-slate-800 shadow-sm border-2 border-white dark:border-slate-800 text-sm">2</div>
                               </div>
                           ) : (
                               <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center font-black text-slate-700 shadow-sm mb-3 text-xl ring-4 ring-slate-300/20">2</div>
                           )}

                           <h4 className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-sm mb-2">Vice-Campeão</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Quem perde a final?</p>
                           <select 
                               value={extraBets.viceChampion || ''} 
                               onChange={(e) => handleExtraBetChange('viceChampion', e.target.value)}
                               className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
                           >
                               <option value="">Selecione...</option>
                               {TEAMS_LIST.map(t => {
                                   const disabled = t === extraBets.champion || t === extraBets.thirdPlace;
                                   return (
                                       <option key={t} value={t} disabled={disabled}>
                                           {t}{disabled ? ' (Já escolhido)' : ''}
                                       </option>
                                   )
                               })}
                           </select>
                       </div>

                       {/* 3º Lugar */}
                       <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-xl border border-orange-200 dark:border-orange-800/50 flex flex-col items-center text-center relative hover:shadow-md transition-shadow">
                           {/* Bandeira ou Número */}
                           {extraBets.thirdPlace && getFlagUrl(extraBets.thirdPlace) ? (
                               <div className="relative mb-3 group">
                                   <img src={getFlagUrl(extraBets.thirdPlace)!} alt={extraBets.thirdPlace} className="w-20 h-14 object-cover rounded-lg shadow-md ring-2 ring-orange-300 group-hover:scale-105 transition-transform" />
                                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center font-black text-orange-900 shadow-sm border-2 border-white dark:border-slate-800 text-sm">3</div>
                               </div>
                           ) : (
                               <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center font-black text-orange-900 shadow-sm mb-3 text-xl ring-4 ring-orange-300/20">3</div>
                           )}

                           <h4 className="font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide text-sm mb-2">3º Colocado</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Vencedor da disputa de 3º</p>
                           <select 
                               value={extraBets.thirdPlace || ''} 
                               onChange={(e) => handleExtraBetChange('thirdPlace', e.target.value)}
                               className="w-full p-3 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
                           >
                               <option value="">Selecione...</option>
                               {TEAMS_LIST.map(t => {
                                   const disabled = t === extraBets.champion || t === extraBets.viceChampion;
                                   return (
                                       <option key={t} value={t} disabled={disabled}>
                                           {t}{disabled ? ' (Já escolhido)' : ''}
                                       </option>
                                   )
                               })}
                           </select>
                       </div>
                   </div>
               </div>

               {/* 2. ARTILHARIA */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                           <Target size={20} className="text-red-500" />
                           Artilheiro da Copa
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Selecione a seleção e a numeração do jogador.</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                {tsTeam && getFlagUrl(tsTeam) && (
                                    <img src={getFlagUrl(tsTeam)!} alt="" className="absolute right-8 top-3.5 w-6 h-4 object-cover rounded opacity-50 pointer-events-none" />
                                )}
                                <select 
                                    value={tsTeam} 
                                    onChange={(e) => handleTopScorerUpdate(e.target.value, tsNumber)}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                                >
                                    <option value="">Seleção...</option>
                                    {TEAMS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            
                            <div className="relative">
                                <Shirt size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                                <select 
                                    value={tsNumber} 
                                    onChange={(e) => handleTopScorerUpdate(tsTeam, e.target.value)}
                                    className="w-full p-3 pl-9 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                                >
                                    <option value="">Nº...</option>
                                    {ROSTER_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        {extraBets.topScorer && (
                            <div className="mt-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-green-500"/>
                                Escolhido: {extraBets.topScorer}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                           🇧🇷 Artilharia do Brasil
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Quais camisas marcarão os 3 primeiros gols?</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-6">1º</span>
                                <select 
                                    value={extraBets.brazilFirstScorer1 || ''} 
                                    onChange={(e) => handleExtraBetChange('brazilFirstScorer1', e.target.value)}
                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                >
                                    <option value="">Selecione a Camisa...</option>
                                    {ROSTER_NUMBERS.map(n => <option key={n} value={`Camisa ${n}`}>Camisa {n}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-6">2º</span>
                                <select 
                                    value={extraBets.brazilFirstScorer2 || ''} 
                                    onChange={(e) => handleExtraBetChange('brazilFirstScorer2', e.target.value)}
                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                >
                                    <option value="">Selecione a Camisa...</option>
                                    {ROSTER_NUMBERS.map(n => <option key={n} value={`Camisa ${n}`}>Camisa {n}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-6">3º</span>
                                <select 
                                    value={extraBets.brazilFirstScorer3 || ''} 
                                    onChange={(e) => handleExtraBetChange('brazilFirstScorer3', e.target.value)}
                                    className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                >
                                    <option value="">Selecione a Camisa...</option>
                                    {ROSTER_NUMBERS.map(n => <option key={n} value={`Camisa ${n}`}>Camisa {n}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
               </div>
           </div>
       )}

       {selectedMatchForDetails && (
           <MatchDetailsModal 
               match={selectedMatchForDetails}
               users={allUsers}
               scoringRules={scoringRules}
               onClose={() => setSelectedMatchForDetails(null)}
               specialTeams={specialTeams}
               specialPhases={specialPhases}
               currentUser={currentUser}
           />
       )}
    </div>
  );
};