import Header from '@/components/Header'
import VideoCard from '@/components/VideoCard'
import { getAllVideos } from '@/lib/actions/video'
import EmptyState from '@/components/EmptyState'
import Pagination from '@/components/Pagination'

export default async function Page({ searchParams }: SearchParams) {
  const { query, filter, page } = await searchParams
  const { videos, pagination } = await getAllVideos(
    query,
    filter,
    Number(page) || 1
  )
  return (
    <main className="wrapper page">
      <Header subHeader="Public Library" title="All Videos" />

      {videos?.length > 0 ? (
        <section className="video-grid">
          {videos.map(({ video, user }) => (
            <VideoCard
              key={video.id}
              {...video}
              id={video.videoId}
              thumbnail={video.thumbnailUrl}
              title={video.title}
              userImg={user?.image || '/assets/images/dummy.jpg'}
              username={user?.name || ''}
              views={video.views}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon="/assets/icons/video.svg"
          title={'No Videos Found'}
          description={'Try adjusting your search.'}
        />
      )}
      {pagination?.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          queryString={query}
          filterString={filter}
        />
      )}
    </main>
  )
}
