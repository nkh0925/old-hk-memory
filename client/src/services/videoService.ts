import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed';

export interface VideoGenerationResponse {
  photoId: string;
  jobId: string;
  status: VideoStatus;
  isCustom: boolean;
}

// Official Memory polling response
export interface VideoStatusResponse {
  photoId: string;
  status: VideoStatus;
  jobId: string;
  videoUrl?: string;
  error?: string;
}

// My Recreation polling response
export interface JobStatusResponse {
  jobId: string;
  status: VideoStatus;
  videoUrl?: string | null;
  error?: string | null;
}

export interface VideoUrlResponse {
  videoUrl: string;
  duration?: number;
  generatedAt?: string;
}

export interface MyVideo {
  videoId: string;
  photoId: string;
  photoImageUrl: string | null;
  photoEra: string | null;
  prompt: string;
  url: string;
  duration?: number;
  generatedAt?: string;
}

// ─── API Calls ─────────────────────────────────────────────────────────────────

// POST /api/v1/videos/generate
// isCustom=false → Official Memory (uploader only, persists to Photo.aiVideo)
// isCustom=true  → My Recreation (any user, persists to UserVideo collection)
export const generateVideo = async (
  photoId: string,
  prompt?: string,
  isCustom: boolean = false
): Promise<VideoGenerationResponse> => {
  const response = await api.post<{ success: boolean; data: VideoGenerationResponse }>(
    '/videos/generate',
    { photoId, prompt, isCustom }
  );
  return response.data.data;
};

// POST /api/v1/videos/status
// Official Memory polling — backend reads jobId from Photo document
export const checkVideoStatus = async (photoId: string): Promise<VideoStatusResponse> => {
  const response = await api.post<{ success: boolean; data: VideoStatusResponse }>(
    '/videos/status',
    { photoId }
  );
  return response.data.data;
};

// POST /api/v1/videos/job-status
// My Recreation polling — backend reads jobId directly from UserVideo document
export const checkJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await api.post<{ success: boolean; data: JobStatusResponse }>(
    '/videos/job-status',
    { jobId }
  );
  return response.data.data;
};

// GET /api/v1/videos/my-videos
// Returns all completed UserVideo records for the authenticated user
export const getMyVideos = async (): Promise<MyVideo[]> => {
  const response = await api.get<{ success: boolean; data: MyVideo[] }>(
    '/videos/my-videos'
  );
  return response.data.data;
};

// POST /api/v1/videos/url
// Official Memory video URL — only needed if photo data is stale
export const getVideoUrl = async (photoId: string): Promise<VideoUrlResponse> => {
  const response = await api.post<{ success: boolean; data: VideoUrlResponse }>(
    '/videos/url',
    { photoId }
  );
  return response.data.data;
};

// ─── Polling Utility ───────────────────────────────────────────────────────────

// Official Memory polling — polls POST /videos/status by photoId
export const pollVideoStatus = (
  photoId: string,
  onProgress?: (status: VideoStatusResponse) => void,
  intervalMs: number = 5000,
  maxAttempts: number = 60
): Promise<VideoStatusResponse> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;

      try {
        const result = await checkVideoStatus(photoId);
        onProgress?.(result);

        if (result.status === 'completed' || result.status === 'failed') {
          clearInterval(timer);
          resolve(result);
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error('VIDEO_GENERATION_TIMEOUT'));
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, intervalMs);
  });
};

// My Recreation polling — polls POST /videos/job-status by jobId
export const pollJobStatus = (
  jobId: string,
  onProgress?: (status: JobStatusResponse) => void,
  intervalMs: number = 5000,
  maxAttempts: number = 60
): Promise<JobStatusResponse> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;

      try {
        const result = await checkJobStatus(jobId);
        onProgress?.(result);

        if (result.status === 'completed' || result.status === 'failed') {
          clearInterval(timer);
          resolve(result);
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error('VIDEO_GENERATION_TIMEOUT'));
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, intervalMs);
  });
};

const videoService = {
  generateVideo,
  checkVideoStatus,
  checkJobStatus,
  getMyVideos,
  getVideoUrl,
  pollVideoStatus,
  pollJobStatus,
};

export default videoService;