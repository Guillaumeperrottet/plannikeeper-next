"use client";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";

interface ImageLightboxProps {
  images: Array<{
    src: string;
    alt?: string;
    title?: string;
  }>;
  index: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  index,
  open,
  onClose,
}: ImageLightboxProps) {
  const slides = images.map((img) => ({
    src: img.src,
    alt: img.alt || "",
    title: img.title || img.alt || "",
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Captions]}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      carousel={{
        finite: images.length <= 1,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
      }}
    />
  );
}
