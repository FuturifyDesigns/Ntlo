import { createContext, useContext } from 'react'
import { useSavedListings } from '../hooks/useSavedListings'

const SavedListingsContext = createContext(null)

export function SavedListingsProvider({ children }) {
  const value = useSavedListings()
  return (
    <SavedListingsContext.Provider value={value}>
      {children}
    </SavedListingsContext.Provider>
  )
}

export function useSavedListingsContext() {
  const ctx = useContext(SavedListingsContext)
  if (!ctx) {
    throw new Error('useSavedListingsContext must be used within SavedListingsProvider')
  }
  return ctx
}

/** Safe hook for ListingCard — falls back to own instance if provider missing. */
export function useSavedListingsOptional() {
  return useContext(SavedListingsContext)
}
