import { getTranscript, getVideoById } from '@/lib/actions/video'
import { redirect } from 'next/navigation'
import VideoDetailHeader from '@/components/VideoDetailHeader'
import VideoPlayer from '@/components/VideoPlayer'
import VideoInfo from '@/components/VideoInfo'

const Page = async ({ params }: Params) => {
  const { videoId } = await params
  const result = await getVideoById(videoId)
  if (!result || !result.video || !result.user) {
    redirect('/404')
  }
  const { video, user } = result
  const transcript = await getTranscript(videoId)
  return (
    <main className="wrapper page">
      <VideoDetailHeader
        title={video.title}
        createdAt={video.createdAt}
        userImg={user?.image}
        username={user?.name}
        videoId={video.videoId}
        ownerId={video.userId}
        visibility={video.visibility}
        thumbnailUrl={video.thumbnailUrl}
      />
      <section className="video-details">
        <div className="content">
          <VideoPlayer videoId={video.videoId} />
        </div>

        <VideoInfo
          transcript={transcript}
          title={video.title}
          createdAt={video.createdAt}
          description={video.description}
          videoId={videoId}
          videoUrl={video.videoUrl}
        />
      </section>
    </main>
  )
}

export default Page
