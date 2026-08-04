import { useContext } from "react";
import { DiscussionsContext } from "../contexts/DiscussionsContext";

export function useDiscussions() {
  return useContext(DiscussionsContext);
}

export default useDiscussions;
