// src/shared/ui/CachedImg.tsx
import { useState, useEffect } from "react";
import { getCached, cacheImg } from "../imageCache";

export function useCachedSrc(src?: string) {
  const [url, setUrl] = useState(() =>
    src ? (getCached(src) ?? src) : undefined,
  );
  useEffect(() => {
    if (!src) return;
    const h = getCached(src);
    if (h) {
      setUrl(h);
      return;
    }
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
