/**
 * Test Screen
 * Temporary screen to verify store functionality
 * TODO: Delete this file after testing
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDistrictStore } from '../../src/stores/districtStore';
import { usePhotoStore } from '../../src/stores/photoStore';

export default function TestScreen() {
  // District store
  const districts = useDistrictStore((state) => state.districts);
  const districtLoading = useDistrictStore((state) => state.isLoading);
  const districtError = useDistrictStore((state) => state.error);
  const fetchDistricts = useDistrictStore((state) => state.fetchDistricts);

  // Photo store
  const photos = usePhotoStore((state) => state.photos);
  const markers = usePhotoStore((state) => state.markers);
  const photoLoading = usePhotoStore((state) => state.isLoading);
  const photoError = usePhotoStore((state) => state.error);
  const fetchPhotos = usePhotoStore((state) => state.fetchPhotos);
  const fetchMarkers = usePhotoStore((state) => state.fetchMarkers);

  const handleFetchDistricts = async () => {
    await fetchDistricts();
  };

  const handleFetchPhotos = async () => {
    await fetchPhotos();
  };

  const handleFetchMarkers = async () => {
    await fetchMarkers();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Store Test Screen</Text>
      <Text style={styles.subtitle}>Temporary - Delete after testing</Text>

      {/* District Store Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>District Store</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleFetchDistricts}
          disabled={districtLoading}
        >
          <Text style={styles.buttonText}>Fetch Districts</Text>
        </TouchableOpacity>

        {districtLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {districtError && (
          <Text style={styles.errorText}>Error: {districtError}</Text>
        )}

        <Text style={styles.resultText}>
          Districts count: {districts.length}
        </Text>

        {districts.length > 0 && (
          <View style={styles.dataPreview}>
            <Text style={styles.previewTitle}>First district:</Text>
            <Text style={styles.previewText}>
              {JSON.stringify(districts[0], null, 2)}
            </Text>
          </View>
        )}
      </View>

      {/* Photo Store Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo Store</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleFetchPhotos}
          disabled={photoLoading}
        >
          <Text style={styles.buttonText}>Fetch Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleFetchMarkers}
          disabled={photoLoading}
        >
          <Text style={styles.buttonText}>Fetch Markers</Text>
        </TouchableOpacity>

        {photoLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {photoError && (
          <Text style={styles.errorText}>Error: {photoError}</Text>
        )}

        <Text style={styles.resultText}>
          Photos count: {photos.length}
        </Text>

        <Text style={styles.resultText}>
          Markers count: {markers.length}
        </Text>

        {photos.length > 0 && (
          <View style={styles.dataPreview}>
            <Text style={styles.previewTitle}>First photo:</Text>
            <Text style={styles.previewText}>
              {JSON.stringify(
                {
                  id: photos[0].id,
                  district: photos[0].district,
                  hasArVideo: photos[0].hasArVideo,
                },
                null,
                2
              )}
            </Text>
          </View>
        )}

        {markers.length > 0 && (
          <View style={styles.dataPreview}>
            <Text style={styles.previewTitle}>First marker:</Text>
            <Text style={styles.previewText}>
              {JSON.stringify(markers[0], null, 2)}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 4,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  dataPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#444',
  },
  bottomPadding: {
    height: 40,
  },
});
