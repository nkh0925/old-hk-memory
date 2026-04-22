import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useNearbyDetection, PhotoLocation } from 'src/hooks/useNearbyDetection';
import { usePhotoStore } from 'src/stores/photoStore';
import { useAuthStore } from 'src/stores/authStore';
import { ProximityAlertModal, PhotoDetails } from './ProximityAlertModal';
import theme from 'src/theme';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const toRad = (val: number) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const GlobalProximityTracker = () => {
  const router = useRouter();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [dismissedPhotoId, setDismissedPhotoId] = useState<string | null>(null);

  // 获取用户是否已登录的状态
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const rawPhotos = usePhotoStore((state) => state.photos || []);
  const fetchPhotos = usePhotoStore((state) => state.fetchPhotos);
  const isLoading = usePhotoStore((state) => state.isLoading);

  // 防死循环：记录是否已经尝试过拉取
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // 如果用户登出了，重置尝试状态，并且直接 return（不拉数据）
    if (!isAuthenticated) {
      hasAttemptedFetch.current = false;
      return;
    }

    // 只有在：有权限 + 数据为空 + 没在加载 + 还没尝试过 的情况下，才去拉取
    if (rawPhotos.length === 0 && !isLoading && !hasAttemptedFetch.current) {
      console.log('🔄 GlobalProximityTracker: 用户已登录且数据为空，尝试拉取数据...');
      hasAttemptedFetch.current = true; // 标记为已尝试，不管成功还是失败都不再进这个 if
      
      fetchPhotos(undefined, 1, 100).catch(err => {
        console.error('Tracker 自动拉取失败，请检查网络或 Token', err);
      });
    }
  }, [rawPhotos.length, isLoading, fetchPhotos, isAuthenticated]);

  const mappedPhotos = useMemo(() => {
    const result = rawPhotos
      .filter(photo => photo.location && photo.location.coordinates)
      .map((photo) => ({
        id: photo.id,
        longitude: photo.location!.coordinates[0],
        latitude: photo.location!.coordinates[1],
        title: photo.district?.name || 'Historical Photo', 
        aiVideoStatus: photo.aiVideo?.status || 'none',
        imageUrl: photo.imageUrl,
        story: photo.story,
        uploaderId: photo.uploader?.id || null,
      }));
    return result;
  }, [rawPhotos]);

  const { nearbyPhoto, currentLocation } = useNearbyDetection({
    photos: mappedPhotos as PhotoLocation[],
    radiusInMeters: 50,
    onEnterProximity: (photo) => {
      // 如果没登录，根本不弹窗
      if (!isAuthenticated) return;
      
      if (photo.id !== dismissedPhotoId) {
        setModalVisible(true);
      }
    },
    onLeaveProximity: () => {
      setDismissedPhotoId(null);
      setModalVisible(false);
    }
  });

  const distanceToPhoto = (currentLocation && nearbyPhoto) 
    ? calculateDistance(
        currentLocation.latitude, currentLocation.longitude, 
        nearbyPhoto.latitude, nearbyPhoto.longitude
      )
    : 0;

  const handleCloseModal = () => {
    setModalVisible(false);
    if (nearbyPhoto) {
      setDismissedPhotoId(nearbyPhoto.id);
    }
  };

  // 如果未登录，直接不渲染任何弹窗 UI
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProximityAlertModal
      visible={modalVisible}
      photo={nearbyPhoto as unknown as PhotoDetails}
      distance={distanceToPhoto}
      onClose={handleCloseModal}
    />
  );
};