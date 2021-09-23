import { useCallback, useMemo, useState } from "react";

// export function useUpdate() {
//   const [count, setCount] = useState(0)
//   return useCallback(() => setCount(count + 1), [count])
// }
export function useUpdate () {
  const [count, setCount] = useState(0);
  return useMemo(() => ({froceUpdate: () => setCount(count + 1)}), [count]);
}
