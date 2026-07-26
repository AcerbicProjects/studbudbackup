# StudyBuddy AI Architecture

This document describes the production-ready Google Gemini integration for the StudyBuddy platform.

## Overview
The AI Engine uses a composable architecture driven by **Google Gemini (GenAI)** to parse, extract, and dynamically generate academic study content (Flashcards, Quizzes, Vivas, Summaries, and Planners) directly from OCR-scanned PDFs and notes.

## Architecture Pipeline
Every AI generation follows a strict pipeline mediated by \`AIService\`:
1. **Context Manager (Compression & Search)**: Retrieves the OCR-extracted document text. For large documents, it applies semantic chunking and cosine-similarity vector retrieval to reduce context window latency and costs.
2. **Prompt Builder (Optimization & Versioning)**: Constructs precise prompts using Socratic methods. It strictly enforces token reduction SRO (Structured Response Optimization) SRO constraints.
3. **Gemini Client (Execution & Monitoring)**: Wraps the \`@google/generative-ai\` SDK with exponential backoff (up to 3 retries), automated timeout management, safety overrides, and token-bucket rate limits.
4. **AI Parser (Validation)**: Intercepts Gemini output, attempts salvage of malformed payloads via markdown stripping, and enforces strict Zod structural validation.
5. **AI Cache (Cost Optimization)**: Immediately caches validated output using an MD5-hashed query key against an in-memory TTL datastore, avoiding redundant API billing limit hits.

## Endpoints
Base URL: \`/api/ai\`
* \`POST /summary\` - Generates targeted chapter summaries (short/medium/detailed).
* \`POST /flashcards\` - Output strictly mapped flashcards with Spaced Repetition (Ease, Interval) metrics out of the box.
* \`POST /quiz\` - Generates mixed tests (MCQ, Short Answer, True/False, Fill in Blank)
* \`POST /quiz/score\` - Evaluates arbitrary test inputs against Document schemas.
* \`POST /viva\` - Simulates strict oral examinations with answer logic mapped to Follow-up questioning matrices.
* \`POST /study-planner\` - Cross-evaluates limits, weaknesses, and dates to return daily segmented workflows.
* \`POST /chat\` - (SSE Streaming Enabled) Context-enabled conversational bot prioritizing strict document-awareness overrides.

## Cost & Token Optimization Strategy
- **Caching**: 60-120 minute TTL on core endpoints.
- **Context Injection Limit**: The ContextManager truncates or semantically retrieves text prior to the model.
- **Monitoring**: All requests log processing time (ms) and are guarded by an application-layer throttling bucket.

## Prompts & Validation
All prompt generation relies exclusively on minified JSON rulesets natively enforcing zero-verbosity responses, massively decreasing output parsing times and output tokens billed.
