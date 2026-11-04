import './Button.css'

// Товч — бүх хуудсанд нэг загвартай.
// variant: 'outline' (цагаан, хүрээтэй) | 'primary' (шар) | 'dark' (хар хөх) | 'danger' (улаан бичигтэй)
// size: 'small' — хүснэгт, карт доторх жижиг товч
// as — өөр таг/компонент: <Button as={Link} href="/settings"> — линк боловч товч шиг харагдана
// Бусад prop (onClick, disabled, aria-*) шууд дамжина
export default function Button({ as: Tag = 'button', variant = 'outline', size, className = '', children, ...props }) {
  const classes = ['ui-btn', variant, size, className].filter(Boolean).join(' ')
  const type = Tag === 'button' ? 'button' : undefined // <form> дотор санамсаргүй submit хийхгүй

  return (
    <Tag type={type} className={classes} {...props}>
      {children}
    </Tag>
  )
}
