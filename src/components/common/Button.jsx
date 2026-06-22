const variants = {
  primary: 'bg-brown text-offwhite hover:bg-brown-light',
  secondary: 'bg-nude text-brown hover:bg-nude-dark',
  outline: 'border-2 border-brown text-brown hover:bg-brown hover:text-offwhite',
  ghost: 'text-brown hover:bg-nude/30',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, type = 'button', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-body font-medium rounded-2xl transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
