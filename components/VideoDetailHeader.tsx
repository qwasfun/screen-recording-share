'use client'
import { daysAgo } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import DropdownList from '@/components/DropdownList'
import { visibilities } from '@/constants'
import { deleteVideo, updateVideoVisibility } from '@/lib/actions/video'

const VideoDetailHeader = ({
  title,
  createdAt,
  userImg,
  username,
  videoId,
  ownerId,
  visibility,
  thumbnailUrl
}: VideoDetailHeaderProps) => {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [visibilityState, setVisibilityState] = useState<Visibility>(
    visibility as Visibility
  )
  const { data: session } = authClient.useSession()
  const userId = session?.user.id
  const isOwner = userId === ownerId

  const handleVisibilityChange = async (option: string) => {
    if (option !== visibilityState) {
      setIsUpdating(true)
      try {
        await updateVideoVisibility(videoId, option as Visibility)
        setVisibilityState(option as Visibility)
      } catch (error) {
        console.error('Error updating visibility:', error)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/video/${videoId}`
    )
    setCopied(true)
  }
  useEffect(() => {
    const changeChecked = setTimeout(() => {
      if (copied) setCopied(false)
    }, 2000)
    return () => clearTimeout(changeChecked)
  }, [copied])

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteVideo(videoId, thumbnailUrl)
      router.push('/')
    } catch (error) {
      console.error('Error deleting video:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  const TriggerVisibility = (
    <div className="visibility-trigger">
      <div>
        <Image
          src="/assets/icons/eye.svg"
          alt="Views"
          width={16}
          height={16}
          className="mt-0.5"
        />
        <p>{visibilityState}</p>
      </div>
      <Image
        src="/assets/icons/arrow-down.svg"
        alt="Arrow Down"
        width={16}
        height={16}
      />
    </div>
  )
  return (
    <header className="detail-header">
      <aside className="user-info">
        <h1>{title}</h1>
        <figure>
          <button onClick={() => router.push(`/profile/${ownerId}`)}>
            {/*<ImageWithFallback*/}
            <Image
              src={userImg ?? ''}
              alt="Jason"
              width={24}
              height={24}
              className="rounded-full"
            />
            <h2>{username ?? 'Guest'}</h2>
          </button>
          <figcaption>
            <span className="mt-1">・</span>
            <p>{daysAgo(createdAt)}</p>
          </figcaption>
        </figure>
      </aside>
      <aside className="cta">
        <button onClick={copyLink}>
          <Image
            src={
              copied ? '/assets/images/checked.png' : '/assets/icons/link.svg'
            }
            alt="Copy Link"
            width={24}
            height={24}
          />
        </button>
        {isOwner && (
          <div className="user-btn">
            <button
              className="delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete video'}
            </button>
            <div className="bar" />
            {isUpdating ? (
              <div className="update-stats">
                <p>Updating...</p>
              </div>
            ) : (
              <DropdownList
                options={visibilities}
                selectedOption={visibilityState}
                onOptionSelect={handleVisibilityChange}
                triggerElement={TriggerVisibility}
              />
            )}
          </div>
        )}
      </aside>
    </header>
  )
}

export default VideoDetailHeader
