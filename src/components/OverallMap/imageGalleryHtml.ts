// Ported verbatim from SmartInventory/MapViewer.tsx's local (non-exported)
// createImageGalleryHTML, so InfoWindow photo galleries render identically
// between /smart-inventory and this map.
export function createImageGalleryHTML(images: any[]): string {
  if (!images || images.length === 0) return '';

  const galleryId = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const imageHTML = images
    .map(
      (image) => `
    <div class="survey-image-container" data-gallery="${galleryId}" style="flex: 0 0 auto; width: 200px; margin-right: 12px;">
      <div style="
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
        background: #F3F4F6;
        padding: 6px 8px;
        border-radius: 4px;
        text-align: center;
      ">
        ${image.label}
      </div>
      <div style="position: relative; width: 200px; height: 150px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer;">
        <img
          src="${image.url}"
          alt="${image.label}"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.2s;
          "
          onclick="window.open('${image.url}', '_blank')"
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
          onerror="
            this.parentElement.parentElement.style.display='none';
            updateImageGalleryCount('${galleryId}');
          "
        />
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          padding: 8px;
          color: white;
          font-size: 10px;
          text-align: center;
        ">
          Click to enlarge
        </div>
      </div>
    </div>
  `,
    )
    .join('');

  return `
    <div id="${galleryId}-section" class="survey-images-section" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #E5E7EB;">
      <div id="${galleryId}-header" style="
        font-weight: 600;
        font-size: 14px;
        color: #1F2937;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="font-size: 18px;">📸</span>
        <span>Installation Photos (${images.length})</span>
      </div>
      <div id="${galleryId}" class="survey-images-grid" style="
        display: flex;
        overflow-x: auto;
        overflow-y: hidden;
        gap: 0;
        padding: 8px 0;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      ">
        ${imageHTML}
      </div>
      <div style="
        text-align: center;
        font-size: 11px;
        color: #6B7280;
        margin-top: 8px;
        font-style: italic;
      ">
        ← Scroll horizontally to view all photos →
      </div>
    </div>
    <style>
      #${galleryId}::-webkit-scrollbar {
        height: 8px;
      }
      #${galleryId}::-webkit-scrollbar-track {
        background: #F3F4F6;
        border-radius: 4px;
      }
      #${galleryId}::-webkit-scrollbar-thumb {
        background: #9CA3AF;
        border-radius: 4px;
      }
      #${galleryId}::-webkit-scrollbar-thumb:hover {
        background: #6B7280;
      }
    </style>
    <script>
      if (typeof window.updateImageGalleryCount === 'undefined') {
        window.updateImageGalleryCount = function(galleryId) {
          const gallery = document.getElementById(galleryId);
          const sectionElement = document.getElementById(galleryId + '-section');

          if (gallery && sectionElement) {
            const visibleImages = gallery.querySelectorAll(
              '.survey-image-container[data-gallery="' + galleryId + '"]:not([style*="display: none"])'
            ).length;

            if (visibleImages === 0) {
              sectionElement.style.display = 'none';
            } else {
              const header = document.getElementById(galleryId + '-header');
              if (header) {
                header.innerHTML = '<span style="font-size: 18px;">📸</span><span>Installation Photos (' + visibleImages + ')</span>';
              }
            }
          }
        };
      }
    </script>
  `;
}
