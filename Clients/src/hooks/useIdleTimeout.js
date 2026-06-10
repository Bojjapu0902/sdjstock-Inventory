import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

export function useIdleTimeout({ timeoutMs, onWarn, onIdle, warnBeforeMs = 60000, enabled = true }) {
  const idleRef  = useRef(null);
  const warnRef  = useRef(null);
  const onWarnRef = useRef(onWarn);
  const onIdleRef = useRef(onIdle);

  useEffect(() => { onWarnRef.current = onWarn; }, [onWarn]);
  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);

  const reset = useCallback(() => {
    clearTimeout(idleRef.current);
    clearTimeout(warnRef.current);
    if (!enabled || !timeoutMs) return;
    if (timeoutMs > warnBeforeMs) {
      warnRef.current = setTimeout(() => onWarnRef.current?.(), timeoutMs - warnBeforeMs);
    }
    idleRef.current = setTimeout(() => onIdleRef.current?.(), timeoutMs);
  }, [enabled, timeoutMs, warnBeforeMs]);

  useEffect(() => {
    if (!enabled || !timeoutMs) {
      clearTimeout(idleRef.current);
      clearTimeout(warnRef.current);
      return;
    }
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, reset, true));
    reset();
    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, reset, true));
      clearTimeout(idleRef.current);
      clearTimeout(warnRef.current);
    };
  }, [enabled, timeoutMs, reset]);

  return reset;
}
