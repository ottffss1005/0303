//useAlert.js

import { useCallback } from "react";

export const useAlert = () => {
  const showAlert = useCallback((message) => {
    window.alert(message);
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    if (window.confirm(message)) {
      onConfirm();
    }
  }, []);

  return { showAlert, showConfirm };
};