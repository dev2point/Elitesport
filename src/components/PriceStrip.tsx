const prices = [
  '06h–17h : 5 000 FCFA',
  '18h–05h : 7 500 FCFA',
  'Acompte : 30 %',
];

export function PriceStrip() {
  return (
    <section
      aria-labelledby="price-strip-title"
      className="border-y border-border-subtle bg-canvas"
    >
      <div className="mx-auto max-w-5xl px-3.5 py-6 sm:px-4 md:py-8">
        <h2 id="price-strip-title" className="sr-only">
          Tarifs
        </h2>
        <dl className="flex flex-col gap-3 text-sm text-ink tabular-nums md:flex-row md:items-center md:gap-0">
          <dt className="sr-only">Tarifs et acompte</dt>
          {prices.map((price, index) => (
            <dd
              key={price}
              className={
                index === 0
                  ? 'font-semibold'
                  : 'font-semibold md:border-l md:border-border-subtle md:pl-6 md:ml-6'
              }
            >
              {price}
            </dd>
          ))}
        </dl>
      </div>
    </section>
  );
}
