import { type ReactNode, useEffect, useMemo, useState } from "react";
import { DiscussionsContext } from "../../contexts/DiscussionsContext";
import type { DiscussionComponents, DiscussionUser, DiscussionsClient } from "../../types";
import DefaultButton from "../DefaultButton";

type DiscussionsProviderProps = {
  children: ReactNode;
  client: DiscussionsClient;
  user?: DiscussionUser | null;
  onRequestConnect?: () => Promise<void>;
  components?: DiscussionComponents;
};

export default function DiscussionsProvider({
  children,
  client,
  user: userProp = null,
  onRequestConnect,
  components: componentsProp,
}: DiscussionsProviderProps) {
  const [user, setUser] = useState<DiscussionUser | null>(userProp);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  const components = useMemo(
    () => ({
      Button: componentsProp?.Button ?? DefaultButton,
      ConnectButton: componentsProp?.ConnectButton,
    }),
    [componentsProp?.Button, componentsProp?.ConnectButton],
  );

  return (
    <DiscussionsContext.Provider
      value={{
        user,
        setUser,
        connecting,
        setConnecting,
        client,
        onRequestConnect: onRequestConnect ?? null,
        components,
      }}
    >
      {children}
    </DiscussionsContext.Provider>
  );
}
