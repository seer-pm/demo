import { useCowOrders } from "@/hooks/portfolio/ordersTab/useCowOrders";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { endOfDay, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import OrdersTable from "./OrdersTable";

function OrdersTab() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: orders, isLoading } = useCowOrders(address as Address, chainId as SupportedChain);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };

  const filteredOrders =
    orders?.filter((order) => {
      const nameFilter = order.marketName.toLowerCase().includes(filterMarketName.toLowerCase());
      const startDateFilter = startDate
        ? new Date(order.creationDate).getTime() >= startOfDay(startDate).getTime()
        : true;
      const endDateFilter = endDate ? new Date(order.creationDate).getTime() <= endOfDay(endDate).getTime() : true;
      return nameFilter && startDateFilter && endDateFilter;
    }) ?? [];
  return (
    <>
      {isLoading && <div className="shimmer-container w-full h-[200px]" />}

      {!isLoading && !orders?.length && <Alert type="warning">No orders found.</Alert>}

      {!!orders?.length && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="grow">
              <Input
                placeholder="Search by Market Name"
                className="w-full"
                icon={<SearchIcon />}
                onKeyUp={marketNameCallback}
              />
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                text={
                  !startDate && !endDate
                    ? "Filter By Date"
                    : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${endDate ? format(endDate, "MMM d, yyyy") : "_"}`
                }
                onClick={() => setShowDateRangePicker((state) => !state)}
              />
              {isShowDateRangePicker && (
                <div className="absolute right-0 top-[60px]">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={onChangeDate}
                    onClose={() => setShowDateRangePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <OrdersTable chainId={chainId as SupportedChain} data={filteredOrders} />
        </div>
      )}
    </>
  );
}

export default OrdersTab;
