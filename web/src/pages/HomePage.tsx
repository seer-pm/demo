import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { useMarkets } from "@/hooks/useMarkets";
import { paths } from "@/lib/paths";
import { Link } from "react-router-dom";

function Home() {
  const { data: markets = [], isPending } = useMarkets();

  if (isPending) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="p-10">
        <div className="alert alert-warning">No markets found.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-5 m-4">
      {markets.map((market) => (
        <Card key={market.id}>
          <Link to={paths.market(market.id)} className="font-medium text-sm">
            {market.marketName}
          </Link>
          <div>
            {market.outcomes.map((o) => (
              <div key={o} className="flex justify-between">
                <div>{o}</div>
                <div className="flex w-32 justify-between">
                  <div className="text-success">Yes 0&cent;</div>
                  <div className="text-error">No 0&cent;</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default Home;
