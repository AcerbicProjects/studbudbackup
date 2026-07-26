import { PromptOptions } from '../prompts/prompt.builder';

// Simple versioning map – can be extended to DB or config service
const PROMPT_VERSIONS: Record<string, number> = {
    summary: 1,
    flashcards: 1,
    quiz: 1,
    viva: 1,
    chat: 1,
};

export function getPromptVersion(tool: keyof typeof PROMPT_VERSIONS): number {
    return PROMPT_VERSIONS[tool] ?? 1;
}

export function buildVersionedKey(tool: string, documentId: string, opts: PromptOptions): string {
    const version = getPromptVersion(tool as any);
    const optsKey = Object.entries(opts)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
        .join('|');
    return `${tool}:v${version}:${documentId}:${optsKey}`;
}
