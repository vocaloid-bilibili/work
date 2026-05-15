// src/shared/ui/CachedImg.tsx
import { useState, useEffect } from "react";
import { getCached, cacheImg } from "../imageCache";

// eslint-disable-next-line react-refresh/only-export-components
export function useCachedSrc(src?: string) {
  const [url, setUrl] = useState(() =>
    src ? (getCached(src) ?? src) : undefined,
  );

  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    if (src) {
      const h = getCached(src);
      setUrl(h ?? src);
    } else {
      setUrl(undefined);
    }
  }

  useEffect(() => {
    if (!src) return;
    const h = getCached(src);
    if (h) return;
    let ok = true;
    cacheImg(src).then((u) => ok && setUrl(u));
    return () => {
      ok = false;
    };
  }, [src]);
  return url;
}

type P = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};
export default function CachedImg({ src, ...rest }: P) {
  const s = useCachedSrc(src);
  return <img {...rest} src={s} referrerPolicy="no-referrer" />;
}
