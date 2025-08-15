import { ArrowDown } from "@/lib/icons";

export default function SwapUI() {
  return (
    <div className="max-w-sm mx-auto mt-10 p-4 bg-white rounded-2xl shadow-lg space-y-4">
      {/* Sell Section */}
      <div className="bg-gray-50 p-4 rounded-xl border">
        <div className="text-sm text-gray-600 mb-1">Sell</div>
        <div className="flex items-center justify-between">
          <input type="number" value="0" className="text-3xl font-light w-full bg-transparent outline-none" readOnly />
          <div className="ml-2 flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm cursor-pointer">
            <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=030" alt="ETH" className="w-5 h-5" />
            <span className="font-semibold">ETH</span>
            <span className="text-gray-500">▼</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">$0</div>
        <div className="text-sm text-gray-500 mt-1 text-right">0.00378 ETH</div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-full shadow">
          <ArrowDown />
        </div>
      </div>

      {/* Buy Section */}
      <div className="bg-gray-50 p-4 rounded-xl border">
        <div className="text-sm text-gray-600 mb-1">Buy</div>
        <div className="flex items-center justify-between">
          <input type="number" value="0" className="text-3xl font-light w-full bg-transparent outline-none" readOnly />
          <div className="ml-2 flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm cursor-pointer">
            <img src="https://cryptologos.cc/logos/tether-usdt-logo.png?v=030" alt="USDT" className="w-5 h-5" />
            <span className="font-semibold">USDT</span>
            <span className="text-gray-500">▼</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">$0</div>
      </div>
    </div>
  );
}
