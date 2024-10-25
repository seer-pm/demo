// code based on https://github.com/remix-run/react-router/blob/cf7e216b87bdcdc2a4f4fea2a09aee8942fdfadc/packages/react-router-dom/index.tsx#L1467

import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";

interface NavigateOptions {
  overwriteLastHistoryEntry?: boolean;
}

type ParamKeyValuePair = [string, string];

type URLSearchParamsInit = string | ParamKeyValuePair[] | Record<string, string | string[]> | URLSearchParams;

type SetURLSearchParams = (
  nextInit?: URLSearchParamsInit | ((prev: URLSearchParams) => URLSearchParamsInit),
  navigateOpts?: NavigateOptions,
) => void;

function createSearchParams(init: URLSearchParamsInit = ""): URLSearchParams {
  return new URLSearchParams(
    typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams
      ? init
      : Object.keys(init).reduce((memo, key) => {
          const value = init[key];
          return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
        }, [] as ParamKeyValuePair[]),
  );
}

function getSearchParamsForLocation(locationSearch: string, defaultSearchParams: URLSearchParams | null) {
  const searchParams = createSearchParams(locationSearch);

  if (defaultSearchParams) {
    // Use `defaultSearchParams.forEach(...)` here instead of iterating of
    // `defaultSearchParams.keys()` to work-around a bug in Firefox related to
    // web extensions. Relevant Bugzilla tickets:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1414602
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1023984
    defaultSearchParams.forEach((_, key) => {
      if (!searchParams.has(key)) {
        for (const value of defaultSearchParams.getAll(key)) {
          searchParams.append(key, value);
        }
      }
    });
  }

  return searchParams;
}

export function useSearchParams(defaultInit?: URLSearchParamsInit): [URLSearchParams, SetURLSearchParams] {
  const defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));
  const hasSetSearchParamsRef = React.useRef(false);

  const pageContext = usePageContext();
  const locationSearch = pageContext.urlParsed.searchOriginal || "";

  const searchParams = React.useMemo(
    () =>
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      getSearchParamsForLocation(locationSearch, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current),
    [locationSearch],
  );

  const setSearchParams = React.useCallback<SetURLSearchParams>(
    (nextInit, navigateOptions) => {
      const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(searchParams) : nextInit);
      hasSetSearchParamsRef.current = true;
      navigate(`?${newSearchParams}`, navigateOptions);
    },
    [navigate, searchParams],
  );

  return [searchParams, setSearchParams];
}
