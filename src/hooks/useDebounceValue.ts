import { useState } from 'react';
import { useDebounce } from 'react-use';

function useDebounceValue<T>(value: T, delay: number): T {
  const [state, setState] = useState(value)
  useDebounce(
    () => setState(value),
    delay,
    [value]
  );
  return state
}

export default useDebounceValue;
