import Container from "@/components/Container";
import CareersForm from "@/components/CareersForm";

export default function CareersPage() {
  return (
    <main className="bg-[#eaf6f6]">
      {/* HERO */}
      <section className="px-4 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#dbe9e8] shadow-sm">
              {/* Spark icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#223433]"
                aria-hidden="true"
              >
                <path
                  d="M12 2l1.8 4.6L18 8l-4.2 1.4L12 14l-1.8-4.6L6 8l4.2-1.4L12 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-semibold text-[#223433] sm:text-5xl md:text-6xl">
              Careers at Prowess Digital Solutions
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#4d5f5e] md:text-xl">
              We value structured thinkers — people who care about clarity,
              quality, and long-term work. If you like doing things properly,
              you’ll fit in.
            </p>
          </div>
        </Container>
      </section>

      {/* WHY WORK WITH US */}
      <section className="px-4 pb-10">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-[#dbe9e8] bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-[#223433]">
                Why you should work with us
              </h2>
              <p className="mt-2 text-[#4d5f5e]">
                We build with structure, not stress. We focus on clear work, not
                noise.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Clear expectations",
                    desc: "You will know what success looks like. No guessing.",
                  },
                  {
                    title: "Structured workflow",
                    desc: "We use simple systems so work stays organised.",
                  },
                  {
                    title: "Real growth",
                    desc: "You will learn, improve, and get better at your craft.",
                  },
                  {
                    title: "Respect for focus",
                    desc: "We value deep work, not last-minute panic.",
                  },
                  {
                    title: "Meaningful impact",
                    desc: "Your work helps real businesses run better.",
                  },
                  {
                    title: "Supportive culture",
                    desc: "We communicate clearly and treat people fairly.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-[#dbe9e8] bg-[#f7fcfc] p-5"
                  >
                    <h3 className="font-semibold text-[#223433]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4d5f5e]">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW WE WORK */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#dbe9e8] bg-white p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-[#223433]">
                  How we work
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#4d5f5e]">
                  <li>• We set clear goals before we start.</li>
                  <li>• We keep communication simple and direct.</li>
                  <li>• We document decisions so nothing gets lost.</li>
                  <li>• We focus on quality and steady progress.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#dbe9e8] bg-white p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-[#223433]">
                  What we look for
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#4d5f5e]">
                  <li>• You can communicate clearly.</li>
                  <li>• You can follow systems and also improve them.</li>
                  <li>• You take ownership and deliver on time.</li>
                  <li>• You care about doing work properly.</li>
                </ul>
              </div>
            </div>

            {/* OPENINGS */}
            <div className="mt-6 rounded-2xl border border-[#dbe9e8] bg-white p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-[#223433]">
                Current openings
              </h3>
              <p className="mt-2 text-[#4d5f5e]">
                No open roles at the moment. You can join our talent pool below.
              </p>
            </div>

            {/* FORM */}
            <div className="mt-6 rounded-2xl border border-[#dbe9e8] bg-white p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-[#223433]">
                Join our talent pool
              </h3>
              <p className="mt-2 text-[#4d5f5e]">
                Send your details and your CV. We will reach out when a role
                matches your profile.
              </p>

              <div className="mt-6">
                <CareersForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
