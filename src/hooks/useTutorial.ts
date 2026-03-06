import { useState, useCallback } from 'react';

export type TutorialStep =
  | 'select_piece'   // step 1: tap piece 0
  | 'place_piece'    // step 2: tap grid cell
  | 'clear_line'     // step 3: fill a line (just info, auto-advance)
  | 'done';

export interface TutorialState {
  step: TutorialStep;
  active: boolean;
}

export function useTutorial(skipTutorial: boolean) {
  const [tutorial, setTutorial] = useState<TutorialState>({
    step: skipTutorial ? 'done' : 'select_piece',
    active: !skipTutorial,
  });

  const advance = useCallback((to?: TutorialStep) => {
    setTutorial(prev => {
      if (!prev.active) return prev;
      const next = to ?? (
        prev.step === 'select_piece' ? 'place_piece'
        : prev.step === 'place_piece' ? 'clear_line'
        : 'done'
      );
      return { step: next, active: next !== 'done' };
    });
  }, []);

  const finish = useCallback(() => {
    setTutorial({ step: 'done', active: false });
  }, []);

  return { tutorial, advance, finish };
}
