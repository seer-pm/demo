import { type ReactNode, useEffect, useMemo, useState } from "react";
import { DiscussionsContext } from "../../contexts/DiscussionsContext";
import type { DiscussionComponents, DiscussionPosition, DiscussionUser, DiscussionsClient } from "../../types";
import DefaultButton from "../DefaultButton";
import DefaultUserPositionBadge from "../UserPositionBadge/UserPositionBadge";

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
  const [positionsByAddress, setPositionsByAddress] = useState<Map<string, DiscussionPosition[]>>(new Map());

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  useEffect(() => {
    let active = true;
    setPositionsByAddress(new Map());
    void client
      .listCommenterPositions(user?.address)
      .then((positions) => {
        if (active) setPositionsByAddress(positions);
      })
      .catch((error) => {
        console.error("Failed to load commenter positions:", error);
      });
    return () => {
      active = false;
    };
  }, [client, user?.address]);

  const components = useMemo(
    () => ({
      Button: componentsProp?.Button ?? DefaultButton,
      ConnectButton: componentsProp?.ConnectButton,
      UserPositionBadge: componentsProp?.UserPositionBadge ?? DefaultUserPositionBadge,
    }),
    [componentsProp?.Button, componentsProp?.ConnectButton, componentsProp?.UserPositionBadge],
  );

  return (
    <DiscussionsContext.Provider
      value={{
        user,
        setUser,
        connecting,
        setConnecting,
        client,
        positionsByAddress,
        onRequestConnect: onRequestConnect ?? null,
        components,
      }}
    >
      {children}
    </DiscussionsContext.Provider>
  );
}
