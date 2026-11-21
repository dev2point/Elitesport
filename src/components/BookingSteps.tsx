const steps = [
  "Choisissez un jour et un créneau d'une heure.",
  "Bloquez-le 15 minutes et indiquez le nom de votre équipe.",
  "Confirmez sur WhatsApp avec l'acompte de 30 %.",
];

export function BookingSteps() {
  return (
    <section
      aria-labelledby="booking-steps-title"
      className="mx-auto max-w-5xl px-3.5 pb-16 sm:px-4 md:pb-24"
    >
      <h2
        id="booking-steps-title"
        className="font-display text-2xl font-semibold text-ink"
      >
        Comment réserver
      </h2>

      <ol className="mt-6 grid gap-8 md:grid-cols-3 md:gap-12">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className="font-display text-2xl font-bold text-line-strong"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="text-base leading-relaxed text-ink">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
