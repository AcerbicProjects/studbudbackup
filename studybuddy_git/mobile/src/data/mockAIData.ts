// src/data/mockAIData.ts
// Week 1 mock content for the AI Learning Module (Person 3).
// All screens run on this local data until the backend routes exist (Week 3+).

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ChatMessage = {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: string; // ISO date
};

export type FlashcardData = {
    id: string;
    front: string;
    back: string;
    difficulty: Difficulty;
    bookmarked: boolean;
};

export type QuizQuestionType = 'mcq' | 'truefalse' | 'short';

export type QuizQuestion = {
    id: string;
    type: QuizQuestionType;
    difficulty: Difficulty;
    question: string;
    options?: string[]; // mcq: 4 options, truefalse: ['True', 'False']
    correctAnswer: string;
    explanation: string;
};

export type SummarySection = {
    id: string;
    title: string;
    icon: string; // MaterialCommunityIcons name
    points: string[];
};

export type FormulaData = {
    id: string;
    title: string;
    formula: string;
    note: string;
};

export type VivaQuestion = {
    id: string;
    question: string;
    answer: string;
    difficulty: Difficulty;
    bookmarked: boolean;
};

// ---------------------------------------------------------------------------
// AI Chat
// ---------------------------------------------------------------------------

export const mockChatMessages: ChatMessage[] = [
    {
        id: 'm1',
        role: 'ai',
        text: "Hi! I've read **Physics Notes Chapter 4**. Ask me anything about work, energy, or power and I'll explain it from your notes.",
        timestamp: '2026-07-12T10:00:00Z',
    },
    {
        id: 'm2',
        role: 'user',
        text: 'What is the work-energy theorem?',
        timestamp: '2026-07-12T10:01:00Z',
    },
    {
        id: 'm3',
        role: 'ai',
        text: 'The **work-energy theorem** states that the net work done on an object equals its change in kinetic energy:\n\n`W_net = ΔKE = ½mv² − ½mu²`\n\nIn your notes (page 12), the example shows a 2 kg block accelerated from rest to 3 m/s, so the net work done is **9 J**.',
        timestamp: '2026-07-12T10:01:20Z',
    },
];

export const mockSuggestedPrompts: string[] = [
    'Summarize this chapter in 5 points',
    'Explain kinetic vs potential energy',
    'Give me an example problem on power',
    'What formulas should I memorize?',
];

// Canned responses cycled through when the user sends a message (Week 1 only —
// replaced by the real /chat endpoint in Week 3).
export const mockCannedResponses: string[] = [
    "Good question! Based on your notes, **power** is the rate of doing work: `P = W / t`. The worked example on page 15 computes a motor lifting 50 kg through 10 m in 5 s → P = (50 × 9.8 × 10) / 5 = **980 W**.",
    "From Chapter 4: **potential energy** is stored energy due to position (`PE = mgh`), while **kinetic energy** is energy of motion (`KE = ½mv²`). They interconvert — like the pendulum diagram in your notes.",
    "Here's a quick recap from your notes:\n\n1. Work is force × displacement in the force's direction\n2. Energy is the capacity to do work\n3. Power is work done per unit time\n4. Mechanical energy is conserved without friction\n5. The work-energy theorem links net work to ΔKE",
];

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export const mockSummaryMeta = {
    documentTitle: 'Physics Notes Chapter 4',
    subject: 'Physics',
    readTime: '4 min read',
    generatedAt: '2026-07-12T10:05:00Z',
};

export const mockSummaryOverview =
    'Chapter 4 covers work, energy, and power — how forces transfer energy to objects, the different forms mechanical energy takes, and how quickly that energy is converted. It builds toward the conservation of mechanical energy and closes with real-world efficiency examples.';

export const mockSummarySections: SummarySection[] = [
    {
        id: 's1',
        title: 'Key Concepts',
        icon: 'lightbulb-on-outline',
        points: [
            'Work is done when a force moves an object through a displacement.',
            'Energy is the capacity to do work; it is scalar and measured in joules.',
            'Power measures how fast work is done (joules per second = watts).',
            'Mechanical energy = kinetic energy + potential energy.',
        ],
    },
    {
        id: 's2',
        title: 'Definitions',
        icon: 'book-open-variant',
        points: [
            'Work (W): product of force and displacement along the force direction, W = F·d·cosθ.',
            'Kinetic Energy (KE): energy of motion, KE = ½mv².',
            'Potential Energy (PE): stored energy due to position, PE = mgh.',
            'Power (P): rate of energy transfer, P = W/t.',
        ],
    },
    {
        id: 's3',
        title: 'Important Points',
        icon: 'alert-circle-outline',
        points: [
            'Work is zero when force is perpendicular to displacement (θ = 90°).',
            'Negative work removes energy from a system (e.g., friction).',
            'Conservation of mechanical energy only holds without non-conservative forces.',
            'Efficiency is always less than 100% in real machines.',
        ],
    },
    {
        id: 's4',
        title: 'Examples',
        icon: 'flask-outline',
        points: [
            'A 2 kg block accelerated from rest to 3 m/s → net work = 9 J.',
            'Motor lifting 50 kg through 10 m in 5 s → power = 980 W.',
            'Pendulum: PE at the extremes converts fully to KE at the lowest point.',
        ],
    },
    {
        id: 's5',
        title: 'Takeaways',
        icon: 'star-outline',
        points: [
            'Always resolve the force along the displacement before computing work.',
            'Check energy conservation to validate answers quickly in MCQs.',
            'Watch units: J for work/energy, W for power.',
        ],
    },
];

export const mockFormulas: FormulaData[] = [
    { id: 'f1', title: 'Work', formula: 'W = F · d · cosθ', note: 'θ is the angle between force and displacement' },
    { id: 'f2', title: 'Kinetic Energy', formula: 'KE = ½ m v²', note: 'Scalar; never negative' },
    { id: 'f3', title: 'Potential Energy', formula: 'PE = m g h', note: 'h measured from the reference level' },
    { id: 'f4', title: 'Power', formula: 'P = W / t = F · v', note: 'Second form holds for constant velocity' },
];

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export const mockFlashcards: FlashcardData[] = [
    {
        id: 'c1',
        front: 'What is the SI unit of work?',
        back: 'The joule (J). 1 J = 1 N·m — the work done by a 1 N force over 1 m.',
        difficulty: 'easy',
        bookmarked: false,
    },
    {
        id: 'c2',
        front: 'State the work-energy theorem.',
        back: 'Net work done on an object equals its change in kinetic energy: W_net = ΔKE.',
        difficulty: 'medium',
        bookmarked: true,
    },
    {
        id: 'c3',
        front: 'When is work done by a force zero despite motion?',
        back: 'When the force is perpendicular to displacement (θ = 90°, cosθ = 0) — e.g., gravity on a horizontally moving object.',
        difficulty: 'medium',
        bookmarked: false,
    },
    {
        id: 'c4',
        front: 'Why is mechanical energy not conserved with friction?',
        back: 'Friction is a non-conservative force — it converts mechanical energy into heat, so KE + PE decreases.',
        difficulty: 'hard',
        bookmarked: false,
    },
    {
        id: 'c5',
        front: 'Give the two formulas for power.',
        back: 'P = W / t (work per time) and P = F · v (force × velocity, at constant velocity).',
        difficulty: 'easy',
        bookmarked: false,
    },
    {
        id: 'c6',
        front: 'A pendulum at its highest point: what energy does it have?',
        back: 'Maximum potential energy and zero kinetic energy (momentarily at rest). It converts to KE as it swings down.',
        difficulty: 'easy',
        bookmarked: false,
    },
];

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export const mockQuizMeta = {
    documentTitle: 'Physics Notes Chapter 4',
    totalTimeSeconds: 300,
};

export const mockQuizQuestions: QuizQuestion[] = [
    {
        id: 'q1',
        type: 'mcq',
        difficulty: 'easy',
        question: 'What is the SI unit of power?',
        options: ['Joule', 'Watt', 'Newton', 'Pascal'],
        correctAnswer: 'Watt',
        explanation: 'Power is work per unit time; 1 watt = 1 joule per second.',
    },
    {
        id: 'q2',
        type: 'truefalse',
        difficulty: 'easy',
        question: 'Work done can be negative.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'When force opposes displacement (like friction), work done is negative.',
    },
    {
        id: 'q3',
        type: 'mcq',
        difficulty: 'medium',
        question: 'A 2 kg object moving at 3 m/s has kinetic energy of:',
        options: ['3 J', '6 J', '9 J', '18 J'],
        correctAnswer: '9 J',
        explanation: 'KE = ½mv² = ½ × 2 × 3² = 9 J.',
    },
    {
        id: 'q4',
        type: 'mcq',
        difficulty: 'medium',
        question: 'Which force is non-conservative?',
        options: ['Gravity', 'Spring force', 'Friction', 'Electrostatic force'],
        correctAnswer: 'Friction',
        explanation: 'Work done by friction depends on the path taken, so it is non-conservative.',
    },
    {
        id: 'q5',
        type: 'short',
        difficulty: 'hard',
        question: 'A motor lifts 50 kg through 10 m in 5 s (g = 9.8 m/s²). What is its power output in watts?',
        correctAnswer: '980',
        explanation: 'P = mgh / t = (50 × 9.8 × 10) / 5 = 980 W.',
    },
];

// ---------------------------------------------------------------------------
// Viva
// ---------------------------------------------------------------------------

export const mockVivaQuestions: VivaQuestion[] = [
    {
        id: 'v1',
        question: 'Explain the difference between work and power in your own words.',
        answer: 'Work is the energy transferred when a force moves an object — it does not care how long that takes. Power is how fast that work happens. Lifting a box slowly or quickly is the same work, but the quick lift needs more power.',
        difficulty: 'easy',
        bookmarked: false,
    },
    {
        id: 'v2',
        question: 'Why is no work done by the centripetal force in circular motion?',
        answer: 'The centripetal force always points toward the center, perpendicular to the velocity (and displacement) of the object. Since W = F·d·cosθ and θ = 90°, the work done is zero.',
        difficulty: 'medium',
        bookmarked: false,
    },
    {
        id: 'v3',
        question: 'Can kinetic energy ever be negative? Justify your answer.',
        answer: 'No. KE = ½mv² — mass is positive and v² is non-negative, so kinetic energy is always ≥ 0. Only the change in kinetic energy (ΔKE) can be negative.',
        difficulty: 'medium',
        bookmarked: true,
    },
    {
        id: 'v4',
        question: 'A real machine is 60% efficient. Where does the remaining 40% of the input energy go?',
        answer: 'It is lost to non-conservative effects — mostly heat from friction, plus sound and vibration. Energy is still conserved overall; it just leaves the useful mechanical form.',
        difficulty: 'hard',
        bookmarked: false,
    },
    {
        id: 'v5',
        question: 'How would you verify the conservation of mechanical energy experimentally?',
        answer: 'Use a pendulum or a ball on a frictionless track: measure height (for PE = mgh) and speed at several points (for KE = ½mv²) and show KE + PE stays approximately constant, attributing small losses to air resistance and friction.',
        difficulty: 'hard',
        bookmarked: false,
    },
];

// AI feedback shown on the result screen (Week 1 placeholder — Gemini will
// generate this from the actual answers in Week 4).
export const mockQuizFeedback =
    "Strong grasp of definitions and unit conversions! You handled the energy formulas well. Focus your revision on non-conservative forces — the friction question tripped you up. Try re-reading the 'Important Points' section of your summary and retake the quiz on hard difficulty.";
