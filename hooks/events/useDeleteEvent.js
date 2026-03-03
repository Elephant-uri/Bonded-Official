import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteEvent } from '../../api/events/deleteEvent'
import { useAuthStore } from '../../stores/authStore'
import { Logger } from '../../utils/logger'

/**
 * Hook to delete an event
 * Handles event deletion with confirmation and cache invalidation
 */
export function useDeleteEvent() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId) => {
      if (!user) {
        throw new Error('User must be authenticated to delete events')
      }

      Logger.info('Deleting event:', eventId)
      const result = await deleteEvent(eventId)
      Logger.info('Event deleted successfully:', result)
      return result
    },
    onSuccess: (data) => {
      Logger.info('Event deleted, invalidating queries:', {
        eventId: data?.id,
        title: data?.title,
      })

      // Invalidate events queries to refetch
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['eventsForUser'] })
      queryClient.invalidateQueries({ queryKey: ['calendarData'] })

      Logger.info('Queries invalidated - events should refetch')
    },
    onError: (error) => {
      Logger.error('Event deletion failed:', error)
    },
    retry: 1,
  })
}
