interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  invertText?: boolean
  className?: string
}

const sizes = {
  sm: { box: "w-7 h-7", icon: "w-4 h-4", text: "text-lg" },
  md: { box: "w-9 h-9", icon: "w-5 h-5", text: "text-xl" },
  lg: { box: "w-12 h-12", icon: "w-7 h-7", text: "text-2xl" },
}

export default function Logo({ size = "md", showText = true, invertText = false, className = "" }: LogoProps) {
  const s = sizes[size]

  return (
    <a href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${s.box} rounded-xl bg-gradient-to-br from-[#2a5cff] to-[#1a3fcc] flex items-center justify-center shadow-md shadow-blue-500/20`}>
        {/* Calendar + Clock combined icon */}
        <svg className={`${s.icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Calendar body */}
          <rect x="3" y="4" width="18" height="18" rx="3" />
          {/* Calendar top hooks */}
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
          {/* Clock circle inside */}
          <circle cx="12" cy="14" r="4" strokeWidth="1.5" />
          {/* Clock hands */}
          <line x1="12" y1="14" x2="12" y2="12" strokeWidth="1.5" />
          <line x1="12" y1="14" x2="13.5" y2="15" strokeWidth="1.5" />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight ${invertText ? "text-white" : "text-zinc-900"}`}>
          Randevya
        </span>
      )}
    </a>
  )
}
