// Singleton Google Maps API loader
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private callbacks: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async loadGoogleMaps(apiKey: string, libraries: string[] = ['places']): Promise<void> {
    // If already loaded, resolve immediately
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Check if Google Maps is already available globally
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      this.isLoaded = true;
      this.executeCallbacks();
      return Promise.resolve();
    }

    this.isLoading = true;
    this.loadPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        // Global callback function
        (window as any).initGoogleMaps = () => {
          this.isLoaded = true;
          this.isLoading = false;
          this.executeCallbacks();
          resolve();
          
          // Clean up
          delete (window as any).initGoogleMaps;
        };

        script.onerror = () => {
          this.isLoading = false;
          reject(new Error('Failed to load Google Maps API'));
        };

        // Check if script is already added
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (!existingScript) {
          document.head.appendChild(script);
        } else {
          // Script exists, wait for it to load
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              this.isLoaded = true;
              this.isLoading = false;
              this.executeCallbacks();
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        }
      } catch (error) {
        this.isLoading = false;
        reject(error);
      }
    });

    return this.loadPromise;
  }

  public onLoad(callback: () => void): void {
    if (this.isLoaded) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  private executeCallbacks(): void {
    this.callbacks.forEach(callback => callback());
    this.callbacks = [];
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded;
  }
}

export default GoogleMapsLoader;