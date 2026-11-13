/** Renderiza trechos entre *asteriscos* em serifa itálica com a cor de destaque. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*(.+?)\*/g).map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="font-serif font-normal italic text-accent">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}
