
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number; };
}

interface LocationPickerProps {
  onLocationSelect: (location: Location | null) => void;
  placeholder?: string;
  selectedLocation?: Location | null;
}

const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'Main Library', address: '123 University Ave, Campus' },
  { id: '2', name: 'Student Union', address: '456 College St, Campus' },
  { id: '3', name: 'Engineering Building', address: '789 Tech Dr, Campus' },
  { id: '4', name: 'Coffee Shop', address: '321 Main St, Downtown' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  placeholder = "Add location...",
  selectedLocation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchLocations(searchTerm);
    } else {
      setLocations(MOCK_LOCATIONS);
    }
  }, [searchTerm]);

  const searchLocations = async (query: string) => {
    setLoading(true);
    try {
      // Simulate API call - in real app, use Google Places API or similar
      await new Promise(resolve => setTimeout(resolve, 500));
      const filtered = MOCK_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase())
      );
      setLocations(filtered);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: "Search failed",
        description: "Could not search locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    setGettingCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Simulate reverse geocoding - in real app, use Google Geocoding API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const currentLocation: Location = {
            id: 'current',
            name: 'Current Location',
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            coordinates: { lat: latitude, lng: longitude }
          };
          
          onLocationSelect(currentLocation);
          setIsOpen(false);
          
          toast({
            title: "Location found",
            description: "Current location selected successfully."
          });
        } catch (error) {
          toast({
            title: "Location error",
            description: "Could not get current location details.",
            variant: "destructive"
          });
        } finally {
          setGettingCurrentLocation(false);
        }
      },
      (error) => {
        setGettingCurrentLocation(false);
        let errorMessage = "Could not access location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location access failed",
          description: errorMessage,
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setIsOpen(false);
    setSearchTerm('');
  };

  const removeLocation = () => {
    onLocationSelect(null);
  };

  return (
    <div className="relative">
      {selectedLocation ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 bg-muted rounded-lg"
        >
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedLocation.name}</p>
            <p className="text-xs text-muted-foreground truncate">{selectedLocation.address}</p>
          </div>
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={removeLocation}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </EnhancedButton>
        </motion.div>
      ) : (
        <EnhancedButton
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full justify-start text-muted-foreground"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {placeholder}
        </EnhancedButton>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-full mt-2 left-0 right-0 z-50"
          >
            <EnhancedCard className="p-4">
              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Current Location Button */}
              <EnhancedButton
                variant="outline"
                onClick={getCurrentLocation}
                disabled={gettingCurrentLocation}
                className="w-full mb-3 justify-start"
              >
                {gettingCurrentLocation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Use current location
              </EnhancedButton>

              {/* Location Results */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {locations.length === 0 && searchTerm.length > 2 && !loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No locations found for "{searchTerm}"
                  </p>
                ) : (
                  locations.map((location) => (
                    <motion.button
                      key={location.id}
                      whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left p-2 rounded-md transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{location.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {location.address}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Close Button */}
              <div className="mt-3 pt-3 border-t">
                <EnhancedButton
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  Cancel
                </EnhancedButton>
              </div>
            </EnhancedCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
