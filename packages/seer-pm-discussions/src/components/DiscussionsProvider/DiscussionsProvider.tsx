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

/** Provides discussion state and resolves missing usernames through the app's query cache. */
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

  // A host-supplied username is authoritative, so the lookup only runs when the host gave an address
  // alone. The key shares the app's `publicUser` prefix so a username change on the profile page
  // invalidates this entry too.
  const lookupEnabled = Boolean(user && !user.username);
  const { data: lookedUp } = useQuery({
    queryKey: ["publicUser", "seer-discussions-username", client.baseUrl, user?.address.toLowerCase()],
    queryFn: () => client.getUsername(user!.address),
    enabled: lookupEnabled,
    staleTime: 60_000,
  });

  // The query keeps returning cached data while disabled, so read it only when the lookup applies.
  const username = user?.username ?? (lookupEnabled ? (lookedUp ?? undefined) : undefined);
  const identity: DiscussionUser | null = user ? { ...user, ...(username ? { username } : {}) } : null;
  const resolvedUser = identity
    ? { ...identity, profileHref: identity.profileHref ?? client.getProfileHref(identity) }
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
