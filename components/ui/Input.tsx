"use client"

import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 text-sm rounded-xl border transition-colors duration-150
            bg-white
            text-zinc-900
            placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#2a5cff)] focus:border-transparent
            ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-zinc-300"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-zinc-400">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
export default Input
