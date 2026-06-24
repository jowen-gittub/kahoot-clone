import type { Question, SessionSettings } from './types'

export type QuizDraft = {
  id: string
  name: string
  questions: Question[]
  settings: SessionSettings
  savedAt: string // ISO string
}

const KEY = 'kahootklone-drafts'

export function getDrafts(): QuizDraft[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveDraft(draft: QuizDraft): void {
  const drafts = getDrafts().filter(d => d.id !== draft.id)
  localStorage.setItem(KEY, JSON.stringify([{ ...draft, savedAt: new Date().toISOString() }, ...drafts]))
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(drafts))
}
