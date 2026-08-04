import { useDiscussions } from "../../hooks/useDiscussions";

type ConnectButtonProps = {
  title?: string;
};

export default function ConnectButton({ title = "Connect" }: ConnectButtonProps) {
  const { connecting, setConnecting, onRequestConnect, components } = useDiscussions();

  async function connect() {
    if (connecting) return;
    setConnecting?.(true);
    try {
      await onRequestConnect?.();
    } finally {
      setConnecting?.(false);
    }
  }

  if (components.ConnectButton) {
    const HostConnectButton = components.ConnectButton;
    return <HostConnectButton onClick={() => void connect()} disabled={connecting} isLoading={connecting} />;
  }

  const Button = components.Button;
  return (
    <Button variant="primary" onClick={() => void connect()} disabled={connecting} isLoading={connecting}>
      {title}
    </Button>
  );
}
