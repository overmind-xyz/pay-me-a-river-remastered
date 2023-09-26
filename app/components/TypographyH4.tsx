export default function TypographyH4(props: {children: React.ReactNode, classname?: string }) {
  return (
    <h4 className={`scroll-m-20 text-xl font-semibold tracking-tight ${props.classname}`}>
      {props.children}
    </h4>
  );
}
