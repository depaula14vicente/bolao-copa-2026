import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match, ExtraBet, ScoringRule, User } from '../types';
import { MatchCard } from './MatchCard';
import { MatchDetailsModal } from './MatchDetailsModal';
import { TEAMS_LIST, TEAM_FLAGS, MOCK_SQUADS } from '../constants';
import { Trophy, Target, Award, ChevronDown, Filter, Check, Swords, AlertTriangle, Maximize2, Minimize2, Star, ListTodo, ChevronUp, ChevronsDown, ChevronsUp, Info, Flame, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BettingSheetProps {
  matches: Match[];
  extraBets: ExtraBet;
  onMatchesChange: (matches: Match[]) => void;
  onExtraBetsChange: (bets: ExtraBet) => void;
  specialTeams: string[];
  specialPhases: string[];
  scoringRules: ScoringRule[];
  currentUser: User;
  allUsers: User[];
}

type MatchPhase = 'GROUPS' | 'KNOCKOUT';
type BettingTab = 'MATCHES' | 'EXTRAS';

const TeamSelector = ({ 
  value, 
  onChange, 
  options,
  placeholder = "Selecione..." 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: string[];
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFlagUrl = (teamName: string) => {
    const code = TEAM_FLAGS[teamName];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-left flex items-center justify-between focus:ring-2 focus:ring-green-500 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {value ? (
             <>
               {getFlagUrl(value) ? (
                 <img src={getFlagUrl(value)!} alt={value} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
               ) : (
                 <div className="w-6 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm" />
               )}
               <span className="font-bold text-slate-800 dark:text-white truncate">{value}</span>
             </>
          ) : (
             <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-2xl animate-fade-in-down">
          {options.map(t => (
            <div 
              key={t}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 text-sm text-slate-900 dark:text-slate-200"
              onClick={() => { onChange(t); setIsOpen(false); }}
            >
              {getFlagUrl(t) ? (
                <img src={getFlagUrl(t)!} alt={t} className="w-6 h-4 object-cover shadow-sm rounded-sm" />
              ) : (
                <span className="w-6 h-4 bg-gray-200 dark:bg-slate-600 rounded-sm"></span>
              )}
              <span className="truncate">{t}</span>
              {value === t && <Check size={14} className="ml-auto text-green-500" />}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500">Nenhuma seleção disponível.</div>
          )}
        </div>
      )}
    </div>
  );
};

const PlayerSelector = ({ 
  value, 
  onChange, 
  players,
  teamName,
  placeholder = "Selecione..." 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  players: string[];
  teamName: string;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFlagUrl = (t: string) => {
    const code = TEAM_FLAGS[t];
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  };

  const flagUrl = getFlagUrl(teamName);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-3 text-left flex items-center justify-between focus:ring-2 focus:ring-green-500 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {value ? (
             <>
               {flagUrl ? (
                 <img src={flagUrl} alt={teamName} className="w-6 h-4 object-cover rounded-sm shadow-sm flex-shrink-0" />
               ) : (
                 <div className="w-6 h-4 bg-gray-200 dark:bg-slate-700 rounded-sm flex-shrink-0" />
               )}
               <span className="font-medium text-slate-800 dark:text-white truncate">{value}</span>
             </>
          ) : (
             <span className="text-slate-500 dark:text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-2xl animate-fade-in-down z-[60]">
          {players.map(p => (
            <div 
              key={p}
              className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 text-sm text-slate-900 dark:text-slate-200 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
              onClick={() => { onChange(p); setIsOpen(false); }}
            >
              {flagUrl && (
                <img src={flagUrl} alt={teamName} className="w-6 h-4 object-cover shadow-sm rounded-sm flex-shrink-0 opacity-80" />
              )}
              <span className="truncate">{p}</span>
              {value === p && <Check size={14} className="ml-auto text-green-500" />}
            </div>
          ))}
          {players.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500">Nenhum jogador disponível.</div>
          )}
        </div>
      )}
    </div>
  );
};


export const BettingSheet: React.FC<BettingSheetProps> = ({ matches, extraBets, onMatchesChange, onExtraBetsChange, specialTeams, specialPhases, scoringRules, currentUser, allUsers }) => {
  
  const [activeTab, setActiveTab] = useState<BettingTab>('MATCHES');
  const [activePhase, setActivePhase] = useState<MatchPhase>('GROUPS');
  
  // Filters State
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  
  // Group Collapsing State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [scorerTeam, setScorerTeam] = useState<string>('Brasil');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Saving State
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats
  const filledBetsCount = matches.filter(m => {
      const bet = m.bets?.[currentUser.username];
      return bet && bet.scoreA !== undefined && bet.scoreB !== undefined;
  }).length;
  const totalMatches = matches.length;
  
  const progressPercent = totalMatches > 0 ? Math.round((filledBetsCount / totalMatches) * 100) : 0;

  const brazilMatches = useMemo(() => {
    return matches
      .filter(m => (m.teamA === 'Brasil' || m.teamB === 'Brasil') && m.group.startsWith('Grupo'))
      .sort((a, b) => {
        return a.date.localeCompare(b.date);
      });
  }, [matches]);

  const podiumDuplicates = useMemo(() => {
    const { champion, viceChampion, thirdPlace } = extraBets;
    const selections = [champion, viceChampion, thirdPlace].filter(Boolean);
    const unique = new Set(selections);
    return selections.length !== unique.size;
  }, [extraBets]);

  // Handlers
  const handleScoreChange = (matchId: string, team: 'A' | 'B', value: string) => {
    const intVal = value === '' ? undefined : parseInt(value);
    if (intVal !== undefined && (isNaN(intVal) || intVal < 0)) return;

    // 1. Optimistic UI Update (Update Local State)
    const newMatches = matches.map(m => {
      if (m.id === matchId) {
        const currentBets = m.bets || {};
        const userBet = currentBets[currentUser.username] || { scoreA: undefined, scoreB: undefined };
        
        const updatedUserBet = {
             ...userBet,
             [team === 'A' ? 'scoreA' : 'scoreB']: intVal
        };

        return {
           ...m,
           bets: {
               ...currentBets,
               [currentUser.username]: updatedUserBet
           }
        };
      }
      return m;
    });
    
    // Update the App state (optimistic)
    onMatchesChange(newMatches);

    // 2. Mark as Pending (DO NOT SAVE TO DB YET)
    setPendingChanges(prev => new Set(prev).add(matchId));
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
      if (pendingChanges.size === 0) return;
      
      setIsSaving(true);
      
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) throw new Error("Usuário não autenticado");

          // Collect all pending bets from the current matches state
          const betsToSave = Array.from(pendingChanges).map(matchId => {
              const match = matches.find(m => m.id === matchId);
              const bet = match?.bets?.[currentUser.username];
              
              if (match && bet) {
                  return {
                      user_id: user.id,
                      match_id: matchId,
                      score_a: bet.scoreA ?? 0, 
                      score_b: bet.scoreB ?? 0
                  };
              }
              return null;
          }).filter(b => b !== null);

          if (betsToSave.length > 0) {
              const { error } = await supabase.from('bets').upsert(betsToSave, { onConflict: 'user_id, match_id' });
              if (error) throw error;
          }

          // Success
          setPendingChanges(new Set());
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);

      } catch (error) {
          console.error("Erro ao salvar palpites:", error);
          alert("Erro ao salvar. Verifique sua conexão e tente novamente.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleExtraBetChange = (key: keyof ExtraBet, value: string) => {
    onExtraBetsChange({ ...extraBets, [key]: value });
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
        ...prev,
        [groupName]: !prev[groupName]
    }));
  };

  // Filter Logic
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const isGroupStage = match.group.startsWith('Grupo');
      if (activePhase === 'GROUPS' && !isGroupStage) return false;
      if (activePhase === 'KNOCKOUT' && isGroupStage) return false;

      if (selectedGroup && match.group !== selectedGroup) return false;
      if (selectedTeam && match.teamA !== selectedTeam && match.teamB !== selectedTeam) return false;
      if (selectedDate && !match.date.includes(selectedDate)) return false;
      
      if (showOnlyMissing) {
        const bet = match.bets?.[currentUser.username];
        if (bet && bet.scoreA !== undefined && bet.scoreB !== undefined) return false;
      }

      return true;
    });
  }, [matches, activePhase, selectedGroup, selectedTeam, selectedDate, showOnlyMissing, currentUser.username]);

  const groupedMatches = useMemo((): Record<string, Match[]> => {
      const groups: Record<string, Match[]> = {};
      filteredMatches.forEach(match => {
          if (!groups[match.group]) {
              groups[match.group] = [];
          }
          groups[match.group].push(match);
      });
      return groups;
  }, [filteredMatches]);

  const areAllExpanded = useMemo(() => {
      const groups = Object.keys(groupedMatches);
      if (groups.length === 0) return false;
      return groups.every(g => expandedGroups[g]);
  }, [groupedMatches, expandedGroups]);

  const toggleAllGroups = () => {
      const newState: Record<string, boolean> = {};
      const targetState = !areAllExpanded;
      Object.keys(groupedMatches).forEach(g => {
          newState[g] = targetState;
      });
      setExpandedGroups(prev => ({...prev, ...newState}));
  };

  useEffect(() => {
     setExpandedGroups(prev => {
         const next = { ...prev };
         Object.keys(groupedMatches).forEach(g => {
             if (next[g] === undefined) next[g] = false; 
         });
         return next;
     });
  }, [groupedMatches]);

  const availableGroups = useMemo(() => Array.from(new Set(matches.filter(m => m.group.startsWith('Grupo')).map(m => m.group))).sort(), [matches]);
  const availableDates = useMemo(() => Array.from(new Set(matches.map(m => m.date.split(' - ')[0]))).sort(), [matches]);

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* Progress & Tabs Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6 sticky top-[72px] z-30 transition-colors">
         <div className="flex flex-col gap-4">
             {/* Stats */}
             <div className="flex items-center justify-between text-xs sm:text-sm">
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Seu Progresso:</span>
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-md font-bold">{filledBetsCount}/{totalMatches}</span>
                 </div>
                 <span className="text-slate-500 font-mono">{progressPercent}%</span>
             </div>
             <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
             </div>

             {/* Tab Switcher */}
             <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-lg">
                 <button 
                   onClick={() => setActiveTab('MATCHES')}
                   className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'MATCHES' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                 >
                   <ListTodo size={16} /> Jogos
                 </button>
                 <button 
                   onClick={() => setActiveTab('EXTRAS')}
                   className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'EXTRAS' ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                 >
                   <Star size={16} /> Palpites Extras
                 </button>
             </div>
         </div>
      </div>

      {activeTab === 'MATCHES' && (
        <div className="space-y-6">
            
            {/* Phase Tabs */}
            <div className="flex justify-center mb-2">
                 <div className="inline-flex bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-200 dark:border-slate-700 p-1">
                     <button
                        onClick={() => setActivePhase('GROUPS')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activePhase === 'GROUPS' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                     >
                        Fase de Grupos
                     </button>
                     <button
                        onClick={() => setActivePhase('KNOCKOUT')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activePhase === 'KNOCKOUT' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                     >
                        Mata-Mata
                     </button>
                 </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-800 border-y sm:border sm:rounded-xl border-gray-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    {/* Filter Toggle */}
                    <div className="w-full sm:w-auto flex justify-between items-center cursor-pointer sm:cursor-default" onClick={() => setShowFilters(!showFilters)}>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                            <Filter size={16} /> Filtros
                            {(selectedGroup || selectedTeam || selectedDate || showOnlyMissing) && (
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] uppercase">Ativos</span>
                            )}
                        </div>
                        <div className="sm:hidden text-slate-400">
                            {showFilters ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </div>
                    </div>

                    {/* Expand/Collapse All Button */}
                    {Object.keys(groupedMatches).length > 0 && (
                        <button 
                            onClick={toggleAllGroups}
                            className="w-full sm:w-auto py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {areAllExpanded ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
                            {areAllExpanded ? 'Recolher Todos' : 'Expandir Todos'}
                        </button>
                    )}
                </div>

                <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 ${showFilters ? 'block' : 'hidden sm:grid'} animate-fade-in`}>
                     {activePhase === 'GROUPS' && (
                       <select 
                          className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-green-500"
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                       >
                           <option value="">Todos os Grupos</option>
                           {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                     )}

                     <select 
                        className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-green-500"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                     >
                         <option value="">Todas as Seleções</option>
                         {TEAMS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>

                     <select 
                        className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-green-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                     >
                         <option value="">Todas as Datas</option>
                         {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>

                     <button 
                        onClick={() => setShowOnlyMissing(!showOnlyMissing)}
                        className={`w-full p-2 rounded text-sm font-bold border transition-colors flex items-center justify-center gap-2 shadow-sm ${showOnlyMissing ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 ring-2 ring-red-400/50' : 'bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                     >
                        {showOnlyMissing ? <Check size={16} strokeWidth={3} /> : <AlertTriangle size={16} />}
                        {showOnlyMissing ? 'Mostrando Pendentes' : 'Ocultar Preenchidos'}
                     </button>
                </div>
            </div>

            {/* Grouped Matches List */}
            {Object.keys(groupedMatches).length > 0 ? (
                Object.entries(groupedMatches).map(([groupName, groupMatchesRaw]) => {
                    const groupMatches = groupMatchesRaw as Match[];
                    const isExpanded = expandedGroups[groupName];
                    const pendingInGroup = groupMatches.filter(m => {
                        const bet = m.bets?.[currentUser.username];
                        return !bet || bet.scoreA === undefined || bet.scoreB === undefined;
                    }).length;

                    return (
                        <div key={groupName} className="space-y-3">
                            <button 
                                onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'} text-slate-500 dark:text-slate-400 transition-colors`}>
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base uppercase tracking-wider">
                                        {groupName}
                                    </h3>
                                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {groupMatches.length} Jogos
                                    </span>
                                </div>
                                
                                {pendingInGroup > 0 ? (
                                     <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-800/50">
                                        <AlertTriangle size={12} /> {pendingInGroup} pendentes
                                     </span>
                                ) : (
                                     <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-800/50 opacity-80">
                                        <Check size={12} strokeWidth={3} /> Completo
                                     </span>
                                )}
                            </button>

                            {isExpanded && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-down">
                                    {groupMatches.map(match => (
                                        <div key={match.id} className={`rounded-xl transition-all ${pendingChanges.has(match.id) ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                                            <MatchCard 
                                                match={match}
                                                userId={currentUser.username}
                                                onScoreChange={handleScoreChange}
                                                onViewDetails={(m) => setSelectedMatch(m)}
                                                specialTeams={specialTeams}
                                                specialPhases={specialPhases}
                                                scoringRules={scoringRules}
                                                isAdmin={currentUser.role === 'admin'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                    <Swords size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum jogo encontrado com os filtros atuais.</p>
                    <button 
                      onClick={() => { setSelectedGroup(''); setSelectedTeam(''); setSelectedDate(''); setShowOnlyMissing(false); }}
                      className="mt-2 text-sm text-green-600 font-bold hover:underline"
                    >
                        Limpar Filtros
                    </button>
                </div>
            )}
        </div>
      )}

      {/* Extras Tab */}
      {activeTab === 'EXTRAS' && (
        <div className="animate-fade-in space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 flex gap-3 text-yellow-800 dark:text-yellow-100/90 text-sm">
                <Info size={20} className="flex-shrink-0 mt-0.5" />
                <p>Estes palpites valem muitos pontos! Capriche nas escolhas. Eles são válidos até o início da Copa e serão bloqueados automaticamente.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-700 dark:to-green-600 p-4 flex items-center gap-2 rounded-t-xl">
                    <Flame className="text-yellow-400 fill-yellow-400" />
                    <h3 className="text-white font-bold uppercase tracking-wider">Artilheiros do Brasil</h3>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Quem marcará o <strong>primeiro gol</strong> do Brasil em cada jogo da fase de grupos?</p>
                    
                    {/* If we have matches loaded, use them. If not, fallback to fixed list */}
                    {[1, 2, 3].map((num, index) => {
                         const key = `brazilFirstScorer${num}` as keyof ExtraBet;
                         let opponent = '';
                         let label = `${num}º Jogo`;
                         
                         // Try to get dynamic match data
                         if (brazilMatches.length > index) {
                             const match = brazilMatches[index];
                             opponent = match.teamA === 'Brasil' ? match.teamB : match.teamA;
                         } else {
                             // Fallback static data for Group C (Brasil)
                             const staticOpponents = ['Marrocos', 'Haiti', 'Escócia'];
                             opponent = staticOpponents[index];
                         }

                         return (
                            <div key={key} className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2 mb-1">
                                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{label}</span>
                                    <span className="flex items-center gap-1.5">
                                        vs {opponent} 
                                        {TEAM_FLAGS[opponent] && (
                                            <img src={`https://flagcdn.com/w20/${TEAM_FLAGS[opponent]}.png`} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" alt={opponent}/>
                                        )}
                                    </span>
                                </label>
                                <PlayerSelector 
                                    value={extraBets[key] || ''}
                                    onChange={(val) => handleExtraBetChange(key, val)}
                                    players={MOCK_SQUADS['Brasil']}
                                    teamName="Brasil"
                                    placeholder={`Quem marca o 1º gol contra ${opponent}?`}
                                />
                            </div>
                         )
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 p-4 flex items-center gap-2 rounded-t-xl">
                    <Trophy className="text-yellow-400 fill-yellow-400" />
                    <h3 className="text-white font-bold uppercase tracking-wider">Pódio da Copa</h3>
                </div>
                <div className="p-6 space-y-6">
                    
                    {podiumDuplicates && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2 mb-4 animate-shake">
                            <AlertTriangle size={18} />
                            <span><strong>Atenção:</strong> Você selecionou a mesma seleção para posições diferentes no pódio!</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-yellow-600 uppercase flex items-center gap-1"><Trophy size={12}/> Campeão (15 pts)</label>
                        <TeamSelector 
                            value={extraBets.champion}
                            onChange={(val) => handleExtraBetChange('champion', val)}
                            options={TEAMS_LIST}
                            placeholder="Quem leva a taça?"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Award size={12}/> Vice-Campeão (10 pts)</label>
                        <TeamSelector 
                            value={extraBets.viceChampion}
                            onChange={(val) => handleExtraBetChange('viceChampion', val)}
                            options={TEAMS_LIST}
                            placeholder="Quem fica em segundo?"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1"><Award size={12}/> 3º Lugar (8 pts)</label>
                        <TeamSelector 
                            value={extraBets.thirdPlace}
                            onChange={(val) => handleExtraBetChange('thirdPlace', val)}
                            options={TEAMS_LIST}
                            placeholder="Quem fica em terceiro?"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-600 p-4 flex items-center gap-2 rounded-t-xl">
                    <Target className="text-white" />
                    <h3 className="text-white font-bold uppercase tracking-wider">Artilheiro da Copa</h3>
                </div>
                <div className="p-6 space-y-4">
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm mb-2">
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Filtrar jogadores por seleção:</label>
                         <TeamSelector 
                            value={scorerTeam}
                            onChange={(val) => { setScorerTeam(val); handleExtraBetChange('topScorer', ''); }}
                            options={TEAMS_LIST}
                            placeholder="Selecione a seleção do artilheiro..."
                         />
                     </div>

                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Jogador (15 pts)</label>
                         <PlayerSelector 
                            value={extraBets.topScorer}
                            onChange={(val) => handleExtraBetChange('topScorer', val)}
                            players={MOCK_SQUADS[scorerTeam] || MOCK_SQUADS['default']}
                            teamName={scorerTeam}
                            placeholder={scorerTeam ? "Escolha o craque..." : "Selecione uma seleção acima primeiro"}
                         />
                     </div>
                </div>
            </div>

        </div>
      )}

      {selectedMatch && (
         <MatchDetailsModal 
            match={selectedMatch}
            users={allUsers}
            scoringRules={scoringRules}
            onClose={() => setSelectedMatch(null)}
            specialTeams={specialTeams}
            specialPhases={specialPhases}
            currentUser={currentUser}
         />
      )}

      {/* Floating Save Button */}
      {pendingChanges.size > 0 && (
          <div className="fixed bottom-20 md:bottom-6 right-6 md:right-1/2 md:transform md:translate-x-1/2 z-[100] animate-bounce-in">
              <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${saveSuccess ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'}`}
              >
                  {isSaving ? (
                      <Loader2 size={20} className="animate-spin" />
                  ) : saveSuccess ? (
                      <CheckCircle2 size={20} />
                  ) : (
                      <Save size={20} />
                  )}
                  {isSaving ? 'Salvando...' : saveSuccess ? 'Palpites Salvos!' : `Salvar (${pendingChanges.size}) Alterações`}
              </button>
          </div>
      )}

    </div>
  );
};