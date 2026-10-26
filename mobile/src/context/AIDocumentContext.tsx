import React, { createContext, useContext } from 'react';

export interface AIDocument {
  id: string;
  title: string;
  subject: string;
}

const AIDocumentContext = createContext<AIDocument | undefined>(undefined);

// The AI tools stack is opened from one document; every tool screen reads it from here
export const AIDocumentProvider = AIDocumentContext.Provider;

export const useAIDocument = () => {
  const context = useContext(AIDocumentContext);
  if (!context) {
    throw new Error('useAIDocument must be used within an AIDocumentProvider');
  }
  return context;
};
