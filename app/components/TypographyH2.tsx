export default function TypographyH2(props: {children: React.ReactNode, classname?: string }) {
  return (
    <h2 className={`scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0 ${props.classname}`}>
      {props.children}
    </h2>
  );
}
