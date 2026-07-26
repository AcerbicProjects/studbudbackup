// backend/services/prompts/prompt.builder.ts
// Reusable Prompt Builder for all AI learning modules

export type PromptModule = 'summary' | 'flashcards' | 'quiz' | 'viva' | 'chat' | 'planner';

export interface PromptOptions {
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  count?: number;           // number of items (flashcards, quiz questions, etc.)
  language?: string;        // e.g. 'English', 'Bengali'
  documentTitle?: string;
  userMessage?: string;     // for chat
  chatHistory?: Array<{ role: 'user' | 'model'; text: string }>;
  focusAreas?: string[];    // specific topics to prioritise
  examType?: string;        // e.g. 'MCQ', 'short-answer', 'viva'
  studyGoal?: string;       // for planner
  availableHours?: number;  // for planner
  examDate?: string;        // for planner
  weakTopics?: string[];    // for planner
  preferredStudyTime?: string; // for planner
  vivaDepth?: 'surface' | 'conceptual' | 'deep';
  summaryLength?: 'short' | 'medium' | 'detailed';
}

const JSON_OUTPUT_INSTRUCTION = `
CRITICAL OUTPUT RULES:
- Respond ONLY with valid, minified JSON.
- Do NOT include markdown code fences, explanations, or any text outside the JSON.
- Do NOT wrap the JSON in \`\`\`json blocks.
- Start your response with { or [ directly.
`;

class PromptBuilder {
  // ── Summary ────────────────────────────────────────────────────────────────
  buildSummaryPrompt(documentText: string, options: PromptOptions = {}): string {
    const { subject = 'General', difficulty = 'intermediate', documentTitle = 'Document', language = 'English', summaryLength = 'medium' } = options;

    return `You are an expert academic tutor specializing in creating concise, insightful study summaries.

Document Title: "${documentTitle}"
Subject: ${subject}
Target Level: ${difficulty}
Summary Length: ${summaryLength}
Output Language: ${language}

Document Content:
"""
${documentText}
"""

Create a comprehensive study summary of the document above.
The summary should be ${summaryLength === 'short' ? 'brief and concise' : summaryLength === 'medium' ? 'balanced with key details' : 'highly detailed and exhaustive'}.
Crucially, you MUST divide your summary page by page (or logical section by section if page numbers are not explicitly clear) and output it in the pageSummaries array. Each item in the array must correspond to one page or sequential block of the document.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "title": "string – a compelling title for this summary",
  "overview": "string – 2-3 sentence high-level overview of the entire document",
  "keyConcepts": ["string", "string", "..."],
  "definitions": [
    {
      "term": "string",
      "meaning": "string"
    }
  ],
  "examples": [
    {
      "concept": "string",
      "example": "string"
    }
  ],
  "importantPoints": ["string"],
  "formulaCards": [
    {
      "name": "string",
      "formula": "string",
      "explanation": "string"
    }
  ],
  "pageSummaries": [
    {
      "pageNumber": number,
      "title": "string - title of page/section",
      "points": ["string - brief bullet points summarizing this specific page"]
    }
  ],
  "revisionNotes": ["string – quick bite-sized notes for revision"],
  "examTips": ["string – insights on what might appear in an exam"],
  "estimatedReadTimeMinutes": number
}`;
  }

  // ── Flashcards ─────────────────────────────────────────────────────────────
  buildFlashcardsPrompt(documentText: string, options: PromptOptions = {}): string {
    const {
      subject = 'General',
      difficulty = 'intermediate',
      count = 15,
      documentTitle = 'Document',
      language = 'English',
    } = options;

    return `You are an expert educator creating high-quality study flashcards using evidence-based learning techniques.

Document Title: "${documentTitle}"
Subject: ${subject}
Target Level: ${difficulty}
Number of Flashcards: ${count}
Output Language: ${language}

Document Content:
"""
${documentText}
"""

Generate exactly ${count} flashcards covering the most important concepts, definitions, formulas, and key facts.
Ensure the cards test understanding, not just memory. Shuffle and randomize the focus across the entire document.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "subject": "string",
  "totalCards": number,
  "flashcards": [
    {
      "id": number,
      "front": "string – clear, specific question or prompt",
      "back": "string – concise, accurate answer",
      "difficulty": "easy | medium | hard",
      "topic": "string – topic/subtopic this card belongs to",
      "tags": ["string"],
      "isBookmarked": boolean,
      "spacedRepetition": {
        "nextReviewDate": "string – ISO date, typically tomorrow",
        "interval": number,
        "easeFactor": number
      }
    }
  ]
}`;
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  buildQuizPrompt(documentText: string, options: PromptOptions = {}): string {
    const {
      subject = 'General',
      difficulty = 'intermediate',
      count = 10,
      documentTitle = 'Document',
      language = 'English',
      examType = 'MCQ',
    } = options;

    return `You are an expert exam paper setter creating rigorous, fair quiz questions.

Document Title: "${documentTitle}"
Subject: ${subject}
Target Level: ${difficulty}
Number of Questions: ${count}
Output Language: ${language}

Document Content:
"""
${documentText}
"""

Generate exactly ${count} Multiple Choice Questions based on the provided document.
Ensure questions test genuine understanding, not just terminology.
Include questions of varying difficulty.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "subject": "string",
  "totalQuestions": number,
  "estimatedTimeMinutes": number,
  "questions": [
    {
      "id": number,
      "type": "mcq",
      "question": "string – the question text",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string – exactly matching one of the items in the options array",
      "explanation": "string – why this is the correct answer, referencing the document",
      "topic": "string",
      "difficulty": "easy | medium | hard",
      "estimatedTimeMinutes": number
    }
  ]
}`;
  }

  // ── Quiz Scoring ───────────────────────────────────────────────────────────
  buildQuizScoringPrompt(documentText: string, quizContext: string, userAnswers: string): string {
    return `You are an expert academic evaluator.

Document Content:
"""
${documentText}
"""

Quiz Context:
"""
${quizContext}
"""

User Answers:
"""
${userAnswers}
"""

Grade the user's answers against the quiz and document context. Be fair but strict. 
Crucially, when suggesting revisions or weak topics, you MUST explicitly cite specific page numbers, sections, or paragraphs from the document context where the student struggled, so they know exactly where to focus more.
Focus your specific feedback entirely on diagnosing the user's incorrect answers based on the document context.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "score": number, // total marks obtained
  "total": number, // maximum possible marks
  "accuracy": number, // percentage 0-100
  "weakTopics": ["string"],
  "suggestedRevision": ["string - actionable advice"],
  "confidenceLevel": "low | medium | high"
}`;
  }

  // ── Viva ───────────────────────────────────────────────────────────────────
  buildVivaPrompt(documentText: string, options: PromptOptions = {}): string {
    const {
      subject = 'General',
      difficulty = 'intermediate',
      count = 10,
      documentTitle = 'Document',
      language = 'English',
      vivaDepth = 'conceptual',
    } = options;

    return `You are a strict but fair academic examiner conducting an oral viva examination.

Document Title: "${documentTitle}"
Subject: ${subject}
Academic Level: ${difficulty}
Number of Questions: ${count}
Examination Depth: ${vivaDepth}
Output Language: ${language}

Document Content:
"""
${documentText}
"""

Generate ${count} viva questions that probe deep conceptual understanding. 
Include follow-up questions that would naturally arise from each answer.
Questions should progress from foundational to analytical to application-based.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "subject": "string",
  "totalQuestions": number,
  "vivaSession": [
    {
      "id": number,
      "question": "string – the primary viva question",
      "expectedAnswer": "string – a model answer demonstrating deep understanding",
      "hints": ["string – guidance if student gets stuck"],
      "followUpQuestions": ["string – follow-up if student answers correctly", "string – probe if student hesitates"],
      "keyConceptsTested": ["string"],
      "difficulty": "easy | medium | hard",
      "marks": number,
      "commonMistakes": ["string – pitfalls to avoid"],
      "topic": "string"
    }
  ]
}`;
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  buildChatSystemPrompt(documentText: string, options: PromptOptions = {}): string {
    const { subject = 'General', documentTitle = 'Document', language = 'English' } = options;
    return `You are StudyBuddy AI, an expert and friendly academic tutor. 
You help students understand their study materials through clear explanations, examples, and guided questioning.

You have been given the following study document to answer questions about:

Document Title: "${documentTitle}"
Subject: ${subject}

Document Content:
"""
${documentText}
"""

RULES:
- Explain concepts clearly and simplify difficult topics. Provide examples and generate analogies where helpful.
- Answer questions based ONLY on the provided document.
- If the answer is unavailable in the document, you MUST clearly state: "I couldn't find this in your uploaded document."
- Keep responses concise but thorough.
- Respond in ${language}.
- Do NOT fabricate information not in the document.

You must respond in strict JSON format.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "reply": "string - your actual chat response (can contain markdown)",
  "suggestedFollowUps": ["string", "string", "string"] // exactly 3 follow-up questions
}`;
  }

  buildChatUserContent(
    userMessage: string,
    chatHistory?: Array<{ role: 'user' | 'model'; text: string }>
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (chatHistory && chatHistory.length > 0) {
      for (const turn of chatHistory) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });
    return contents;
  }

  // ── Study Planner ──────────────────────────────────────────────────────────
  buildPlannerPrompt(documentText: string, options: PromptOptions = {}): string {
    const {
      subject = 'General',
      documentTitle = 'Document',
      studyGoal = 'Master the material',
      availableHours = 10,
      examDate,
      weakTopics = [],
      preferredStudyTime = 'Morning',
    } = options;

    return `You are an expert academic coach creating a personalised study plan.

Document Title: "${documentTitle}"
Subject: ${subject}
Student's Goal: ${studyGoal}
Available Study Hours: ${availableHours} hours total
Preferred Study Time: ${preferredStudyTime}
Weak Topics: ${weakTopics.join(', ') || 'None specified'}
${examDate ? `Exam Date: ${examDate}` : ''}

Document Content:
"""
${documentText}
"""

Create a detailed, achievable study plan that covers all key topics from the document. Integrate regular breaks, revision sessions, and prioritize weak topics.
${JSON_OUTPUT_INSTRUCTION}

Return EXACTLY this JSON structure:
{
  "planTitle": "string",
  "subject": "string",
  "totalHours": number,
  "priorityTopics": ["string"],
  "breakRecommendations": ["string"],
  "dailyPlan": [
    {
      "day": number,
      "tasks": ["string (e.g. 'Read section 2', 'Create flashcards')"],
      "durationMinutes": number
    }
  ],
  "weeklyPlan": [
    {
      "week": number,
      "focusAreas": ["string"],
      "milestones": ["string"]
    }
  ],
  "revisionSessions": [
    {
      "sessionTitle": "string",
      "topics": ["string"],
      "durationMinutes": number
    }
  ]
}`;
  }
}

export const promptBuilder = new PromptBuilder();
