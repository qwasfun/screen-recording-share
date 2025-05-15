'use client'
import Link from 'next/link'
import Image from 'next/image'
import React, { useState } from 'react'

const VideoCard = ({
  id,
  title,
  thumbnail,
  userImg,
  username,
  createdAt,
  views,
  visibility,
  duration
}: VideoCardProps) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    await navigator.clipboard.writeText(`${window.location.origin}/video/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }
  return (
    <Link href={`/video/${id}`} className="video-card">
      <Image
        className="thumbnail"
        src={thumbnail}
        alt="thumbnail"
        width={290}
        height={160}
      />
      <article>
        <div>
          <figure>
            <Image
              src={userImg || ''}
              alt="avatar"
              width={34}
              height={34}
              className="rounded-full aspect-square"
            />
            <figcaption>
              <h3>{username}</h3>
              <p>{visibility}</p>
            </figcaption>
          </figure>
          <aside>
            <Image
              src="/assets/icons/eye.svg"
              alt="views"
              width={16}
              height={16}
            />
            <span>{views}</span>
          </aside>
        </div>
        <h2>
          {title}-{' '}
          {createdAt.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </h2>
      </article>
      <button className="copy-btn" onClick={handleCopy}>
        <Image
          src={
            copied ? '/assets/icons/checkmark.svg' : '/assets/icons/link.svg'
          }
          alt="Copy Link"
          width={18}
          height={18}
        />
      </button>
      {duration !== null && (
        <div className="duration">{Math.ceil(duration / 60)} min</div>
      )}
    </Link>
  )
}
export default VideoCard
