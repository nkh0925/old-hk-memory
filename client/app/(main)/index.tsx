import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RNMapView from 'react-native-maps';

import { MapView, DistrictFilter } from '../../src/components/map';
import { useDistrictStore } from '../../src/stores/districtStore';
import { usePhotoStore } from '../../src/stores/photoStore';
import theme from 'src/theme';

export default function MapPage(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<RNMapView>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const districts = useDistrictStore((state) => state.districts);
  const isDistrictsLoading = useDistrictStore((state) => state.isLoading);
  const fetchDistricts = useDistrictStore((state) => state.fetchDistricts);

  const markers = usePhotoStore((state) => state.markers);
  const selectedDistrict = usePhotoStore((state) => state.selectedDistrict);
  const isMarkersLoading = usePhotoStore((state) => state.isLoading);
  const fetchMarkers = usePhotoStore((state) => state.fetchMarkers);
  const setSelectedDistrict = usePhotoStore((state) => state.setSelectedDistrict);

  const isLoading = isDistrictsLoading || isMarkersLoading;

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

  const handleLocateMe = async () => {
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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleDistrictSelect = useCallback(
    (code: string | null) => {
      setSelectedDistrict(code);
      fetchMarkers(code ?? undefined);
    },
    [setSelectedDistrict, fetchMarkers]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      router.push(`/photo/${id}` as any);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      {/* Archive Header - 轻量标题，增强主题感 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hong Kong Memory Archive</Text>
      </View>

      {/* Map View - 核心区域 */}
      <MapView
        ref={mapRef}
        markers={markers}
        onMarkerPress={handleMarkerPress}
        selectedDistrict={selectedDistrict ?? undefined}
        showsUserLocation={hasLocationPermission}
      />

      {/* District Filter - 像旧标签栏，带档案边框 */}
      <View
        style={[
          styles.filterContainer,
          { paddingTop: insets.top > 0 ? insets.top + 8 : 18 },
        ]}
      >
        <DistrictFilter
          districts={districts}
          selectedCode={selectedDistrict}
          onSelect={handleDistrictSelect}
          isLoading={isDistrictsLoading}
        />
      </View>

      {/* Locate Button - 改为档案式方形“印章”按钮 */}
      <TouchableOpacity
        style={[styles.locateButton, { bottom: insets.bottom + 24 }]}
        onPress={handleLocateMe}
        disabled={isLocating}
        activeOpacity={0.85}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name="locate" size={26} color={theme.colors.primary} />
        )}
      </TouchableOpacity>

      {/* Loading Overlay - 更安静的档案加载态 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading memories...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.title,   // Serif 档案标题感
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',   // 让地图略微透出，更融合
  },
  locateButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 247, 242, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    fontFamily: theme.fonts.body,
  },
});