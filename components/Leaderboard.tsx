import React, { useState, useRef, useMemo } from 'react';
import { APP_LOGO_URL } from '../constants';
import { TrendingUp, TrendingDown, Minus, X, Trophy, ChevronRight, ChevronDown, Share2, Loader2, Target, Flag, Banknote, BarChart3, Info, CheckCircle, User, Crown, LayoutList, ArrowRightLeft } from 'lucide-react';
import { Player, PrizeConfig, User as UserType } from '../types';
import html2canvas from 'html2canvas';

interface LeaderboardProps {
  ticketPrice: number;
  prizeDistribution: PrizeConfig;
  players: Player[];
  currentUser: UserType | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ ticketPrice, prizeDistribution, players, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'RANKING' | 'STATS'>('RANKING');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Statistics State
  const [statPlayer1Id, setStatPlayer1Id] = useState<string>('');
  const [statPlayer2Id, setStatPlayer2Id] = useState<string>('');

  // Sort leaderboard
  const sortedData = useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      if (b.brazilPoints !== a.brazilPoints) return b.brazilPoints - a.brazilPoints;
      return a.name.localeCompare(b.name);
    });
  }, [players]);

  // Set default stats player when data loads
  useMemo(() => {
      if (sortedData.length > 0 && !statPlayer1Id) {
          setStatPlayer1Id(sortedData[0].id);
      }
  }, [sortedData]);
  
  // Calculate Prizes
  const totalPool = sortedData.length * ticketPrice;
  const prizes = useMemo(() => ({
      first: totalPool * (prizeDistribution.first / 100),
      second: totalPool * (prizeDistribution.second / 100),
      third: totalPool * (prizeDistribution.third / 100),
  }), [totalPool, prizeDistribution]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const closeImageModal = () => setGeneratedImage(null);

  const toggleRow = (id: string) => {
    if (expandedPlayerId === id) {
      setExpandedPlayerId(null);
    } else {
      setExpandedPlayerId(id);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(printRef.current, {
        useCORS: true,
        scale: 2,
        windowWidth: 1200,
        scrollY: 0,
        onclone: (clonedDoc) => {
            const element = clonedDoc.getElementById('leaderboard-print-area');
            if (element) {
                element.style.width = '800px'; 
                element.style.padding = '40px';
                element.style.margin = '0 auto';
                element.style.borderRadius = '0';
                element.classList.remove('-mx-4');
                
                const brand = element.querySelector('.opacity-80');
                if(brand) {
                    (brand as HTMLElement).style.opacity = '1';
                    (brand as HTMLElement).style.marginBottom = '32px';
                    (brand as HTMLElement).style.display = 'flex';
                }
                
                const grid = element.querySelector('.grid');
                if (grid) {
                    (grid as HTMLElement).style.gap = '24px';
                    (grid as HTMLElement).style.alignItems = 'flex-end';
                }

                const circles = element.querySelectorAll('.rounded-full.absolute');
                circles.forEach((c: any) => {
                   c.style.display = 'flex';
                   c.style.alignItems = 'center';
                   c.style.justifyContent = 'center';
                   c.style.lineHeight = '0'; 
                   c.style.paddingBottom = '0px'; 
                });
            }
        },
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
            const file = new File([blob], 'classificacao-bolao.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Ranking Bolão Copa 2026',
                        text: 'Confira a classificação atualizada!'
                    });
                } catch (err) {
                    console.log('Share canceled or failed', err);
                }
            } else {
                setGeneratedImage(canvas.toDataURL());
            }
        }
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      alert("Não foi possível gerar a imagem no momento.");
      setIsGenerating(false);
    }
  };

  const PositionChart = ({ player1, player2 }: { player1: Player, player2?: Player }) => {
    if (!player1.history || player1.history.length === 0) {
      return <div className="p-4 text-center text-slate-500">Histórico não disponível.</div>;
    }

    const history1 = player1.history;
    const history2 = player2?.history || [];
    
    const allPositions = [...history1.map(h => h.position), ...history2.map(h => h.position)];
    const maxRank = Math.max(...allPositions, 10); 
    const minRank = 1;
    
    const padding = 30;
    const width = 600; 
    const height = 250; 
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getX = (index: number, total: number) => padding + (index / (total - 1)) * chartWidth;
    const getY = (position: number) => padding + ((position - minRank) / (maxRank - minRank)) * chartHeight;

    const createPath = (hist: typeof history1) => {
       return hist.map((h, i) => `${getX(i, hist.length)},${getY(h.position)}`).join(' ');
    };

    const points1 = createPath(history1);
    const points2 = player2 ? createPath(history2) : '';

    return (
      <div className="w-full overflow-hidden">
         <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {[1, Math.ceil(maxRank/2), maxRank].map(rank => (
               <g key={rank}>
                  <line x1={padding} y1={getY(rank)} x2={width - padding} y2={getY(rank)} stroke="#e2e8f0" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                  <text x={padding - 5} y={getY(rank) + 4} textAnchor="end" fontSize="10" fill="#94a3b8" className="dark:fill-slate-500">#{rank}</text>
               </g>
            ))}
            {history1.map((h, i) => (
               <text key={i} x={getX(i, history1.length)} y={height - 5} textAnchor="middle" fontSize="10" fill="#64748b" className="dark:fill-slate-400">
                  {h.round.split(' ')[0].substring(0,3)}
               </text>
            ))}
            <polyline points={points1} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {player2 && (
              <polyline points={points2} fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {history1.map((h, i) => (
              <g key={`p1-${i}`}>
                <circle cx={getX(i, history1.length)} cy={getY(h.position)} r="4" fill="#ffffff" stroke="#22c55e" strokeWidth="2" className="dark:fill-slate-800" />
                <text x={getX(i, history1.length)} y={getY(h.position) - 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#22c55e">
                   #{h.position}
                </text>
              </g>
            ))}
            {player2 && history2.map((h, i) => (
              <g key={`p2-${i}`}>
                <circle cx={getX(i, history2.length)} cy={getY(h.position)} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" className="dark:fill-slate-800" />
                <text x={getX(i, history2.length)} y={getY(h.position) + 20} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3b82f6">
                   #{h.position}
                </text>
              </g>
            ))}
         </svg>
      </div>
    );
  };

  const renderStatsTab = () => {
    const p1 = sortedData.find(p => p.id === statPlayer1Id);
    const p2 = sortedData.find(p => p.id === statPlayer2Id);

    if (!p1) return null;

    const StatCard = ({ label, value1, value2, highlight = false, icon: Icon }: { label: string, value1: number | string, value2?: number | string, highlight?: boolean, icon?: any }) => {
        const diff = typeof value1 === 'number' && typeof value2 === 'number' ? value1 - value2 : 0;
        return (
            <div className={`p-4 rounded-xl border ${highlight ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'} shadow-sm flex flex-col items-center justify-center relative overflow-hidden`}>
                <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    {Icon && <Icon size={12} />} {label}
                </span>
                <div className="flex items-center gap-4">
                     <span className={`text-2xl font-black ${highlight ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                        {value1}
                     </span>
                     {value2 !== undefined && (
                         <>
                            <span className="text-slate-300 dark:text-slate-600">vs</span>
                            <span className="text-xl font-bold text-blue-500 dark:text-blue-400">
                                {value2}
                            </span>
                         </>
                     )}
                </div>
                {value2 !== undefined && diff !== 0 && (
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                   </span>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1 block">Participante Principal</label>
                    <div className="relative">
                        <select 
                            className="w-full p-2.5 pl-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-800 dark:text-white appearance-none"
                            value={statPlayer1Id}
                            onChange={(e) => setStatPlayer1Id(e.target.value)}
                        >
                            {sortedData.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
                
                <div className="flex items-center justify-center">
                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-400">
                        <ArrowRightLeft size={20} />
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase mb-1 block">Comparar com (Opcional)</label>
                    <div className="relative">
                        <select 
                            className="w-full p-2.5 pl-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-white appearance-none"
                            value={statPlayer2Id}
                            onChange={(e) => setStatPlayer2Id(e.target.value)}
                        >
                            <option value="">-- Selecione para comparar --</option>
                            {sortedData.filter(p => p.id !== statPlayer1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Posição" value1={`${p1.position}º`} value2={p2 ? `${p2.position}º` : undefined} icon={Trophy} />
                <StatCard label="Pontos Totais" value1={p1.points} value2={p2?.points} highlight icon={Target} />
                <StatCard label="Cravadas" value1={p1.exactScores} value2={p2?.exactScores} icon={CheckCircle} />
                <StatCard label="Pts Brasil" value1={p1.brazilPoints} value2={p2?.brazilPoints} icon={Flag} />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                 <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" />
                    Histórico de Classificação
                 </h3>
                 <div className="flex items-center gap-4 mb-4 text-xs">
                     <div className="flex items-center gap-1.5">
                         <span className="w-3 h-3 rounded-full bg-green-500"></span>
                         <span className="font-bold text-slate-700 dark:text-slate-300">{p1.name}</span>
                     </div>
                     {p2 && (
                         <div className="flex items-center gap-1.5">
                             <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                             <span className="font-bold text-slate-700 dark:text-slate-300">{p2.name}</span>
                         </div>
                     )}
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 sm:p-4 border border-slate-100 dark:border-slate-800">
                     <PositionChart player1={p1} player2={p2} />
                 </div>
            </div>
        </div>
    );
  };

  const isCurrentUser = (playerName: string) => currentUser && playerName === currentUser.name;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header Watermark */}
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy size={120} className="text-white" />
            </div>
            <h2 className="text-2xl font-black flex items-center gap-2 relative z-10">
                <Trophy className="text-yellow-200 fill-yellow-200" /> Ranking
            </h2>
            <p className="text-yellow-50 text-sm mt-1 opacity-90 relative z-10">
                Veja quem está na liderança e a disputa pelos prêmios.
            </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
            {/* Title removed, integrated into watermark header */}
         </div>
         <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
             <button 
                onClick={() => setActiveTab('RANKING')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'RANKING' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
             >
                <LayoutList size={16} /> Geral
             </button>
             <button 
                onClick={() => setActiveTab('STATS')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'STATS' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
             >
                <BarChart3 size={16} /> Estatísticas
             </button>
         </div>
      </div>
      
      {activeTab === 'RANKING' ? (
      <>
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
             <div className="w-full md:w-auto flex-1 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                 <div className="font-bold mb-1 flex items-center gap-1 text-slate-700 dark:text-slate-300"><Info size={14}/> Critérios de Desempate:</div>
                 <ol className="list-decimal list-inside flex flex-wrap gap-x-4 gap-y-1">
                     <li>Pontos Totais</li>
                     <li>Nº de Cravadas</li>
                     <li>Pts nos jogos do Brasil</li>
                     <li>Ordem Alfabética</li>
                 </ol>
             </div>

             <button
                onClick={handleShareWhatsApp}
                disabled={isGenerating}
                className={`flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 text-sm h-full w-full md:w-auto justify-center ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
            >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                <span>Compartilhar Ranking</span>
            </button>
        </div>

        <div id="leaderboard-print-area" ref={printRef} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 sm:p-2 -mx-4 sm:mx-0">
            <div className="flex flex-col items-center justify-center gap-2 pb-6 opacity-80 hidden">
                <img src={APP_LOGO_URL} alt="Logo" className="w-12 h-12 object-contain" />
                <span className="font-black text-2xl text-slate-800 dark:text-white tracking-tighter">BOLÃO COPA 2026</span>
            </div>

            {/* Top 3 Highlight */}
            {sortedData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-8 px-2">
            {/* 2nd Place */}
            <div 
                onClick={() => sortedData[1] && toggleRow(sortedData[1].id)}
                className={`p-2 pt-8 sm:p-4 sm:pt-10 rounded-t-xl border-t-4 border-slate-400 shadow-md flex flex-col items-center justify-end h-auto min-h-[160px] sm:min-h-[180px] relative transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 pb-4 ${sortedData[1] && isCurrentUser(sortedData[1].name) ? 'bg-yellow-50 dark:bg-yellow-900/10 ring-2 ring-yellow-400/50' : 'bg-white dark:bg-slate-800/80'}`}
            >
                <div className="absolute -top-3 sm:-top-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-400 flex items-center justify-center font-bold text-slate-900 text-sm sm:text-lg z-10 shadow-sm border-2 border-white dark:border-slate-800 leading-none">2</div>
                {sortedData[1] ? (
                    <>
                    <div className="w-full text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm text-center mb-1 leading-tight flex items-center justify-center">
                        {sortedData[1].name}
                        {isCurrentUser(sortedData[1].name) && <User size={12} className="ml-1 text-slate-400" />}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">{sortedData[1].points}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mb-2">pts</div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Banknote size={10} /> {formatCurrency(prizes.second)}
                    </div>
                    </>
                ) : <div className="text-slate-300 dark:text-slate-600 text-xs">-</div>}
            </div>
            
            {/* 1st Place */}
            <div 
                onClick={() => sortedData[0] && toggleRow(sortedData[0].id)}
                className={`p-2 pt-10 sm:p-4 sm:pt-12 rounded-t-xl border-t-4 border-yellow-500 flex flex-col items-center justify-end h-auto min-h-[200px] sm:min-h-[240px] relative shadow-lg dark:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-colors cursor-pointer hover:bg-yellow-50 dark:hover:bg-slate-700 pb-6 ${sortedData[0] && isCurrentUser(sortedData[0].name) ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-500' : 'bg-white dark:bg-slate-800'}`}
            >
                <div className="absolute -top-4 sm:-top-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-yellow-900 text-base sm:text-xl shadow-sm z-10 border-2 border-white dark:border-slate-800 leading-none">
                    {sortedData[0] && isCurrentUser(sortedData[0].name) ? <Crown size={20} /> : '1'}
                </div>
                {sortedData[0] ? (
                    <>
                    <div className="w-full text-yellow-600 dark:text-yellow-400 font-bold text-xs sm:text-sm text-center mb-1 leading-tight flex items-center justify-center">
                        {sortedData[0].name}
                        {isCurrentUser(sortedData[0].name) && <span className="ml-1 text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded">VOCÊ</span>}
                    </div>
                    <div className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white mt-1">{sortedData[0].points}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mb-3">pts</div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-md text-xs sm:text-sm font-black flex items-center gap-1 shadow-sm border border-green-200 dark:border-green-800">
                        <Banknote size={12} /> {formatCurrency(prizes.first)}
                    </div>
                    </>
                ) : <div className="text-slate-300 text-xs">-</div>}
            </div>

            {/* 3rd Place */}
            <div 
                onClick={() => sortedData[2] && toggleRow(sortedData[2].id)}
                className={`p-2 pt-8 sm:p-4 sm:pt-10 rounded-t-xl border-t-4 border-orange-700 shadow-md flex flex-col items-center justify-end h-auto min-h-[140px] sm:min-h-[160px] relative transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 pb-4 ${sortedData[2] && isCurrentUser(sortedData[2].name) ? 'bg-yellow-50 dark:bg-yellow-900/10 ring-2 ring-yellow-400/50' : 'bg-white dark:bg-slate-800/80'}`}
            >
                <div className="absolute -top-3 sm:-top-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-700 flex items-center justify-center font-bold text-orange-100 text-sm sm:text-lg z-10 border-2 border-white dark:border-slate-800 leading-none">3</div>
                {sortedData[2] ? (
                    <>
                    <div className="w-full text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm text-center mb-1 leading-tight flex items-center justify-center">
                        {sortedData[2].name}
                         {isCurrentUser(sortedData[2].name) && <User size={12} className="ml-1 text-orange-400" />}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">{sortedData[2].points}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mb-2">pts</div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Banknote size={10} /> {formatCurrency(prizes.third)}
                    </div>
                    </>
                ) : <div className="text-slate-300 dark:text-slate-600 text-xs">-</div>}
            </div>
            </div>
            )}

            {/* Full Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md transition-colors">
            <div className="overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-slate-900 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3">Participante</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {sortedData.map((player, idx) => {
                    const isExpanded = expandedPlayerId === player.id;
                    const isMe = isCurrentUser(player.name);
                    
                    return (
                        <React.Fragment key={player.id}>
                        <tr 
                            onClick={() => toggleRow(player.id)}
                            className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-gray-50 dark:bg-slate-700/50' : ''} ${isMe ? 'bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                        >
                            <td className="px-4 py-4 align-middle">
                            <div className="flex items-center justify-center gap-1">
                                <span className={`font-mono font-bold text-sm ${idx < 3 ? (isMe ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-white') : (isMe ? 'text-green-700 dark:text-green-400' : 'text-slate-500')}`}>{idx + 1}º</span>
                                {player.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                {player.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                                {player.trend === 'same' && <Minus className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                            </div>
                            </td>
                            <td className="px-4 py-4 align-middle">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold block min-w-[120px] break-words ${isMe ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {player.name}
                                    </span>
                                    {isMe && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">VOCÊ</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right align-middle">
                                <span className={`font-black text-lg ${isMe ? 'text-slate-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>{player.points}</span>
                                <span className="text-[10px] text-slate-400 block -mt-1 uppercase">pts</span>
                            </td>
                            <td className="px-4 py-4 text-center align-middle">
                                {isExpanded ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />}
                            </td>
                        </tr>
                        {isExpanded && (
                            <tr className="bg-gray-50/50 dark:bg-slate-900/30 animate-fade-in-down">
                            <td colSpan={4} className="p-4">
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400">
                                                    <Target size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Cravadas</span>
                                                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{player.exactScores}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400">
                                                    <Flag size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Pts Brasil</span>
                                                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{player.brazilPoints}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setStatPlayer1Id(player.id); setActiveTab('STATS'); }}
                                      className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BarChart3 size={16} /> Ver Gráfico e Comparador
                                    </button>
                                </div>
                            </td>
                            </tr>
                        )}
                        </React.Fragment>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>
        </div>
      </>
      ) : (
        renderStatsTab()
      )}
      
      {generatedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-200 dark:border-slate-700">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 dark:text-white">Compartilhar Ranking</h3>
                   <button onClick={closeImageModal} className="text-slate-500 hover:text-slate-700"><X size={20} /></button>
               </div>
               <div className="p-6 flex flex-col items-center gap-4">
                   <p className="text-sm text-center text-slate-600 dark:text-slate-300">
                     A imagem foi gerada! <br/>Copie ou salve a imagem abaixo e envie no seu grupo do WhatsApp.
                   </p>
                   <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-gray-50 dark:bg-slate-900 w-full flex justify-center">
                       <img src={generatedImage} alt="Ranking Gerado" className="max-h-[50vh] object-contain shadow-md rounded" />
                   </div>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};