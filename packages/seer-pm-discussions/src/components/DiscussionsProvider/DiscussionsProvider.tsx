import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { DiscussionsContext } from "../../contexts/DiscussionsContext";
import type { DiscussionComponents, DiscussionUser, DiscussionsClient } from "../../types";
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

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  const { data: username } = useQuery({
    queryKey: ["seer-discussions-username", client.baseUrl ?? client.marketId, user?.address.toLowerCase()],
    queryFn: () => client.getUsername!(user!.address),
    enabled: Boolean(user && !user.username && client.getUsername),
    staleTime: 60_000,
  });
  const identity = user ? { ...user, ...(username && !user.username ? { username } : {}) } : null;
  const resolvedUser = identity
    ? { ...identity, profileHref: identity.profileHref ?? client.getProfileHref?.(identity) ?? null }
    : null;

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
        user: resolvedUser,
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
