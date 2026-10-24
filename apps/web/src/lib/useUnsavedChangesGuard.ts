import { useBeforeUnload, useBlocker } from 'react-router';

/**
 * While `dirty`, leaving the page asks first: in-app navigation (links, Back)
 * through the returned blocker, and closing or reloading the tab through the
 * browser's own prompt.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useBeforeUnload((e) => {
    if (dirty) e.preventDefault();
  });

  return blocker;
}
