import { Match, Player, User, ScoringRule, PrizeConfig, Notification } from './types';

// Mock Users for Authentication
export const MOCK_USERS: User[] = [
  { username: 'admin', name: 'Administrador', role: 'admin', password: '123', paid: true, email: 'admin@bolao.com', phone: '(11) 98888-8888', avatar: '11' },
  { username: 'depaula14', name: 'De Paula', role: 'user', password: 'Hanna@06', paid: true, email: 'depaula@email.com', phone: '(11) 99999-9999', avatar: '11' },
  { username: 'user', name: 'Palpiteiro Carlos', role: 'user', password: '123', paid: true, email: 'carlos@email.com', phone: '(11) 97777-7777', avatar: '2' },
  { username: 'ana', name: 'Palpiteira Ana', role: 'user', password: '123', paid: true, email: 'ana@email.com', phone: '(11) 96666-6666', avatar: '6' },
  { username: 'joao', name: 'João Silva', role: 'user', password: '123', paid: true, email: 'joao@email.com', phone: '(11) 95555-5555', avatar: '1' },
  { username: 'pendente', name: 'Usuário Pendente', role: 'user', password: '123', paid: false, email: 'pendente@email.com', phone: '(11) 95555-5555', avatar: '5' }
];

// Reliable Base64 SVG Logo - Gold Trophy
export const APP_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZiYmYyNCIgc3Ryb2tlPSIjYjQ1MzA5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiA5SDQuNWEyLjUgMi41IDAgMCAxIDAtNUg2Ii8+PHBhdGggZD0iTTE4IDloMS41YTIuNSAyLjUgMCAwIDAgMC01SDE4Ii8+PHBhdGggZD0iTTQgMjJoMTYiLz48cGF0aCBkPSJNMTAgMTQuNjZWMTdjMCAuNTUtLjQ3Ljk4LS45NyAxLjIxQzcuODUgMTguNzUgNyAyMC4yNCA3IDIyIi8+PHBhdGggZD0iTTE0IDE0LjY2VjE3YzAgLjU1LjQ3Ljk4Ljk3IDEuMjFDMTYuMTUgMTguNzUgMTcgMjAuMjQgMTcgMjIiLz48cGF0aCBkPSJNMTggMkg2djdhNiA2IDAgMCAwIDEyIDBWMloiLz48L3N2Zz4=";

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Bem-vindo!', message: 'O Bolão da Copa 2026 começou! Preencha seus palpites.', date: '10/06 10:00', type: 'success', read: false },
  { id: '2', title: 'Pagamento', message: 'Lembre-se de realizar o pagamento para validar sua participação.', date: '10/06 12:00', type: 'alert', read: false }
];

export const MOCK_LEADERBOARD: Player[] = []; // Inicialmente vazio, será calculado dinamicamente

// Initial Configuration (Default Values)
export const INITIAL_TICKET_PRICE = 50;
export const INITIAL_PRIZE_DISTRIBUTION: PrizeConfig = {
  first: 65,
  second: 25,
  third: 10
};
export const INITIAL_SPECIAL_TEAMS = ['Brasil'];
export const INITIAL_SPECIAL_PHASES = ['FINAL'];

export const INITIAL_SCORING_RULES: ScoringRule[] = [
    { id: '1', criteria: "Escore em cheio", points: 6 },
    { id: '2', criteria: "Vencedor + Escore de uma das sel.", points: 3 },
    { id: '3', criteria: "Apenas o vencedor", points: 2 },
    { id: '4', criteria: "Apenas o empate (placar incorreto)", points: 2 },
    { id: '5', criteria: "1ª Colocação do grupo", points: 3 },
    { id: '6', criteria: "2ª Colocação do grupo", points: 3 },
    { id: '7', criteria: "Artilheiro da Copa", points: 15 },
    { id: '8', criteria: "Campeão da Copa", points: 15 },
    { id: '9', criteria: "Vice-Campeão", points: 10 },
    { id: '10', criteria: "3º Colocado", points: 8 }
];

export const RULES_TEXT = {
  introBase: [
    "Cada participante poderá preencher apenas uma cartela de aposta por taxa de inscrição paga.",
    "O prazo limite para envio ou alteração dos palpites da fase de grupos encerra-se no dia 10/06/2026.",
    "Para as fases eliminatórias (mata-mata), os palpites devem ser enviados até o início da data do respectivo jogo."
  ],
  tieBreakers: [
    "Maior número de escores em cheio (cravadas)",
    "Maior número de pontos obtidos nos jogos da Seleção Brasileira e/ou Fases Especiais (x2)",
    "Sorteio realizado pela administração"
  ],
  notes: [
    "A ordem dos países classificados em seus grupos será automaticamente preenchida pelo sistema conforme os resultados oficiais da FIFA.",
    "É responsabilidade do participante verificar se seus palpites foram salvos corretamente antes do prazo final."
  ],
  generalProvisions: [
    "A classificação geral será atualizada automaticamente após o término de cada partida e inserção do resultado oficial.",
    "Contestações sobre pontuação de uma partida específica devem ser realizadas em até 24 horas após o término do jogo.",
    "ACEITE FINAL: A classificação geral será considerada DEFINITIVA e IRREVOGÁVEL 48 horas após o apito final da última partida da Copa do Mundo (Final).",
    "Durante este período de 48 horas (período de homologação), todos os participantes devem conferir suas pontuações e a tabela final. O silêncio será interpretado como aceitação tácita do resultado.",
    "Após o período de homologação, não serão aceitas reclamações ou recursos de qualquer natureza, procedendo-se imediatamente ao pagamento das premiações aos vencedores.",
    "O pagamento da premiação será realizado via PIX para a conta informada pelo participante vencedor.",
    "Casos omissos neste regulamento serão resolvidos soberanamente pelo Administrador do Bolão."
  ]
};

// Group Definitions (Updated based on Official Table)
const GROUPS_DEF = {
    A: ['México', 'África do Sul', 'Coreia do Sul', 'UEFA D'],
    B: ['Canadá', 'UEFA A', 'Catar', 'Suíça'],
    C: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
    D: ['EUA', 'Paraguai', 'Austrália', 'UEFA C'],
    E: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
    F: ['Holanda', 'Japão', 'UEFA B', 'Tunísia'],
    G: ['Bélgica', 'Irã', 'Nova Zelândia', 'Egito'],
    H: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
    I: ['França', 'Senegal', 'FIFA 2', 'Noruega'],
    J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
    K: ['Portugal', 'FIFA 1', 'Uzbequistão', 'Colômbia'],
    L: ['Inglaterra', 'Gana', 'Croácia', 'Panamá']
};

export const TEAMS_LIST = Object.values(GROUPS_DEF).flat().sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

// Helper for sorting squads
const sortSquad = (arr: string[]) => arr.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

// Mock Squads for Top Scorer selection with more realistic players
export const MOCK_SQUADS: Record<string, string[]> = {
  "Brasil": sortSquad([
    "Alisson", "Andreas Pereira", "Arana", "Bento", "Beraldo", "Bremer", "Bruno Guimarães", 
    "Casemiro", "Danilo", "Danilo (Nott. Forest)", "Douglas Luiz", "Ederson", "Endrick", 
    "Evanilson", "Fabrício Bruno", "Gabriel Jesus", "Gabriel Magalhães", "Gabriel Martinelli", 
    "Galeno", "João Gomes", "Lucas Paquetá", "Marquinhos", "Militão", "Pedro", "Pepê", 
    "Rafael", "Raphinha", "Richarlison", "Rodrygo", "Savinho", "Vanderson", "Wendell", 
    "Yan Couto", "Vinicius Jr"
  ]),
  "Argentina": sortSquad(["Lionel Messi", "Julián Álvarez", "Lautaro Martínez", "Paulo Dybala", "Alejandro Garnacho", "Enzo Fernández", "Alexis Mac Allister", "Ángel Di María", "Thiago Almada"]),
  "França": sortSquad(["Kylian Mbappé", "Antoine Griezmann", "Ousmane Demélé", "Marcus Thuram", "Randal Kolo Muani", "Olivier Giroud", "Kingsley Coman", "Christopher Nkunku", "Bradley Barcola"]),
  "Alemanha": sortSquad(["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Leroy Sané", "Niclas Füllkrug", "Serge Gnabry", "Thomas Müller", "Ilkay Gündogan"]),
  "Inglaterra": sortSquad(["Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden", "Cole Palmer", "Ollie Watkins", "Ivan Toney", "Jack Grealish", "Marcus Rashford"]),
  "Portugal": sortSquad(["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão", "João Félix", "Diogo Jota", "Gonçalo Ramos", "Pedro Neto"]),
  "Espanha": sortSquad(["Lamine Yamal", "Álvaro Morata", "Nico Williams", "Dani Olmo", "Pedri", "Ferran Torres", "Mikel Oyarzabal", "Joselu"]),
  "Holanda": sortSquad(["Cody Gakpo", "Memphis Depay", "Xavi Simons", "Wout Weghorst", "Donyell Malen"]),
  "Uruguai": sortSquad(["Darwin Núñez", "Luis Suárez", "Federico Valverde", "Facundo Pellistri", "Maxi Araújo"]),
  "Bélgica": sortSquad(["Romelu Lukaku", "Kevin De Bruyne", "Jérémy Doku", "Leandro Trossard", "Loïs Openda"]),
  "EUA": sortSquad(["Christian Pulisic", "Timothy Weah", "Gio Reyna", "Folarin Balogun", "Weston McKennie"]),
  "México": sortSquad(["Santiago Giménez", "Hirving Lozano", "Uriel Antuna", "Edson Álvarez", "Julián Quiñones"]),
  "Colômbia": sortSquad(["Luis Díaz", "James Rodríguez", "Jhon Córdoba", "Rafael Borré", "Jhon Durán"]),
  "Croácia": sortSquad(["Luka Modrić", "Andrej Kramarić", "Ivan Perišić", "Mateo Kovačić", "Joško Gvardiol"]),
  // Generic fallback for others
  "default": sortSquad(["Atacante Principal", "Camisa 10", "Centroavante", "Ponta Direita", "Ponta Esquerda", "Meia Ofensivo"])
};

export const PHASES_LIST = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F", 
  "Grupo G", "Grupo H", "Grupo I", "Grupo J", "Grupo K", "Grupo L",
  "16-AVOS DE FINAL", "OITAVAS DE FINAL", "QUARTAS DE FINAL", "SEMIFINAL", "3º LUGAR", "FINAL"
];

export const TEAM_FLAGS: Record<string, string> = {
  "África do Sul": "za", "Alemanha": "de", "Arábia Saudita": "sa", "Argélia": "dz", "Argentina": "ar", "Austrália": "au", "Áustria": "at",
  "Bélgica": "be", "Brasil": "br", "Cabo Verde": "cv", "Canadá": "ca", "Catar": "qa", "Colômbia": "co", "Coreia do Sul": "kr",
  "Costa do Marfim": "ci", "Curaçao": "cw", "Croácia": "hr", "Egito": "eg", "Equador": "ec",
  "Escócia": "gb-sct", "Espanha": "es", "EUA": "us", "França": "fr", "Gana": "gh", "Haiti": "ht", "Holanda": "nl",
  "Inglaterra": "gb-eng", "Irã": "ir", "Itália": "it", "Japão": "jp", "Jordânia": "jo", "Marrocos": "ma",
  "México": "mx", "Noruega": "no", "Nova Zelândia": "nz", "Panamá": "pa", "Paraguai": "py", 
  "Portugal": "pt", "Senegal": "sn", "Suíça": "ch", "Tunísia": "tn", 
  "Uruguai": "uy", "Uzbequistão": "uz",
  // Playoff Teams Flags
  "Jamaica": "jm", "Nova Caledônia": "nc", "República Democrática do Congo": "cd",
  "Bolívia": "bo", "Iraque": "iq", "Suriname": "sr",
  "Bósnia e Herzegovina": "ba", "Irlanda do Norte": "gb-nir", "País de Gales": "gb-wls",
  "Albânia": "al", "Polônia": "pl", "Suécia": "se", "Ucrânia": "ua",
  "Eslováquia": "sk", "Kosovo": "xk", "Romênia": "ro", "Turquia": "tr",
  "Dinamarca": "dk", "Irlanda": "ie", "Macedônia do Norte": "mk", "República Tcheca": "cz",
  // Generic placeholders handled by UI, no flag code for the placeholder itself
  "UEFA A": "", "UEFA B": "", "UEFA C": "", "UEFA D": "",
  "FIFA 1": "", "FIFA 2": ""
};

export const PLAYOFF_TEAMS: Record<string, string[]> = {
  "FIFA 1": ["Jamaica", "Nova Caledônia", "República Democrática do Congo"],
  "FIFA 2": ["Bolívia", "Iraque", "Suriname"],
  "UEFA A": ["Bósnia e Herzegovina", "Irlanda do Norte", "Itália", "País de Gales"],
  "UEFA B": ["Albânia", "Polônia", "Suécia", "Ucrânia"],
  "UEFA C": ["Eslováquia", "Kosovo", "Romênia", "Turquia"],
  "UEFA D": ["Dinamarca", "Irlanda", "Macedônia do Norte", "República Tcheca"]
};

// Map playoff keys to World Cup Groups
export const PLAYOFF_TO_GROUP: Record<string, string> = {
  "FIFA 1": "Grupo K",
  "FIFA 2": "Grupo I",
  "UEFA A": "Grupo B",
  "UEFA B": "Grupo F",
  "UEFA C": "Grupo D",
  "UEFA D": "Grupo A"
};

// Locations mapped to Stadiums (Official 2026 Venues)
const LOCS = {
    MEX: 'Cid. México (Estadio Azteca)',
    GUA: 'Guadalajara (Estadio Akron)',
    MON: 'Monterrey (Estadio BBVA)',
    TOR: 'Toronto (BMO Field)',
    VAN: 'Vancouver (BC Place)',
    ATL: 'Atlanta (Mercedes-Benz)',
    MIA: 'Miami (Hard Rock Stadium)',
    BOS: 'Foxborough (Gillette Stadium)',
    PHI: 'Filadélfia (Lincoln Financial)',
    NYC: 'East Rutherford (MetLife)',
    KC:  'Kansas City (Arrowhead)',
    DAL: 'Dallas (AT&T Stadium)',
    HOU: 'Houston (NRG Stadium)',
    LA:  'Inglewood (SoFi Stadium)',
    SF:  'Santa Clara (Levi\'s Stadium)',
    SEA: 'Seattle (Lumen Field)'
};

const generateSchedule = (): Match[] => {
  const matches: Match[] = [];
  let matchIdCounter = 1;

  const addMatch = (group: string, date: string, loc: string, teamA: string, teamB: string) => {
    const id = (matchIdCounter++).toString();
    
    // DATA RESET: No official scores and no pre-filled bets for a fresh start.
    const officialScoreA = undefined;
    const officialScoreB = undefined;
    
    const bets: Record<string, { scoreA: number, scoreB: number }> = {};

    matches.push({
      id,
      teamA,
      teamB,
      date,
      location: loc,
      group: `Grupo ${group}`,
      isBrazil: teamA === 'Brasil' || teamB === 'Brasil',
      isFinal: false,
      officialScoreA,
      officialScoreB,
      bets: bets
    });
  };

  // --- GROUP A ---
  // México, África do Sul, Coreia do Sul, UEFA D
  addMatch('A', '11/06 - 16H', LOCS.MEX, 'México', 'África do Sul');
  addMatch('A', '11/06 - 23H', LOCS.GUA, 'Coreia do Sul', 'UEFA D');
  addMatch('A', '18/06 - 13H', LOCS.ATL, 'África do Sul', 'UEFA D');
  addMatch('A', '18/06 - 22H', LOCS.GUA, 'México', 'Coreia do Sul');
  addMatch('A', '24/06 - 22H', LOCS.MEX, 'UEFA D', 'México');
  addMatch('A', '24/06 - 22H', LOCS.MON, 'África do Sul', 'Coreia do Sul');

  // --- GROUP B ---
  // Canadá, UEFA A, Catar, Suíça
  addMatch('B', '12/06 - 16H', LOCS.TOR, 'Canadá', 'UEFA A');
  addMatch('B', '13/06 - 16H', LOCS.SF, 'Catar', 'Suíça');
  addMatch('B', '18/06 - 16H', LOCS.LA, 'UEFA A', 'Suíça');
  addMatch('B', '18/06 - 19H', LOCS.VAN, 'Canadá', 'Catar');
  addMatch('B', '24/06 - 16H', LOCS.VAN, 'Suíça', 'Canadá');
  addMatch('B', '24/06 - 16H', LOCS.SEA, 'UEFA A', 'Catar');

  // --- GROUP C ---
  // Brasil, Marrocos, Haiti, Escócia
  addMatch('C', '13/06 - 19H', LOCS.NYC, 'Brasil', 'Marrocos');
  addMatch('C', '13/06 - 22H', LOCS.BOS, 'Haiti', 'Escócia');
  addMatch('C', '19/06 - 19H', LOCS.BOS, 'Escócia', 'Marrocos');
  addMatch('C', '19/06 - 22H', LOCS.PHI, 'Brasil', 'Haiti');
  addMatch('C', '24/06 - 19H', LOCS.MIA, 'Escócia', 'Brasil');
  addMatch('C', '24/06 - 19H', LOCS.ATL, 'Marrocos', 'Haiti');

  // --- GROUP D ---
  // EUA, Paraguai, Austrália, UEFA C
  addMatch('D', '12/06 - 22H', LOCS.LA, 'EUA', 'Paraguai');
  addMatch('D', '14/06 - 13H', LOCS.VAN, 'Austrália', 'UEFA C');
  addMatch('D', '19/06 - 01H', LOCS.SF, 'UEFA C', 'Paraguai');
  addMatch('D', '19/06 - 16H', LOCS.SEA, 'EUA', 'Austrália');
  addMatch('D', '25/06 - 23H', LOCS.LA, 'UEFA C', 'EUA');
  addMatch('D', '25/06 - 23H', LOCS.SF, 'Paraguai', 'Austrália');

  // --- GROUP E ---
  // Alemanha, Curaçao, Costa do Marfim, Equador
  addMatch('E', '14/06 - 14H', LOCS.HOU, 'Alemanha', 'Curaçao');
  addMatch('E', '14/06 - 20H', LOCS.PHI, 'Costa do Marfim', 'Equador');
  addMatch('E', '20/06 - 17H', LOCS.TOR, 'Alemanha', 'Costa do Marfim');
  addMatch('E', '20/06 - 21H', LOCS.KC, 'Equador', 'Curaçao');
  addMatch('E', '25/06 - 17H', LOCS.NYC, 'Equador', 'Alemanha');
  addMatch('E', '25/06 - 17H', LOCS.PHI, 'Curaçao', 'Costa do Marfim');

  // --- GROUP F ---
  // Holanda, Japão, UEFA B, Tunísia
  addMatch('F', '14/06 - 17H', LOCS.DAL, 'Holanda', 'Japão');
  addMatch('F', '14/06 - 23H', LOCS.MON, 'UEFA B', 'Tunísia');
  addMatch('F', '20/06 - 01H', LOCS.MON, 'Tunísia', 'Japão');
  addMatch('F', '20/06 - 14H', LOCS.HOU, 'Holanda', 'UEFA B');
  addMatch('F', '25/06 - 20H', LOCS.KC, 'Tunísia', 'Holanda');
  addMatch('F', '25/06 - 20H', LOCS.DAL, 'Japão', 'UEFA B');

  // --- GROUP G ---
  // Bélgica, Irã, Nova Zelândia, Egito
  addMatch('G', '15/06 - 16H', LOCS.SEA, 'Bélgica', 'Egito');
  addMatch('G', '15/06 - 22H', LOCS.LA, 'Irã', 'Nova Zelândia');
  addMatch('G', '21/06 - 16H', LOCS.LA, 'Bélgica', 'Irã');
  addMatch('G', '21/06 - 22H', LOCS.VAN, 'Nova Zelândia', 'Egito');
  addMatch('G', '27/06 - 00H', LOCS.VAN, 'Nova Zelândia', 'Bélgica');
  addMatch('G', '27/06 - 00H', LOCS.SEA, 'Egito', 'Irã');

  // --- GROUP H ---
  // Espanha, Cabo Verde, Arábia Saudita, Uruguai
  addMatch('H', '15/06 - 13H', LOCS.ATL, 'Espanha', 'Cabo Verde');
  addMatch('H', '15/06 - 19H', LOCS.MIA, 'Arábia Saudita', 'Uruguai');
  addMatch('H', '21/06 - 13H', LOCS.ATL, 'Espanha', 'Arábia Saudita');
  addMatch('H', '21/06 - 19H', LOCS.MIA, 'Uruguai', 'Cabo Verde');
  addMatch('H', '26/06 - 21H', LOCS.GUA, 'Uruguai', 'Espanha');
  addMatch('H', '26/06 - 21H', LOCS.HOU, 'Cabo Verde', 'Arábia Saudita');

  // --- GROUP I ---
  // França, Senegal, FIFA 2, Noruega
  addMatch('I', '16/06 - 16H', LOCS.NYC, 'França', 'Senegal');
  addMatch('I', '16/06 - 19H', LOCS.BOS, 'FIFA 2', 'Noruega');
  addMatch('I', '22/06 - 18H', LOCS.PHI, 'França', 'FIFA 2');
  addMatch('I', '22/06 - 21H', LOCS.NYC, 'Noruega', 'Senegal');
  addMatch('I', '26/06 - 16H', LOCS.BOS, 'Noruega', 'França');
  addMatch('I', '26/06 - 16H', LOCS.TOR, 'Senegal', 'FIFA 2');

  // --- GROUP J ---
  // Argentina, Argélia, Áustria, Jordânia
  addMatch('J', '16/06 - 22H', LOCS.KC, 'Argentina', 'Argélia');
  addMatch('J', '17/06 - 01H', LOCS.SF, 'Áustria', 'Jordânia');
  addMatch('J', '22/06 - 14H', LOCS.DAL, 'Argentina', 'Áustria');
  addMatch('J', '23/06 - 00H', LOCS.SF, 'Jordânia', 'Argélia');
  addMatch('J', '27/06 - 23H', LOCS.DAL, 'Jordânia', 'Argentina');
  addMatch('J', '27/06 - 23H', LOCS.KC, 'Argélia', 'Áustria');

  // --- GROUP K ---
  // Portugal, FIFA 1, Uzbequistão, Colômbia
  addMatch('K', '17/06 - 14H', LOCS.HOU, 'Portugal', 'FIFA 1');
  addMatch('K', '17/06 - 23H', LOCS.MEX, 'Uzbequistão', 'Colômbia');
  addMatch('K', '23/06 - 14H', LOCS.HOU, 'Portugal', 'Uzbequistão');
  addMatch('K', '23/06 - 23H', LOCS.GUA, 'Colômbia', 'FIFA 1');
  addMatch('K', '27/06 - 20H', LOCS.MIA, 'Colômbia', 'Portugal');
  addMatch('K', '27/06 - 20H', LOCS.ATL, 'FIFA 1', 'Uzbequistão');

  // --- GROUP L ---
  // Inglaterra, Gana, Croácia, Panamá
  addMatch('L', '17/06 - 17H', LOCS.DAL, 'Inglaterra', 'Croácia');
  addMatch('L', '17/06 - 20H', LOCS.TOR, 'Gana', 'Panamá');
  addMatch('L', '23/06 - 17H', LOCS.BOS, 'Inglaterra', 'Gana');
  addMatch('L', '23/06 - 20H', LOCS.TOR, 'Panamá', 'Croácia');
  addMatch('L', '27/06 - 18H', LOCS.NYC, 'Panamá', 'Inglaterra');
  addMatch('L', '27/06 - 18H', LOCS.PHI, 'Croácia', 'Gana');

  return matches;
};

export const MOCK_MATCHES = generateSchedule();