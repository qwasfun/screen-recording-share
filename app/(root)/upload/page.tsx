'use client'
import FormField from '@/components/FormField'
import FileInput from '@/components/FileInput'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useFileInput } from '@/lib/hooks/useFileInput'
import { MAX_THUMBNAIL_SIZE, MAX_VIDEO_SIZE } from '@/constants'
import {
  getThumbnailUrl,
  getVideoUploadUrl,
  saveVideoDetails
} from '@/lib/actions/video'
import { useRouter } from 'next/navigation'

const uploadFileToBunny = async (
  file: File,
  uploadUrl: string,
  accessKey: string
) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      AccessKey: accessKey
    },
    body: file
  })
  if (!response.ok) {
    throw new Error(`upload failed ${response.statusText}`)
  }
}

const Page = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<VideoFormValues>({
    title: '',
    description: '',
    tags: '',
    visibility: 'public'
  })
  const [error, setError] = useState('')
  const video = useFileInput(MAX_VIDEO_SIZE)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  useEffect(() => {
    if (video.duration !== null) {
      setVideoDuration(video.duration)
    }
  }, [video.duration])

  useEffect(() => {
    const checkForRecordedVideo = async () => {
      try {
        const stored = sessionStorage.getItem('recordedVideo')
        if (!stored) return
        const { url, name, type, duration } = JSON.parse(stored)
        const blob = await fetch(url).then(res => res.blob())
        const file = new File([blob], name, { type, lastModified: Date.now() })

        if (video.inputRef.current) {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          video.inputRef.current.files = dataTransfer.files
          const event = new Event('change', { bubbles: true })
          video.inputRef.current.dispatchEvent(event)
          video.handleFileChange({
            target: { files: dataTransfer.files }
          } as ChangeEvent<HTMLInputElement>)
        }
        if (duration) setVideoDuration(video.duration)
        sessionStorage.removeItem('recordedVideo')
      } catch (e) {
        console.error(e, 'Error while fetching recorded video')
      }
    }
    checkForRecordedVideo()
  }, [video])

  const thumbnail = useFileInput(MAX_THUMBNAIL_SIZE)
  const handlerSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (!formData.title || !formData.description) {
        setError('Please fill in all the details')
        return
      }
      if (!video.file || !thumbnail.file) {
        setError('Please upload video and thumbnail')
        return
      }

      // get upload url
      const {
        videoId,
        uploadUrl: videoUploadUrl,
        accessKey: videoAccessKey
      } = await getVideoUploadUrl()
      if (!videoUploadUrl || !videoAccessKey) {
        throw new Error('Failed to get video upload credentials')
      }
      // upload the video
      await uploadFileToBunny(video.file, videoUploadUrl, videoAccessKey)
      // upload the thumbnail
      const {
        uploadUrl: thumbnailUploadUrl,
        accessKey: thumbnailAccessKey,
        cdnUrl: thumbnailCdnUrl
      } = await getThumbnailUrl(videoId)

      if (!thumbnailUploadUrl || !thumbnailAccessKey || !thumbnailCdnUrl) {
        throw new Error('Failed to get thumbnail upload credentials')
      }
      // attach thumbnail
      await uploadFileToBunny(
        thumbnail.file,
        thumbnailUploadUrl,
        thumbnailAccessKey
      )

      // create a new DB entry for the video details (urls, data)
      await saveVideoDetails({
        videoId,
        thumbnailUrl: thumbnailCdnUrl,
        ...formData,
        duration:
          videoDuration !== null ? parseInt(videoDuration.toString()) : 0
      })

      router.push(`/video/${videoId}`)
    } catch (error) {
      console.log('Error submitting form: ', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="wrapper-md upload-page">
      <h1>Upload a video</h1>
      {error && <div className="error-field">{error}</div>}
      <form
        className="rounded-20 shadow-10 gap-6 w-full flex flex-col px-5 py-7.5"
        onSubmit={handlerSubmit}
      >
        <FormField
          id="title"
          label="Title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter a clear and concise video title"
        />
        <FormField
          id="description"
          label="Description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe what this video is about"
        />

        <FormField
          id="visibility"
          label="Visibility"
          value={formData.visibility}
          onChange={handleInputChange}
          as="select"
          options={[
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' }
          ]}
          placeholder="Describe what this video is about"
        />

        <FileInput
          id={'video'}
          label={'Video'}
          accept={'video/*'}
          file={video.file}
          previewUrl={video.previewUrl}
          inputRef={video.inputRef}
          onChange={video.handleFileChange}
          onReset={video.resetFile}
          type={'video'}
        />
        <FileInput
          id={'thumbnail'}
          label={'Thumbnail'}
          accept={'image/*'}
          file={thumbnail.file}
          previewUrl={thumbnail.previewUrl}
          inputRef={thumbnail.inputRef}
          onChange={thumbnail.handleFileChange}
          onReset={thumbnail.resetFile}
          type={'image'}
        />
        <button
          className={'submit-button'}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Uploading...' : 'Upload video'}
        </button>
      </form>
    </div>
  )
}

export default Page
