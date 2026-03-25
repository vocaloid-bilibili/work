// src/components/ui/cached-img.tsx

import { useState, useEffect } from "react";
import { getCachedUrl, cacheImage } from "@/lib/imageCache";

export function useCachedSrc(src: string | undefined): string | undefined {
  const [url, setUrl] = useState(() =>
    src ? (getCachedUrl(src) ?? src) : undefined,
  );

  useEffect(() => {
    if (!src) return;
    const hit = getCachedUrl(src);
    if (hit) {
      setUrl(hit);
      return;
    }
    let alive = true;
    cacheImage(src).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [src]);

  return url;
}

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export default function CachedImg({ src, ...rest }: Props) {
  const cachedSrc = useCachedSrc(src);
  return <img {...rest} src={cachedSrc} referrerPolicy="no-referrer" />;
}
