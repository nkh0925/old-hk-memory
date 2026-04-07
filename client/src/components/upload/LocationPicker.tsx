import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';   // 使用优化后的 Modern Archive theme

// ============================================================
// Types
// ============================================================

/**
 * Location coordinate interface
 */
interface LocationCoordinate {
  longitude: number;
  latitude: number;
}

/**
 * Location with optional address
 */
interface LocationWithAddress extends LocationCoordinate {
  address?: string;
}

/**
 * Props interface for LocationPicker component
 */
interface LocationPickerProps {
  /** Currently selected location */
  location: LocationCoordinate | null;
  /** Callback when a location is selected */
  onLocationSelected: (location: LocationWithAddress) => void;
}

/**
 * Google Places Autocomplete prediction
 */
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Google Places Autocomplete API response
 */
interface AutocompleteResponse {
  predictions: PlacePrediction[];
  status: string;
  error_message?: string;
}

/**
 * Google Place Details API response
 */
interface PlaceDetailsResponse {
  result: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
  status: string;
}

// ============================================================
// Constants
// ============================================================

/**
 * Google Maps API Key
 */
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
if (__DEV__) {
  console.log('=== GOOGLE MAPS API KEY DEBUG ===');
  console.log('expoConfig:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
  console.log('API Key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.slice(0, 10)}...` : 'EMPTY');
  console.log('=================================');
}

/**
 * Hong Kong default coordinates
 */
const HONG_KONG_REGION: Region = {
  latitude: 22.3193,
  longitude: 114.1694,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

/**
 * Default delta values for zooming into selected location
 */
const SELECTED_LOCATION_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 300;

/**
 * Maximum number of suggestions to show
 */
const MAX_SUGGESTIONS = 5;

// ============================================================
// Component
// ============================================================

/**
 * LocationPicker component
 * Allows users to select location via GPS, map tap, or address search
 */
const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationSelected,
}) => {
  // State
  const [isLoadingGPS, setIsLoadingGPS] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Refs
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Center map on location when it changes
   */
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          ...SELECTED_LOCATION_DELTA,
        },
        500
      );
    }
  }, [location]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * Fetch autocomplete suggestions from Google Places API
   */
  const fetchSuggestions = useCallback(async (input: string): Promise<void> => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_MAPS_API_KEY}&components=country:hk&language=en`;

      const response = await fetch(url);
      const data: AutocompleteResponse = await response.json();

      if (data.status === 'OK') {
        setSuggestions(data.predictions.slice(0, MAX_SUGGESTIONS));
        setShowSuggestions(true);
      } else if (data.status === 'ZERO_RESULTS') {
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        console.warn('Places API error:', data.status, data.error_message);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = useCallback(
    (text: string): void => {
      setSearchQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(text);
      }, DEBOUNCE_DELAY);
    },
    [fetchSuggestions]
  );

  /**
   * Fetch place details to get coordinates
   */
  const fetchPlaceDetails = useCallback(
    async (placeId: string, description: string): Promise<void> => {
      setIsSearching(true);
      Keyboard.dismiss();

      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry`;

        const response = await fetch(url);
        const data: PlaceDetailsResponse = await response.json();

        if (data.status === 'OK') {
          const { lat, lng } = data.result.geometry.location;

          onLocationSelected({
            latitude: lat,
            longitude: lng,
            address: description,
          });

          setSearchQuery(description);
          setSuggestions([]);
          setShowSuggestions(false);
        } else {
          Alert.alert('Error', 'Failed to get location details. Please try again.');
        }
      } catch (error) {
        console.error('Failed to fetch place details:', error);
        Alert.alert('Error', 'Failed to get location details. Please try again.');
      } finally {
        setIsSearching(false);
      }
    },
    [onLocationSelected]
  );

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback(
    (prediction: PlacePrediction): void => {
      fetchPlaceDetails(prediction.place_id, prediction.description);
    },
    [fetchPlaceDetails]
  );

  /**
   * Request location permission
   */
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location permission is required to use current location.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Get current GPS location
   */
  const getCurrentLocation = useCallback(async (): Promise<void> => {
    setIsLoadingGPS(true);
    Keyboard.dismiss();
    setShowSuggestions(false);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setIsLoadingGPS(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { longitude, latitude } = currentLocation.coords;
      onLocationSelected({ longitude, latitude });

      setSearchQuery('');
      setSuggestions([]);
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Unable to get current location. Please try again or select manually on the map.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingGPS(false);
    }
  }, [requestLocationPermission, onLocationSelected]);

  /**
   * Handle map press to select location
   */
  const handleMapPress = useCallback(
    (event: MapPressEvent): void => {
      Keyboard.dismiss();
      setShowSuggestions(false);

      const { coordinate } = event.nativeEvent;
      onLocationSelected({
        longitude: coordinate.longitude,
        latitude: coordinate.latitude,
      });

      setSearchQuery('');
      setSuggestions([]);
    },
    [onLocationSelected]
  );

  /**
   * Handle search input focus
   */
  const handleSearchFocus = useCallback((): void => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  /**
   * Handle search input blur
   */
  const handleSearchBlur = useCallback((): void => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  /**
   * Clear search input
   */
  const handleClearSearch = useCallback((): void => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  /**
   * Get initial region based on current location prop
   */
  const getInitialRegion = useCallback((): Region => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        ...SELECTED_LOCATION_DELTA,
      };
    }
    return HONG_KONG_REGION;
  }, [location]);

  /**
   * Render suggestion item
   */
  const renderSuggestionItem = useCallback(
    ({ item, index }: { item: PlacePrediction; index: number }) => {
      const isLast = index === suggestions.length - 1;

      return (
        <TouchableOpacity
          style={[styles.suggestionItem, isLast && styles.suggestionItemLast]}
          onPress={() => handleSuggestionSelect(item)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color={theme.colors.secondary}
            style={styles.suggestionIcon}
          />
          <View style={styles.suggestionTextContainer}>
            <Text style={styles.suggestionMainText} numberOfLines={1}>
              {item.structured_formatting.main_text}
            </Text>
            <Text style={styles.suggestionsecondary} numberOfLines={1}>
              {item.structured_formatting.secondary_text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [suggestions.length, handleSuggestionSelect]
  );

  /**
   * Key extractor for suggestions list
   */
  const keyExtractor = useCallback(
    (item: PlacePrediction) => item.place_id,
    []
  );

  return (
    <View style={styles.container}>
      {/* Search Container */}
      <View style={styles.searchContainer}>
        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address..."
            placeholderTextColor={theme.colors.secondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={styles.searchSpinner}
            />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
            />
          </View>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getInitialRegion()}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {/* Selected Location Marker */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Selected Location"
              pinColor={theme.colors.primary}
            />
          )}
        </MapView>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={isLoadingGPS}
          activeOpacity={0.8}
          accessibilityLabel="Use current location"
          accessibilityRole="button"
        >
          {isLoadingGPS ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={theme.colors.primary} />
          )}
          <Text style={styles.buttonText}>
            {isLoadingGPS ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Search
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    padding: 0,
  },
  searchSpinner: {
    marginLeft: theme.spacing.sm,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  suggestionsecondary: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
    marginTop: 2,
  },

  // Map
  mapContainer: {
    flex: 1,
    marginTop: 50,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Current Location Button
  currentLocationButton: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
});

export default LocationPicker;