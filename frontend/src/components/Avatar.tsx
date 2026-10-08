type AvatarProps = {
  name: string
  photo: string | null
  className: string
  alt?: string
}

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** Foto do funcionário ou, sem foto cadastrada, as iniciais do nome. */
export default function Avatar({ name, photo, className, alt = '' }: AvatarProps) {
  if (photo) return <img className={className} src={photo} alt={alt} />
  return (
    <span className={`${className} avatar-initials`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {initials(name)}
    </span>
  )
}
