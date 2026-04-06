/**
 * Map Page
 * Main map view displaying photo markers with district filtering
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons'; // 引入图标库
import RNMapView from 'react-native-maps'; // 引入类型用于 ref

// Components
import { MapView, DistrictFilter } from '../../src/components/map';

// Stores
import { useDistrictStore } from '../../src/stores/districtStore';
import { usePhotoStore } from '../../src/stores/photoStore';

// ============================================================
// Component
// ============================================================

export default function MapPage(): React.JSX.Element {
  // Hooks
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Refs & States
  const mapRef = useRef<RNMapView>(null); // ⭐️ 创建地图 Ref
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocating, setIsLocating] = useState(false); // 控制定位按钮的 loading 状态

  // District store
  const districts = useDistrictStore((state) => state.districts);
  const isDistrictsLoading = useDistrictStore((state) => state.isLoading);
  const fetchDistricts = useDistrictStore((state) => state.fetchDistricts);

  // Photo store
  const markers = usePhotoStore((state) => state.markers);
  const selectedDistrict = usePhotoStore((state) => state.selectedDistrict);
  const isMarkersLoading = usePhotoStore((state) => state.isLoading);
  const fetchMarkers = usePhotoStore((state) => state.fetchMarkers);
  const setSelectedDistrict = usePhotoStore((state) => state.setSelectedDistrict);

  // Combined loading state
  const isLoading = isDistrictsLoading || isMarkersLoading;

  /**
   * Fetch initial data on mount & Check Permissions
   */
  useEffect(() => {
    fetchDistricts();
    fetchMarkers();

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasLocationPermission(true);
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    })();
  }, [fetchDistricts, fetchMarkers]);

  /**
   * ⭐️ 一键定位核心逻辑
   */
  const handleLocateMe = async () => {
    // 1. 如果还没授权，重新请求授权
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        return;
      }
      setHasLocationPermission(true);
    }

    setIsLocating(true);
    try {
      // 2. 获取当前坐标 (使用 Balanced 精度以加快获取速度)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, 
      });

      const { latitude, longitude } = location.coords;

      // 3. 驱动地图产生丝滑的平移动画 (Delta 值决定了缩放比例，越小越放大)
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.02, // 放大到街道级别
          longitudeDelta: 0.02,
        },
        1000 // 动画持续时间 1000ms
      );
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Handle district selection
   */
  const handleDistrictSelect = useCallback(
    (code: string | null) => {
      setSelectedDistrict(code);
      fetchMarkers(code ?? undefined);
    },
    [setSelectedDistrict, fetchMarkers]
  );

  /**
   * Handle marker press
   */
  const handleMarkerPress = useCallback(
    (id: string) => {
      router.push(`/photo/${id}` as any);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef} // ⭐️ 将 ref 绑定到你写的 MapView 组件上
        markers={markers}
        onMarkerPress={handleMarkerPress}
        selectedDistrict={selectedDistrict ?? undefined}
        showsUserLocation={hasLocationPermission}
      />

      {/* District Filter */}
      <View
        style={[
          styles.filterContainer,
          { paddingTop: insets.top > 0 ? insets.top : 10 },
        ]}
      >
        <DistrictFilter
          districts={districts}
          selectedCode={selectedDistrict}
          onSelect={handleDistrictSelect}
          isLoading={isDistrictsLoading}
        />
      </View>

      {/* ⭐️ 一键定位悬浮按钮 (Floating Action Button) */}
      <TouchableOpacity
        style={[styles.locateButton, { bottom: insets.bottom + 20 }]}
        onPress={handleLocateMe}
        disabled={isLocating}
        activeOpacity={0.8}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="locate" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  // ⭐️ 悬浮定位按钮样式
  locateButton: {
    position: 'absolute',
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});