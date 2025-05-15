'use client'
import { cn, createIframeLink } from '@/lib/utils'
import { initialVideoState } from '@/constants'
import { useEffect, useRef, useState } from 'react'
import {
  getVideoProcessingStatus,
  incrementVideoView
} from '@/lib/actions/video'

const VideoPlayer = ({ videoId, className }: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [state, setState] = useState(initialVideoState)

  useEffect(() => {
    const checkProcessingStatus = async () => {
      const status = await getVideoProcessingStatus(videoId)
      setState(prev => ({ ...prev, isProcessing: !status.isProcessed }))
      return status.isProcessed
    }
    checkProcessingStatus()

    const intervalId = setInterval(async () => {
      const isProcessed = await checkProcessingStatus()
      if (isProcessed) {
        clearInterval(intervalId)
      }
    }, 3000)
    return () => {
      clearInterval(intervalId)
    }
  }, [videoId])
  useEffect(() => {
    if (state.isLoaded && !state.hasIncrementedView && !state.isProcessing) {
      const incrementView = async () => {
        try {
          await incrementVideoView(videoId)
          setState(prev => ({ ...prev, hasIncrementedView: true }))
        } catch (err) {
          console.log('Failed to increment view count:', err)
        }
      }
      incrementView()
    }
  }, [videoId, state.isLoaded, state.hasIncrementedView, state.isProcessing])
  return (
    <div className={cn('video-player', className)}>
      {state.isProcessing ? (
        <p>Processing video ....</p>
      ) : (
        <iframe
          ref={iframeRef}
          src={createIframeLink(videoId)}
          loading="lazy"
          title="Video Player"
          style={{ border: 'none', zIndex: 50 }}
          allow="accelerometer;gyroscope;autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setState(prev => ({ ...prev, isLoaded: true }))}
        />
      )}
    </div>
  )
}

export default VideoPlayer
