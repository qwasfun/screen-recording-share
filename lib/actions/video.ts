"use server"

import {apiFetch, doesTitleMatch, getEnv, getOrderByClause, withErrorHandling} from "@/lib/utils";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {BUNNY} from "@/constants";
import {db} from '@/drizzle/db'
import {revalidatePath} from "next/cache";
import {user, video} from "@/drizzle/schema";
import {and, desc, eq, ilike, or, sql} from "drizzle-orm";

const VIDEO_STREAM_BASE_URL = BUNNY.STREAM_BASE_URL;
const THUMBNAIL_STORAGE_BASE_URL = BUNNY.STORAGE_BASE_URL;
const THUMBNAIL_CDN_URL = BUNNY.CDN_URL;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
  streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
  storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY")
}

// Helper Functions
const getSessionUserId = async (): Promise<string> => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) {
    throw new Error("Not logged in");
  }
  return session.user.id;
}
// 使缓存失效
const revalidatePaths = (paths: string[]) => {
  paths.forEach((path) => revalidatePath(path));
};

const buildVideoWithUserQuery = () => {
  return db.select({
    video: video,
    user: {id: user.id, name: user.name, image: user.image},
  }).from(video)
    .leftJoin(user, eq(video.userId, user.id))
}

// Server Actions
export const getVideoUploadUrl = withErrorHandling(async () => {
    try {
      await getSessionUserId()
      const videoResponse = await apiFetch<BunnyVideoResponse>(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
        {
          method: "POST",
          bunnyType: "stream",
          body: {title: 'Temporary Title', collectionId: ''}
        }
      )
      const uploadUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`
      return {
        videoId: videoResponse.guid,
        uploadUrl,
        accessKey: ACCESS_KEYS.streamAccessKey,
      }
    } catch (error) {
      throw error;
    }
  }
)

export const getThumbnailUrl = withErrorHandling(async (videoId: string) => {
  const fileName = `${Date.now()}-${videoId}-thumbnail`;
  const uploadUrl = `${THUMBNAIL_STORAGE_BASE_URL}/thumbnails/${fileName}`;
  const cdnUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${fileName}`;

  return {uploadUrl, cdnUrl, accessKey: ACCESS_KEYS.storageAccessKey};
})

export const saveVideoDetails = withErrorHandling(async (videoDetails: VideoDetails) => {
    const userId = await getSessionUserId();
    await apiFetch(`${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`, {
      method: 'POST',
      bunnyType: "stream",
      body: {
        title: videoDetails.title,
        description: videoDetails.description,
      }
    });

    await db.insert(video).values({
      ...videoDetails,
      videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    revalidatePaths(["/"]);
    return {videoId: videoDetails.videoId};
  }
)

export const getAllVideos = withErrorHandling(
  async (searchQuery: string = '',
         sortFilter?: string,
         pageNumber: number = 1,
         pageSize: number = 8,) => {
    const session = await auth.api.getSession({
      headers: await headers()

    })
    const currentUserId = session?.user.id;
    const canSeeTheVideos = or(
      eq(video.visibility, 'public'),
      eq(video.userId, currentUserId!)
    )

    const whereCondition = searchQuery.trim() ? and(
      canSeeTheVideos, doesTitleMatch(video, searchQuery),
    ) : canSeeTheVideos

    const [{totalCount}] = await db.select({totalCount: sql<number>`count(*)`})
      .from(video)
      .where(whereCondition)

    const totalVideos = Number(totalCount)
    const totalPages = Math.ceil(totalCount / pageSize)

    const videoRecords = await buildVideoWithUserQuery()
      .where(whereCondition)
      .orderBy(sortFilter ? getOrderByClause(sortFilter) : sql`${video.createdAt}
      DESC`)
      .limit(pageSize)
      .offset((pageNumber - 1) * pageSize)

    return {
      videos: videoRecords,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        totalVideos,
        totalPages,
      }
    };
  })

export const getVideoById = withErrorHandling(async (videoId: string) => {
  // const session = await auth.api.getSession({})
  const [videoRecord] = await buildVideoWithUserQuery()
    .where(eq(video.videoId, videoId))
  return videoRecord
})

export const updateVideoVisibility = withErrorHandling(async (videoId: string, visibility: Visibility) => {
  await db.update(video)
    .set({visibility, updatedAt: new Date()})
    .where(eq(video.videoId, videoId))

  revalidatePaths([`/video/${videoId}`]);
  return {};

})

export const getVideoProcessingStatus = withErrorHandling(
  async (videoId: string) => {
    const processingInfo = await apiFetch<BunnyVideoResponse>(
      `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {bunnyType: "stream"}
    );

    return {
      isProcessed: processingInfo.status === 4,
      encodingProgress: processingInfo.encodeProgress || 0,
      status: processingInfo.status,
    };
  }
);
export const incrementVideoView = withErrorHandling(async (videoId: string) => {
  await db.update(video)
    .set({
      views: sql`${video.views}
      + 1`,
      updatedAt: new Date()
    }).where(eq(video.videoId, videoId))
  revalidatePaths([`/video/${videoId}`]);
  return {};
})


export const getAllVideosByUser = withErrorHandling(async (userIdParameter: string,
                                          searchQuery: string = "",
                                          sortFilter?: string) => {
  const currentUserId = (await auth.api.getSession({headers: await headers()}))?.user.id;
  const isOwner = userIdParameter === currentUserId;
  const [userInfo] = await db.select({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  }).from(user).where(eq(user.id, userIdParameter));
  if (!userInfo) {
    throw new Error(`No user with id ${userIdParameter}`);
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const conditions = [eq(video.userId, userIdParameter), !isOwner && eq(video.visibility, "public"),
    searchQuery.trim() && ilike(video.title, `%${searchQuery}%`),].filter(Boolean) as any[]
  const userVideos = await buildVideoWithUserQuery().where(and(...conditions)).orderBy(sortFilter ? getOrderByClause(sortFilter) : desc(video.createdAt))

  return {user: userInfo, videos: userVideos, count: userVideos.length};
})

export const getTranscript = withErrorHandling(async (videoId: string) => {
  const response = await fetch(
    `${BUNNY.TRANSCRIPT_URL}/${videoId}/captions/en-auto.vtt`
  );
  return response.text();
});

export const deleteVideo = withErrorHandling(
  async (videoId: string, thumbnailUrl: string) => {
    await apiFetch(
      `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      { method: "DELETE", bunnyType: "stream" }
    );

    const thumbnailPath = thumbnailUrl.split("thumbnails/")[1];
    await apiFetch(
      `${THUMBNAIL_STORAGE_BASE_URL}/thumbnails/${thumbnailPath}`,
      { method: "DELETE", bunnyType: "storage", expectJson: false }
    );

    await db.delete(video).where(eq(video.videoId, videoId));
    revalidatePaths(["/", `/video/${videoId}`]);
    return {};
  }
);