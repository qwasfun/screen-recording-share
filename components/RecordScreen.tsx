'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ICONS } from '@/constants'
import { useRef, useState } from 'react'
import { useScreenRecording } from '@/lib/hooks/useScreenRecording'

const RecordScreen = () => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const {
    isRecording,
    recordedBlob,
    recordedVideoUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    resetRecording
  } = useScreenRecording()
  const closeModal = () => {
    setIsOpen(false)
  }

  const handlerStart = async () => {
    await startRecording()
  }
  const recordAgain = async () => {
    resetRecording()
    await startRecording()
    if (recordedVideoUrl && videoRef.current)
      videoRef.current.src = recordedVideoUrl
  }

  const goToUpload = async () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    sessionStorage.setItem(
      'recordedVideo',
      JSON.stringify({
        url,
        name: 'screen-recording.webm',
        type: recordedBlob.type,
        size: recordedBlob.size,
        duration: recordingDuration || 0
      })
    )
    closeModal()
    await router.push('/upload')
  }

  return (
    <div className="record">
      <button className="primary-btn" onClick={() => setIsOpen(true)}>
        <Image src={ICONS.record} alt="record" width={16} height={16} />
        <span>Record a video</span>
      </button>

      {isOpen && (
        <section className="dialog">
          <div className="dialog-content">
            <figure>
              <h3>Screen Recording</h3>
              <button onClick={closeModal}>
                <Image src={ICONS.close} alt="close" width={20} height={20} />
              </button>
            </figure>
            <section>
              {isRecording ? (
                <article>
                  <div />
                  <span>Recoding in progress</span>
                </article>
              ) : recordedVideoUrl ? (
                <video ref={videoRef} src={recordedVideoUrl} controls />
              ) : (
                <p>Click record to start capturing your screen</p>
              )}
            </section>
            <div className="record-box">
              {!isRecording && !recordedVideoUrl && (
                <button className="record-start" onClick={handlerStart}>
                  <Image
                    src={ICONS.record}
                    alt="record"
                    width={16}
                    height={16}
                  />
                </button>
              )}
              {isRecording && (
                <button onClick={stopRecording} className="record-stop">
                  Stop Recording
                </button>
              )}
              {recordedVideoUrl && (
                <>
                  <button className="record-again" onClick={recordAgain}>
                    Record Again
                  </button>
                  <button className="record-stop" onClick={goToUpload}>
                    <Image
                      src={ICONS.upload}
                      alt="upload"
                      width={16}
                      height={16}
                    />
                    Upload recording
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default RecordScreen
