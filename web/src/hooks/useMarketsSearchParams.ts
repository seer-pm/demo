import { useSearchParams } from "react-router-dom";
import { Market_OrderBy } from "./queries/generated";
import { VerificationStatus } from "./useVerificationStatus";

function useMarketsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const verificationStatus = searchParams.get("verificationStatus") as VerificationStatus;
  const orderBy = searchParams.get("orderBy") as Market_OrderBy;
  const page = Number(searchParams.get("page") ?? 1);
  // useEffect(() => {
  //   const verificationStatus = searchParams.get("verificationStatus");
  //   if (!verificationStatus) {
  //     setSearchParams((params) => {
  //       params.set("verificationStatus", "verified");
  //       return params;
  //     });
  //   }
  // }, []);

  const toggleOrderBy = (newOrderBy: Market_OrderBy) => {
    setSearchParams((params) => {
      if (newOrderBy === params.get("orderBy")) {
        params.delete("orderBy");
      } else {
        params.set("orderBy", newOrderBy);
      }
      return params;
    });
  };

  const toggleVerificationStatus = (newVerificationStatus: VerificationStatus) => {
    setSearchParams((params) => {
      if (newVerificationStatus === params.get("verificationStatus")) {
        params.delete("verificationStatus");
      } else {
        params.set("verificationStatus", newVerificationStatus);
      }
      return params;
    });
  };

  const setPage = (page: number) => {
    setSearchParams((params) => {
      params.set("page", page.toString());
      return params;
    });
  };
  return { verificationStatus, orderBy, toggleOrderBy, toggleVerificationStatus, page, setPage };
}

export default useMarketsSearchParams;
