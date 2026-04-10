import { HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg"
  hover?: boolean
}

export default function Card({
  padding = "md",
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" }

  return (
    <div
      className={`
        bg-white rounded-2xl border border-zinc-200
        ${paddings[padding]}
        ${hover ? "hover:shadow-lg hover:border-zinc-300 transition-all duration-200 cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
