// components/search-provider.tsx
"use client";

import { createContext, useContext, useState } from "react";

const SearchContext = createContext<any>(null);

export function SearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openSearch, setOpenSearch] = useState(false);

  return (
    <SearchContext.Provider
      value={{
        openSearch,
        setOpenSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchUI() {
  return useContext(SearchContext);
}