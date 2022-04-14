import { useDispatch as useReduxDispatch } from "react-redux";
import type { AppDispatch } from "store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useDispatch = () => useReduxDispatch<AppDispatch>();
