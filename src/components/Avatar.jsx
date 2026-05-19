import { classNames, avatarColor, initials } from '../lib/utils'

export default function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }
  return (
    <div
      title={name}
      className={classNames(
        'rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white',
        avatarColor(name),
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </div>
  )
}

export function AvatarGroup({ names = [], max = 4, size = 'sm' }) {
  const shown = names.slice(0, max)
  const rest  = names.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => <Avatar key={i} name={n} size={size} />)}
      {rest > 0 && (
        <div className={classNames(
          'rounded-full bg-slate-200 text-slate-600 font-semibold ring-2 ring-white flex items-center justify-center',
          size === 'xs' ? 'w-6 h-6 text-[10px]' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
        )}>
          +{rest}
        </div>
      )}
    </div>
  )
}
