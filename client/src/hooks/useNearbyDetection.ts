import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useSettings } from 'src/contexts/SettingsContext';

export interface PhotoLocation {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  aiVideoStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UseNearbyDetectionProps {
  photos: PhotoLocation[];
  radiusInMeters?: number; // Default: 50
  onEnterProximity?: (nearestPhoto: PhotoLocation) => void;
  onLeaveProximity?: () => void;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @returns Distance in meters.
 */
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Custom hook to detect when a user walks near a historical photo.
 * Only triggers proximity events if AI Mode is enabled.
 */
export const useNearbyDetection = ({
  photos,
  radiusInMeters = 50,
  onEnterProximity,
  onLeaveProximity,
}: UseNearbyDetectionProps) => {
  const { isAiModeEnabled } = useSettings();
  
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [nearbyPhoto, setNearbyPhoto] = useState<PhotoLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use a ref to keep track of the currently active photo ID to prevent redundant trigger calls
  const activePhotoIdRef = useRef<string | null>(null);

  // --------------------------------------------------------
  // 1. GPS Tracking Effect
  // --------------------------------------------------------
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          console.warn('Location permission denied.');
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update at most every 5 seconds
            distanceInterval: 5, // Update only if user moves at least 5 meters
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        setErrorMsg('Error initializing location tracking');
        console.error(error);
      }
    };

    startLocationTracking();

    // Cleanup on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []); // Empty dependency array ensures GPS watcher starts only once

  // --------------------------------------------------------
  // 2. Proximity Evaluation Effect
  // --------------------------------------------------------
//   useEffect(() => {
//     if (!currentLocation || photos.length === 0) return;

//     let closestPhoto: PhotoLocation | null = null;
//     let minDistance = Infinity;

//     // Find the closest photo
//     for (const photo of photos) {
//       const distance = getDistanceInMeters(
//         currentLocation.latitude,
//         currentLocation.longitude,
//         photo.latitude,
//         photo.longitude
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         closestPhoto = photo;
//       }
//     }

//     const isWithinRadius = closestPhoto && minDistance <= radiusInMeters;

//     // Logic: Only consider "entering" if AI Mode is TRUE and we are physically close
//     if (isWithinRadius && isAiModeEnabled) {
//       if (activePhotoIdRef.current !== closestPhoto!.id) {
//         // User just walked into a new photo's radius (or just turned on AI mode while standing there)
//         activePhotoIdRef.current = closestPhoto!.id;
//         setNearbyPhoto(closestPhoto);
        
//         if (onEnterProximity) {
//           onEnterProximity(closestPhoto!);
//         }
//       }
//     } else {
//       // User walked away, OR user turned OFF AI Mode
//       if (activePhotoIdRef.current !== null) {
//         activePhotoIdRef.current = null;
//         setNearbyPhoto(null);
        
//         if (onLeaveProximity) {
//           onLeaveProximity();
//         }
//       }
//     }
//   }, [currentLocation, isAiModeEnabled, photos, radiusInMeters]); // Re-evaluate when location or AI mode changes

  // --------------------------------------------------------
  // 2. Proximity Evaluation Effect (带有 Debug 日志)
  // --------------------------------------------------------
  useEffect(() => {
    if (!currentLocation) {
      console.log('📍 还在获取当前定位...');
      return;
    }
    if (photos.length === 0) {
      console.log('🖼️ 等待照片数据加载...');
      return;
    }

    let closestPhoto: PhotoLocation | null = null;
    let minDistance = Infinity;

    for (const photo of photos) {
      const distance = getDistanceInMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        photo.latitude,
        photo.longitude
      );

      // 看看算出来的距离到底是多少！
      console.log(`📏 测试距离 -> 照片[${photo.title || photo.id}]: ${Math.round(distance)} 米`);

      if (distance < minDistance) {
        minDistance = distance;
        closestPhoto = photo;
      }
    }

    console.log(`🏆 最近的照片是: ${closestPhoto?.id}, 距离: ${Math.round(minDistance)} 米. 设定半径: ${radiusInMeters} 米. AI模式: ${isAiModeEnabled}`);

    const isWithinRadius = closestPhoto && minDistance <= radiusInMeters;

    if (isWithinRadius && isAiModeEnabled) {
      if (activePhotoIdRef.current !== closestPhoto!.id) {
        console.log('🎉 触发 Enter 事件!');
        activePhotoIdRef.current = closestPhoto!.id;
        setNearbyPhoto(closestPhoto);
        if (onEnterProximity) onEnterProximity(closestPhoto!);
      }
    } else {
      if (activePhotoIdRef.current !== null) {
        console.log('👋 触发 Leave 事件!');
        activePhotoIdRef.current = null;
        setNearbyPhoto(null);
        if (onLeaveProximity) onLeaveProximity();
      }
    }
  }, [currentLocation, isAiModeEnabled, photos, radiusInMeters]);
  
  return {
    currentLocation,
    nearbyPhoto,
    errorMsg,
  };
};