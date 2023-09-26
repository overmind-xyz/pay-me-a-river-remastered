export default function TypographyH1(props: { children: React.ReactNode, classname?: string }) {
  return (
    <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${props.classname}`}>
      {props.children}
    </h1>
  );
}
