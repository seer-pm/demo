import { Card } from "@/components/Card";
import { useMarkets } from "@/hooks/useMarkets";
import { paths } from "@/lib/paths";
import { Link } from "react-router-dom";

function Home() {
  const { data: markets = [] } = useMarkets();

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
