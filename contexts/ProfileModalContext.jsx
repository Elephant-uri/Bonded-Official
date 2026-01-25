import { createContext, useCallback, useContext, useState } from 'react'

const ProfileModalContext = createContext()

/**
 * Global provider for the unified profile modal
 * Allows triggering the profile modal from anywhere in the app
 */
export const ProfileModalProvider = ({ children }) => {
    const [activeProfileId, setActiveProfileId] = useState(null)

    const openProfile = useCallback((profileId) => {
        setActiveProfileId(profileId)
    }, [])

    const closeProfile = useCallback(() => {
        setActiveProfileId(null)
    }, [])

    return (
        <ProfileModalContext.Provider
            value={{
                activeProfileId,
                openProfile,
                closeProfile
            }}
        >
            {children}
        </ProfileModalContext.Provider>
    )
}

export const useProfileModal = () => {
    const context = useContext(ProfileModalContext)
    if (!context) {
        throw new Error('useProfileModal must be used within a ProfileModalProvider')
    }
    return context
}
