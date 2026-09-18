// file: components/nav-avatar.tsx

"use client";

import Image from "next/image";
import { UserCircle } from "lucide-react";
import { useState } from "react";

export default function NavAvatar({
  src,
  alt,
}: {
  src?: string | null;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <UserCircle size={23} />;
  }

  return (
    <Image
      src={src}
      alt={alt || "Profile"}
      width={36}
      height={36}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}