import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useNearbyDetection, PhotoLocation } from 'src/hooks/useNearbyDetection';
import { usePhotoStore } from 'src/stores/photoStore';
import { ProximityAlertModal, PhotoDetails } from './ProximityAlertModal';

// 帮助函数：计算用户当前位置与照片位置的具体距离（米）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // 地球半径（米）
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
  
  // ==========================================
  // 防疲劳状态管理 (Anti-fatigue logic)
  // ==========================================
  const [modalVisible, setModalVisible] = useState(false);
  const [dismissedPhotoId, setDismissedPhotoId] = useState<string | null>(null);

  // 从全局 Store 获取原始的照片数据和 fetch 方法
  const rawPhotos = usePhotoStore((state) => state.photos || []);
  const fetchPhotos = usePhotoStore((state) => state.fetchPhotos);
  const isLoading = usePhotoStore((state) => state.isLoading);

  // 新增：如果照片数组为空且没有在加载中，主动去拉取数据！
  // 比如将 limit 设置大一点（如 100）以确保能获取附近的数据，
  // 或者如果你后端支持不分页拉取坐标，调整这里即可。
  useEffect(() => {
    if (rawPhotos.length === 0 && !isLoading) {
      console.log('🔄 GlobalProximityTracker 发现数据为空，正在主动拉取数据...');
      fetchPhotos(undefined, 1, 100).catch(err => 
        console.error('Failed to fetch photos in tracker:', err)
      );
    }
  }, [rawPhotos.length, isLoading, fetchPhotos]);

  // 映射数据：转换成 Hook 需要的结构，并且带上 Modal UI 需要的字段
  const mappedPhotos = useMemo(() => {
    const result = rawPhotos
      .filter(photo => photo.location && photo.location.coordinates)
      .map((photo) => ({
        id: photo.id,
        // MongoDB 格式是 [经度, 纬度]
        longitude: photo.location!.coordinates[0],
        latitude: photo.location!.coordinates[1],
        title: photo.district?.name || 'Historical Photo', 
        aiVideoStatus: photo.aiVideo?.status || 'none',
        // 额外给 Modal 准备的数据
        imageUrl: photo.imageUrl,
        story: photo.story,
      }));
    
    // Debug 用：看看有多少带有坐标的照片成功进来了
    if (result.length > 0) {
      console.log(`✨ 成功映射了 ${result.length} 张带坐标的照片交给检测器。`);
    }
    
    return result;
  }, [rawPhotos]);

  // 初始化地理位置监听 Hook
  const { nearbyPhoto, currentLocation } = useNearbyDetection({
    photos: mappedPhotos as PhotoLocation[],
    radiusInMeters: 50,
    onEnterProximity: (photo) => {
      console.log('🎉 触发 Enter 距离！照片 ID:', photo.id);
      // 【防疲劳逻辑】只有当这张照片没有被用户刚刚手动关掉过，才弹出 Modal
      if (photo.id !== dismissedPhotoId) {
        setModalVisible(true);
      } else {
        console.log('🛡️ 防疲劳拦截：这张照片刚才被用户关闭过，暂不打扰。');
      }
    },
    onLeaveProximity: () => {
      console.log('👋 触发 Leave 距离！');
      // 当用户彻底离开这个区域（>50米），重置记录。这样下次他们再回来时还能触发
      setDismissedPhotoId(null);
      // 保底机制：如果用户走着走着超出了范围，自动关闭弹窗
      setModalVisible(false);
    }
  });

  // 计算具体距离用于 UI 显示
  const distanceToPhoto = (currentLocation && nearbyPhoto) 
    ? calculateDistance(
        currentLocation.latitude, currentLocation.longitude, 
        nearbyPhoto.latitude, nearbyPhoto.longitude
      )
    : 0;

  // 用户点击关闭按钮时的处理
  const handleCloseModal = () => {
    setModalVisible(false);
    // 【防疲劳逻辑】记录该照片已被忽略
    if (nearbyPhoto) {
      setDismissedPhotoId(nearbyPhoto.id);
    }
  };

  // 渲染全新的沉浸式弹窗
  return (
    <ProximityAlertModal
      visible={modalVisible}
      photo={nearbyPhoto as unknown as PhotoDetails} // 强转为包含 imageUrl/story 的详细类型
      distance={distanceToPhoto}
      onClose={handleCloseModal}
    />
  );
};