import { useCowOrders } from "@/hooks/portfolio/ordersTab/useCowOrders";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { isUndefined } from "@/lib/utils";
import { endOfDay, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import OrdersTable from "./OrdersTable";

function OrdersTab({ account }: { account: Address | undefined }) {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: orders, error } = useCowOrders(account as Address, chainId as SupportedChain);
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
  const renderTable = () => {
    if (isUndefined(orders)) {
      return <div className="shimmer-container w-full h-[200px]" />;
    }
    return !filteredOrders.length ? (
      <Alert type="warning">No orders found.</Alert>
    ) : (
      <OrdersTable chainId={chainId} data={filteredOrders} />
    );
  };
  if (error) {
    return <Alert type="error">{error.message}</Alert>;
  }

  return (
    <>
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
                  : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${
                      endDate ? format(endDate, "MMM d, yyyy") : "_"
                    }`
              }
              onClick={() => setShowDateRangePicker((state) => !state)}
            />
            {isShowDateRangePicker && (
              <div className="absolute right-0 top-[60px] z-10">
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
        {renderTable()}
      </div>
    </>
  );
}

export default OrdersTab;
