import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useUser = () => {
  return useContext(AuthContext);
};