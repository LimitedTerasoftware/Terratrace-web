import { useCallback } from 'react';

export const useFullscreen = () => {
  const enterFullscreen = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) { /* Safari */
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) { /* IE11 */
      (element as any).msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) { /* Safari */
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) { /* IE11 */
      (document as any).msExitFullscreen();
    }
  }, []);

  return { enterFullscreen, exitFullscreen };
};
