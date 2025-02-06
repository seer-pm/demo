function DepositTab() {
  return (
    <iframe
      allow="usb; ethereum; clipboard-write; payment; microphone; camera"
      loading="lazy"
      src="https://widget.mtpelerin.com/?lang=en&_ctkn=bec6626e-8913-497d-9835-6e6ae9edb144&&tab=buy&type=web&primary=%234267B3&ssc=XDAI&sdc=EUR&net=xdai_mainnet&crys=XDAI&chain=xdai_mainnet&bsc=EUR&bdc=XDAI"
      title="Mt Pelerin exchange widget"
      className="w-full"
      style={{ height: "100vh" }}
      onLoad={(e) => {
        const iframe = e.target as HTMLIFrameElement;
        if (iframe.contentWindow) {
          iframe.style.height = `${iframe.contentWindow.document.documentElement.scrollHeight}px`;
        }
      }}
    ></iframe>
  );
}

export default DepositTab;
