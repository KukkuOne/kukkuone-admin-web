import { useSearchParams } from 'react-router-dom';

/** One search param as state, so filters and open drawers deep-link and survive Back. */
export function useParam(key: string): [string | undefined, (v: string | undefined | null) => void] {
  const [params, setParams] = useSearchParams();
  const set = (v: string | undefined | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v) next.set(key, v);
        else next.delete(key);
        return next;
      },
      { replace: false },
    );
  return [params.get(key) ?? undefined, set];
}
