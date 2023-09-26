export function TypographyP(props: { children: React.ReactNode, classname?: string }) {
  return (
    <p className={`leading-7 [&:not(:first-child)]:mt-6 ${props.classname}`}>
      {props.children}
    </p>
  )
}