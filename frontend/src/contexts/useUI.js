import { useContext } from 'react';
import { UIContext } from './UIContextState';

export function useUI() {
  return useContext(UIContext);
}
