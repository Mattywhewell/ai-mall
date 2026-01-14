'use client';

import { Button } from '@/components/ui/button';
import { MapPin, Users, ShoppingBag, Home, RotateCcw, Navigation, Volume2, VolumeX } from 'lucide-react';

interface NavigationControlsProps {
  mode: 'walk' | 'teleport';
  onModeChange: (mode: 'walk' | 'teleport') => void;
  onHomeClick: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function NavigationControls({ mode, onModeChange, onHomeClick, isMuted = false, onToggleMute }: NavigationControlsProps) {
  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 space-y-2">
      {/* Navigation Mode Toggle */}
      <div className="flex space-x-1">
        <Button
          variant={mode === 'walk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('walk')}
          className="flex-1"
        >
          <Navigation className="w-4 h-4 mr-1" />
          Walk
        </Button>
        <Button
          variant={mode === 'teleport' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('teleport')}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Teleport
        </Button>
      </div>

      {/* Audio Controls */}
      {onToggleMute && (
        <div className="border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMute}
            className="w-full justify-start"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 mr-2" />
            ) : (
              <Volume2 className="w-4 h-4 mr-2" />
            )}
            {isMuted ? 'Unmute Audio' : 'Mute Audio'}
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onHomeClick}
          className="w-full justify-start"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Plaza
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            // TODO: Implement district teleport
            console.log('District teleport not yet implemented');
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          District Map
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            // TODO: Implement social features
            console.log('Social features not yet implemented');
          }}
        >
          <Users className="w-4 h-4 mr-2" />
          Find Friends
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            // TODO: Implement shopping cart
            console.log('Shopping cart not yet implemented');
          }}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          My Cart
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-600 border-t pt-2">
        {mode === 'walk' ? (
          <div>
            <p className="font-medium">Walk Mode</p>
            <p>Click and drag to look around, scroll to zoom</p>
          </div>
        ) : (
          <div>
            <p className="font-medium">Teleport Mode</p>
            <p>Click district portals to jump instantly</p>
          </div>
        )}
      </div>
    </div>
  );
}