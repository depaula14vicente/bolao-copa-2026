import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewState, Match, ExtraBet, User, AppConfig, Notification, Player } from './types';
import { MOCK_MATCHES, MOCK_NOTIFICATIONS, INITIAL_SCORING_RULES, INITIAL_TICKET_PRICE, INITIAL_PRIZE_DISTRIBUTION, INITIAL_SPECIAL_TEAMS, INITIAL_SPECIAL_PHASES, APP_LOGO_URL } from './constants';
import { RulesSection } from './components/RulesSection';
import { BettingSheet } from './components/BettingSheet';
import { Leaderboard } from './components/Leaderboard';
import { GroupStandings } from './components/GroupStandings';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { AdminPanel } from './components/AdminPanel';
import { SplashScreen } from './components/SplashScreen';
import { OfficialResults } from './components/OfficialResults';
import { UserProfile } from './components/UserProfile';
import { InstallPWA } from './components/InstallPWA';
import { FileText, CheckCircle2, Sun, Moon, LayoutGrid, PenLine, LogOut, Settings, Bell, X, User as UserIcon, CheckCheck, Loader2, Trophy, Clock, RefreshCw, MessageCircle, Users } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

type AuthMode = 'login' | 'register';

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EAyMKNlD3eA1dWL6FWIR2t";

export const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  
  // App Data
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Config State
  const [activeTab, setActiveTab] = useState<ViewState>(ViewState.RULES);
  const [extraBets, setExtraBets] = useState<ExtraBet>({
    brazilFirstScorer1: '', brazilFirstScorer2: '', brazilFirstScorer3: '',
    topScorer: '', champion: '', viceChampion: '', thirdPlace: ''
  });
  
  const [config, setConfig] = useState<AppConfig>({
    scoringRules: INITIAL_SCORING_RULES,
    ticketPrice: INITIAL_TICKET_PRICE,
    prizeDistribution: INITIAL_PRIZE_DISTRIBUTION,
    specialTeams: INITIAL_SPECIAL_TEAMS,
    specialPhases: INITIAL_SPECIAL_PHASES
  });

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // --- SUPABASE INTEGRATION ---

  // 1. Check Session & Load Data
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then((response: any) => {
      const session = response.data.session;
      if (session) {
        loadData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session) {
        loadData(session.user.id);
      } else {
        setUser(null);
        setMatches([]);
        setUsers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Check for First Access to show Group Modal
  useEffect(() => {
      if (user && user.role !== 'admin' && user.paid) {
          const hasSeenModal = localStorage.getItem('hasSeenGroupModal_v1');
          if (!hasSeenModal) {
              setTimeout(() => setShowGroupModal(true), 1500);
          }
      }
  }, [user]);

  // 3. AUTO-POLLING FOR APPROVAL
  // If user is logged in but NOT paid, check DB every 3 seconds
  useEffect(() => {
    let interval: any;
    
    if (user && user.role !== 'admin' && !user.paid) {
        // Initial immediate check
        checkStatus();
        
        interval = setInterval(checkStatus, 3000);
    }

    async function checkStatus() {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            // Force fetch fresh data bypassing cache if possible (though Supabase client is usually direct)
            const { data, error } = await supabase
                .from('profiles')
                .select('paid, role')
                .eq('id', authUser.id)
                .single();
            
            if (data && (data.paid === true || data.role === 'admin')) {
                console.log("Status updated! Refreshing user state...");
                // Reload full data to ensure everything is consistent
                loadData(authUser.id);
            }
        }
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [user?.paid, user?.role]); // Re-run if paid status changes

  const closeGroupModal = () => {
      localStorage.setItem('hasSeenGroupModal_v1', 'true');
      setShowGroupModal(false);
  };

  const joinGroup = () => {
      window.open(WHATSAPP_GROUP_LINK, '_blank');
      closeGroupModal();
  };

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      // A. Load Current User Profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Handle "Auth user exists but Profile missing" edge case
      if (!profile) {
          console.warn("User authenticated but profile not found. Attempting robust self-repair...");
          
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
             const newProfile = {
                 id: authUser.id,
                 email: authUser.email,
                 username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
                 name: authUser.user_metadata?.name || 'Sem Nome',
                 phone: authUser.user_metadata?.phone || '',
                 role: 'user',
                 paid: false
             };
             
             // Force insert/upsert
             const { error: repairError } = await supabase.from('profiles').upsert(newProfile);
             
             if (!repairError) {
                 profile = newProfile;
             } else {
                 console.error("Self repair failed", repairError);
                 await supabase.auth.signOut();
                 setLoading(false);
                 return;
             }
          } else {
             await supabase.auth.signOut();
             setLoading(false);
             return;
          }
      }

      if (profile) {
        // SUPER ADMIN SAFEGUARD: Force specific email to be Admin/Paid always
        if (profile.email === 'depaula14@gmail.com' && (profile.role !== 'admin' || !profile.paid)) {
            console.log("Promoting super admin...");
            // Await the update to ensure RLS policies work for subsequent admin actions
            const { error: promoError } = await supabase
                .from('profiles')
                .update({ role: 'admin', paid: true })
                .eq('id', userId);
            
            if (!promoError) {
                profile.role = 'admin';
                profile.paid = true;
            }
        }

        setUser({
          username: profile.username,
          name: profile.name,
          role: profile.role as 'admin' | 'user',
          paid: profile.paid,
          email: profile.email,
          phone: profile.phone,
          avatar: profile.avatar,
          password: '' 
        });
      }

      // B. Load All Users
      const { data: allProfiles, error: allProfilesError } = await supabase.from('profiles').select('*');
      
      if (allProfilesError) console.warn("Error loading all profiles:", allProfilesError);

      const userIdMap: Record<string, string> = {}; 

      if (allProfiles) {
        const mappedUsers: User[] = allProfiles.map((p: any) => {
            userIdMap[p.id] = p.username; 
            return {
                username: p.username,
                name: p.name,
                role: p.role,
                paid: p.paid,
                email: p.email,
                phone: p.phone,
                avatar: p.avatar
            };
        });
        setUsers(mappedUsers);
      }

      // C. Load Extra Bets
      const { data: dbExtraBets, error: extraBetsError } = await supabase
        .from('extra_bets')
        .select('*')
        .eq('user_id', userId);

      if (dbExtraBets) {
          const loadedExtras: any = { ...extraBets };
          dbExtraBets.forEach((row: any) => {
              if (Object.keys(loadedExtras).includes(row.slug)) {
                  loadedExtras[row.slug] = row.value;
              }
          });
          setExtraBets(loadedExtras);
      }

      // D. Load Matches - SMART MERGE STRATEGY
      // CRITICAL: A fonte da verdade para a LISTA de jogos é o arquivo local (MOCK_MATCHES).
      // O banco de dados (supabase) serve apenas para enriquecer com placares oficiais.
      // Isso garante que todos os jogos apareçam, mesmo que não estejam criados no banco.
      
      const { data: dbMatches } = await supabase.from('matches').select('*');
      
      // Create a map for quick lookup of DB data
      const dbMatchMap = new Map();
      if (dbMatches) {
          dbMatches.forEach((m: any) => dbMatchMap.set(String(m.id), m));
      }

      // E. Load Bets
      const { data: dbBets, error: betsError } = await supabase.from('bets').select('*');
      const validBets = dbBets || [];

      // MERGE LOGIC: Iterate over the FULL Mock Schedule
      const mergedMatches: Match[] = MOCK_MATCHES.map((mockMatch) => {
          const matchIdStr = mockMatch.id.toString();
          const dbMatch = dbMatchMap.get(matchIdStr);

          // Use DB official scores if available (and valid numbers), otherwise undefined
          const officialScoreA = (dbMatch && dbMatch.official_score_a !== null) ? dbMatch.official_score_a : undefined;
          const officialScoreB = (dbMatch && dbMatch.official_score_b !== null) ? dbMatch.official_score_b : undefined;

          // Map Bets for this match
          const matchBets: Record<string, { scoreA: number, scoreB: number }> = {};
          
          let myBetA: number | undefined = undefined;
          let myBetB: number | undefined = undefined;

          validBets.filter((b: any) => String(b.match_id) === matchIdStr).forEach((b: any) => {
              if (b.user_id === userId) {
                  myBetA = b.score_a;
                  myBetB = b.score_b;
              }
              const username = userIdMap[b.user_id];
              if (username) {
                  matchBets[username] = {
                      scoreA: b.score_a,
                      scoreB: b.score_b
                  };
              }
          });

          return {
              id: mockMatch.id,
              teamA: mockMatch.teamA,
              teamB: mockMatch.teamB,
              date: mockMatch.date,
              group: mockMatch.group,
              location: mockMatch.location,
              isBrazil: mockMatch.isBrazil,
              isFinal: false,
              officialScoreA,
              officialScoreB,
              userScoreA: myBetA, // Used by UI
              userScoreB: myBetB, // Used by UI
              bets: matchBets
          };
      });

      setMatches(mergedMatches);

    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS (PERSISTENCE) ---

  const handleAdminUpdateUsers = async (updatedUsers: User[]) => {
    // 1. Optimistic Update
    const previousUsers = [...users];
    setUsers(updatedUsers);

    // 2. Persist
    let hasError = false;
    let errorDetail = "";

    for (const updatedUser of updatedUsers) {
        const originalUser = previousUsers.find(u => u.username === updatedUser.username);
        // Only update if changed
        if (originalUser && originalUser.paid !== updatedUser.paid) {
            try {
                // Update based on username
                const { error } = await supabase
                    .from('profiles')
                    .update({ paid: updatedUser.paid })
                    .eq('username', updatedUser.username);
                
                if (error) {
                    errorDetail = error.message;
                    throw error;
                }
            } catch (err: any) {
                console.error("Failed to update user payment status", err);
                hasError = true;
            }
        }
    }

    if (hasError) {
        alert(`FALHA AO SALVAR APROVAÇÃO!\n\nDetalhe do erro: ${errorDetail || "Permissão negada (RLS Policy)."}\n\nVerifique se você rodou o código SQL no Supabase para dar permissão de UPDATE aos Admins.`);
        // Revert Optimistic Update
        setUsers(previousUsers);
    }
  };

  const handleExtraBetsChange = async (newBets: ExtraBet) => {
    setExtraBets(newBets);
    const changedKey = Object.keys(newBets).find(key => newBets[key as keyof ExtraBet] !== extraBets[key as keyof ExtraBet]);
    
    if (changedKey) {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                 const value = newBets[changedKey as keyof ExtraBet];
                 const slug = changedKey;

                 // Lógica Atualizada: Se o valor for vazio, DELETA o registro para limpar o banco.
                 // Se tiver valor, faz UPSERT.
                 
                 if (!value || value.trim() === '') {
                     // Delete
                     const { error } = await supabase
                        .from('extra_bets')
                        .delete()
                        .eq('user_id', authUser.id)
                        .eq('slug', slug);
                     
                     if (error) console.error("Erro ao limpar aposta extra:", error);

                 } else {
                     // Upsert
                     const payload = {
                         user_id: authUser.id,
                         slug: slug,
                         value: String(value)
                     };

                     const { error } = await supabase
                         .from('extra_bets')
                         .upsert(payload, { onConflict: 'user_id, slug' });
                     
                     if (error) console.error("Erro ao salvar aposta extra:", error);
                 }
            }
        } catch (error: any) {
            console.error("Exceção ao salvar:", error);
        }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab(ViewState.RULES);
    setAuthMode('login');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
             const { error: profileError } = await supabase.from('profiles').update({
                 name: updatedUser.name,
                 email: updatedUser.email,
                 phone: updatedUser.phone,
                 avatar: updatedUser.avatar,
             }).eq('id', authUser.id);
             
             if (profileError) throw profileError;
             
             if (updatedUser.password && updatedUser.password.length >= 6) {
                 const { error: pwError } = await supabase.auth.updateUser({ password: updatedUser.password });
                 if (pwError) throw pwError;
             }
             
             const newUsers = users.map(u => u.username === updatedUser.username ? updatedUser : u);
             setUsers(newUsers);
        }
    } catch (e: any) {
        console.error("Error updating profile", e);
        alert("Erro ao atualizar perfil. Tente novamente.");
    }
  };

  const calculateLeaderboard = useCallback(() => {
    const activeUsers = users.filter(u => u.paid && u.role !== 'admin');
    return activeUsers.map(u => {
        let points = 0;
        let exactScores = 0;
        let brazilPoints = 0;

        matches.forEach(match => {
            const bet = match.bets?.[u.username];
            const officialA = match.officialScoreA;
            const officialB = match.officialScoreB;
            
            if (bet && officialA !== undefined && officialB !== undefined && officialA !== null && officialB !== null) {
                let matchPoints = 0;
                let isExact = false;

                if (bet.scoreA === officialA && bet.scoreB === officialB) {
                    matchPoints = 6;
                    isExact = true;
                } else {
                     const uWinner = bet.scoreA > bet.scoreB ? 'A' : (bet.scoreB > bet.scoreA ? 'B' : 'Draw');
                     const oWinner = officialA > officialB ? 'A' : (officialB > officialA ? 'B' : 'Draw');
                     if (uWinner === oWinner) {
                         if (uWinner === 'Draw') matchPoints = 2;
                         else if (bet.scoreA === officialA || bet.scoreB === officialB) matchPoints = 3;
                         else matchPoints = 2;
                     }
                }

                const isSpecial = config.specialTeams.includes(match.teamA) || config.specialTeams.includes(match.teamB) || config.specialPhases.includes(match.group);
                if (isSpecial) matchPoints *= 2;

                points += matchPoints;
                if (isExact) exactScores++;
                if (match.isBrazil) brazilPoints += matchPoints;
            }
        });

        return {
            id: u.username,
            name: u.name,
            points,
            exactScores,
            brazilPoints,
            position: 0,
            trend: 'same' as const,
            history: [],
            avatar: u.avatar
        };
    }).sort((a, b) => b.points - a.points || b.exactScores - a.exactScores || b.brazilPoints - a.brazilPoints)
      .map((p, idx) => ({ ...p, position: idx + 1 }));

  }, [users, matches, config]);

  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  useEffect(() => {
     setLeaderboard(calculateLeaderboard());
  }, [matches, users, calculateLeaderboard]);
  

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSendNotification = (newNotif: Notification) => {
    setNotifications([newNotif, ...notifications]);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavButton = ({ tab, icon: Icon, label }: { tab: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
        activeTab === tab 
          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-slate-800 scale-105 shadow-sm' 
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === tab ? 2.5 : 2} />
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
  );

  const getAvatarEmoji = (id: string | undefined) => {
      const AVATARS: Record<string, string> = {
          '1': '🦁', '2': '⚽', '3': '🦊', '4': '👽', '5': '🤖', '6': '🦄',
          '7': '😎', '8': '🇧🇷', '9': '🔥', '10': '💎', '11': '👑', '12': '🚀'
      };
      return AVATARS[id || ''] || '';
  };
  
  const getAvatarColor = (id: string | undefined) => {
      const COLORS: Record<string, string> = {
          '1': 'bg-yellow-500', '2': 'bg-green-500', '3': 'bg-orange-500', '4': 'bg-purple-500', '5': 'bg-slate-500', '6': 'bg-pink-500',
          '7': 'bg-blue-500', '8': 'bg-green-600', '9': 'bg-red-500', '10': 'bg-cyan-500', '11': 'bg-amber-400', '12': 'bg-indigo-500'
      };
      return COLORS[id || ''] || 'text-yellow-500';
  };

  // --- RENDER ---
  if (showSplash) return <SplashScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="absolute top-4 right-4">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300">
             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        </div>
        {loading ? (
             <div className="flex flex-col items-center gap-4">
                 <Loader2 size={48} className="animate-spin text-green-500" />
                 <p className="text-slate-500 font-bold animate-pulse">Carregando dados...</p>
             </div>
        ) : (
             authMode === 'login' ? (
                <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
             ) : (
                <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} ticketPrice={config.ticketPrice} />
             )
        )}
      </div>
    );
  }

  // --- PENDING APPROVAL SCREEN ---
  // If user is logged in but NOT admin and NOT paid/approved
  if (user.role !== 'admin' && !user.paid) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden text-center p-8 animate-fade-in-up">
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Aguardando Aprovação</h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                      Olá, <strong>{user.name}</strong>! <br/>
                      Seu cadastro foi realizado com sucesso, mas o Administrador ainda não liberou seu acesso.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl mb-6 text-left">
                      <p className="text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">
                         <strong>Dica:</strong> Se você já fez o pagamento, envie o comprovante para o administrador.
                      </p>
                  </div>
                  
                  <button 
                     onClick={() => window.open(WHATSAPP_GROUP_LINK, '_blank')}
                     className="w-full mb-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/10 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 animate-pulse"
                  >
                     <Users size={20} /> Entrar no Grupo do Bolão
                  </button>

                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                            setLoading(true);
                            supabase.auth.getUser().then(({data}: any) => {
                                if(data.user) loadData(data.user.id);
                                else setLoading(false);
                            });
                        }}
                        disabled={loading}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                         <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> 
                         {loading ? 'Verificando...' : 'Verificar Status Agora'}
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold py-2 text-sm"
                      >
                         Sair da Conta
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 md:pb-0 transition-colors duration-300">
      
      {/* WHATSAPP GROUP MODAL (FIRST ACCESS) */}
      {showGroupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 flex flex-col items-center text-center shadow-2xl animate-scale-up border border-gray-200 dark:border-slate-700 relative">
                 <button onClick={closeGroupModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                     <Users size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Entre no Grupo!</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                     Fique por dentro das novidades, interaja com a galera e receba os avisos do bolão diretamente no WhatsApp.
                 </p>
                 <button 
                     onClick={joinGroup}
                     className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/10 transition-all transform hover:scale-[1.05] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                     <MessageCircle size={20} />
                     Entrar no Grupo Agora
                  </button>
                  <button onClick={closeGroupModal} className="mt-4 text-xs text-slate-400 underline">
                      Vou entrar depois
                  </button>
             </div>
          </div>
      )}

      {/* HEADER */}
      {/* Removido o backdrop-blur e background semi-transparente para evitar problemas de rolagem */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg p-0.5 shadow-md hidden sm:block">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[6px] flex items-center justify-center overflow-hidden">
                   <img src={APP_LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                </div>
             </div>
             
             {/* Greeting Section */}
             <button 
               onClick={() => setActiveTab(activeTab === ViewState.PROFILE ? ViewState.RULES : ViewState.PROFILE)}
               className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/80 p-1.5 -ml-1.5 rounded-lg transition-colors group text-left"
             >
               {user.avatar ? (
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm ${getAvatarColor(user.avatar)}`}>
                    {getAvatarEmoji(user.avatar)}
                 </div>
               ) : (
                 <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-yellow-500 transition-colors">
                    <UserIcon size={20} />
                 </div>
               )}
               
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Seja bem vindo</span>
                 <h1 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">
                   <span className="truncate max-w-[150px] sm:max-w-[200px] block">{user.name}</span>
                 </h1>
               </div>
             </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                 onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                 className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                 <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                 )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-down origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                           <h3 className="font-bold text-slate-700 dark:text-white text-sm">Notificações</h3>
                           {unreadCount > 0 && (
                             <button 
                               onClick={markAllAsRead} 
                               className="text-[10px] flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                               title="Marcar todas como lidas"
                             >
                                <CheckCheck size={12} />
                                LER TUDO
                             </button>
                           )}
                        </div>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} novas</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                           notifications.map(n => (
                               <div 
                                 key={n.id} 
                                 className={`p-3 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors relative group cursor-pointer ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                 onClick={() => markAsRead(n.id)}
                               >
                                   <div className="flex justify-between items-start mb-1">
                                       <div className="flex items-center gap-2">
                                           <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                                               n.type === 'alert' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                               n.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                               'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                           }`}>
                                               {n.type === 'alert' ? 'Importante' : n.type === 'success' ? 'Sucesso' : 'Info'}
                                           </span>
                                           {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>}
                                       </div>
                                       <span className="text-[10px] text-slate-400">{n.date}</span>
                                   </div>
                                   <h4 className={`text-sm font-bold mb-0.5 ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</h4>
                                   <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                                   <button 
                                      onClick={(e) => deleteNotification(e, n.id)}
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                                   >
                                       <X size={14} />
                                   </button>
                               </div>
                           ))
                        ) : (
                           <div className="p-8 text-center text-slate-400 text-sm">
                               Nenhuma notificação.
                           </div>
                        )}
                    </div>
                </div>
              )}
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors" title="Sair">
               <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto p-4 animate-fade-in">
        
        {activeTab === ViewState.RULES && (
          <RulesSection 
            scoringRules={config.scoringRules} 
            ticketPrice={config.ticketPrice}
            prizeDistribution={config.prizeDistribution}
            specialTeams={config.specialTeams}
            specialPhases={config.specialPhases}
          />
        )}
        
        {activeTab === ViewState.BETTING && (
          <BettingSheet 
            matches={matches} 
            extraBets={extraBets} 
            onMatchesChange={setMatches} 
            onExtraBetsChange={handleExtraBetsChange}
            specialTeams={config.specialTeams}
            specialPhases={config.specialPhases}
            scoringRules={config.scoringRules}
            currentUser={user}
            allUsers={users}
          />
        )}
        
        {activeTab === ViewState.GROUPS && (
          <GroupStandings matches={matches} currentUser={user} />
        )}
        
        {activeTab === ViewState.RANKING && (
          <Leaderboard 
            ticketPrice={config.ticketPrice} 
            prizeDistribution={config.prizeDistribution} 
            players={leaderboard}
            currentUser={user}
          />
        )}
        
        {activeTab === ViewState.RESULTS && (
           <OfficialResults matches={matches} />
        )}
        
        {activeTab === ViewState.ADMIN && (
          <AdminPanel 
            config={config} 
            users={users} 
            onUpdateConfig={setConfig} 
            onUpdateUsers={handleAdminUpdateUsers}
            onSendNotification={handleSendNotification}
          />
        )}

        {activeTab === ViewState.PROFILE && (
           <UserProfile 
              user={user} 
              onUpdateUser={handleUpdateUser} 
              ticketPrice={config.ticketPrice}
           />
        )}

      </main>

      {/* INSTALL PWA PROMPT */}
      <InstallPWA />

      {/* BOTTOM NAVIGATION (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-2 z-40 md:hidden">
         <div className="flex justify-around items-center">
            <NavButton tab={ViewState.RULES} icon={FileText} label="Regras" />
            <NavButton tab={ViewState.BETTING} icon={PenLine} label="Apostas" />
            <NavButton tab={ViewState.GROUPS} icon={LayoutGrid} label="Grupos" />
            <NavButton tab={ViewState.RANKING} icon={Trophy} label="Ranking" />
            <NavButton tab={ViewState.RESULTS} icon={CheckCircle2} label="Resultados" />
            {user.role === 'admin' && <NavButton tab={ViewState.ADMIN} icon={Settings} label="Admin" />}
         </div>
      </nav>

      {/* DESKTOP NAVIGATION (Hidden on Mobile) */}
      <div className="hidden md:block fixed left-4 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 flex flex-col gap-2">
            <NavButton tab={ViewState.RULES} icon={FileText} label="Regras" />
            <div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto my-1"></div>
            <NavButton tab={ViewState.BETTING} icon={PenLine} label="Apostas" />
            <NavButton tab={ViewState.GROUPS} icon={LayoutGrid} label="Grupos" />
            <div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto my-1"></div>
            <NavButton tab={ViewState.RANKING} icon={Trophy} label="Ranking" />
            <NavButton tab={ViewState.RESULTS} icon={CheckCircle2} label="Resultados" />
            {user.role === 'admin' && (
              <>
               <div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto my-1"></div>
               <NavButton tab={ViewState.ADMIN} icon={Settings} label="Admin" />
              </>
            )}
        </div>
      </div>

    </div>
  );
};