import { TypedUseSelectorHook, useSelector as useReduxSelector } from "react-redux";
import type { RootState } from "store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
