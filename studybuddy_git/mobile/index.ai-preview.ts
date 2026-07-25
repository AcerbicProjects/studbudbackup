import { registerRootComponent } from 'expo';

import AIPreviewApp from './App.ai-preview';

// Alternate entry point used only to preview the AI Learning Module in
// isolation (see App.ai-preview.tsx). Does not replace or touch index.ts.
registerRootComponent(AIPreviewApp);
