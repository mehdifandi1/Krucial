import Image from "next/image"

interface KrucialLogoProps {
  width?: number
  height?: number
  className?: string
}

export function KrucialLogo({ width = 120, height = 60, className = "" }: KrucialLogoProps) {
  return (
    <Image
      src="/images/krucial-logo.png"
      alt="Krucial Logo"
      width={width}
      height={height}
      className={`${className}`}
      style={{ filter: "none" }}
    />
  )
}
