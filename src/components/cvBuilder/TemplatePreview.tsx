function Lines({ count = 3, dense = false }: { count?: number; dense?: boolean }) {
  return (
    <div className={dense ? "space-y-1" : "space-y-1.5"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full bg-muted-foreground/25 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-2/3"}`} />
      ))}
    </div>
  );
}

function SectionRule({ wide = false }: { wide?: boolean }) {
  return <div className={`h-1.5 rounded-full bg-primary/55 ${wide ? "w-full" : "w-2/5"}`} />;
}

export function TemplatePreview({ templateKey }: { templateKey: string }) {
  if (templateKey === "creative") {
    return (
      <div className="grid h-full grid-cols-[32%_1fr] bg-card text-foreground">
        <div className="bg-primary p-2">
          <div className="h-8 rounded-sm bg-primary-foreground/90" />
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 rounded-full bg-primary-foreground/70" />
            <div className="h-1.5 w-3/4 rounded-full bg-primary-foreground/50" />
            <div className="h-1.5 w-4/5 rounded-full bg-primary-foreground/50" />
          </div>
          <div className="mt-5 grid gap-1">
            <div className="h-2 rounded-sm bg-primary-foreground/50" />
            <div className="h-2 rounded-sm bg-primary-foreground/35" />
            <div className="h-2 rounded-sm bg-primary-foreground/35" />
          </div>
        </div>
        <div className="p-3">
          <div className="h-4 w-4/5 rounded-sm bg-foreground/85" />
          <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-muted-foreground/35" />
          <div className="mt-4 space-y-3">
            <SectionRule />
            <Lines count={3} />
            <SectionRule />
            <Lines count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (templateKey === "executive" || templateKey === "academic") {
    return (
      <div className="h-full bg-card p-4 text-center text-foreground">
        <div className="mx-auto h-5 w-4/5 rounded-sm bg-foreground/85" />
        <div className="mx-auto mt-2 h-px w-3/4 bg-border" />
        <div className="mx-auto mt-2 h-1.5 w-2/3 rounded-full bg-muted-foreground/35" />
        <div className="mt-5 space-y-4 text-left">
          <div>
            <SectionRule wide={templateKey === "academic"} />
            <div className="mt-2">
              <Lines count={templateKey === "academic" ? 4 : 3} />
            </div>
          </div>
          <div>
            <SectionRule />
            <div className="mt-2">
              <Lines count={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (templateKey === "tech") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <div className="h-5 w-3/4 rounded-sm bg-foreground/85" />
        <div className="mt-2 h-1.5 w-5/6 rounded-full bg-muted-foreground/30" />
        <div className="mt-4 grid grid-cols-3 gap-1">
          <div className="h-3 rounded-sm bg-primary/55" />
          <div className="h-3 rounded-sm bg-primary/35" />
          <div className="h-3 rounded-sm bg-primary/25" />
          <div className="h-3 rounded-sm bg-primary/25" />
          <div className="h-3 rounded-sm bg-primary/45" />
          <div className="h-3 rounded-sm bg-primary/25" />
        </div>
        <div className="mt-4 space-y-3">
          <SectionRule />
          <Lines count={3} />
          <SectionRule />
          <Lines count={2} />
        </div>
      </div>
    );
  }

  if (templateKey === "compact") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <div className="flex items-baseline justify-between gap-2">
          <div className="h-4 w-1/2 rounded-sm bg-foreground/85" />
          <div className="h-1.5 w-1/4 rounded-full bg-muted-foreground/35" />
        </div>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <SectionRule />
              <div className="mt-1">
                <Lines count={2} dense />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templateKey === "modern" || templateKey === "graduate") {
    return (
      <div className="h-full bg-card text-foreground">
        <div className="bg-primary/15 p-3">
          <div className="h-5 w-4/5 rounded-sm bg-foreground/85" />
          <div className="mt-2 h-1.5 w-2/3 rounded-full bg-primary/55" />
        </div>
        <div className="p-3">
          {templateKey === "graduate" ? (
            <div className="mb-3 rounded-sm bg-muted p-2">
              <SectionRule wide />
              <div className="mt-2">
                <Lines count={2} dense />
              </div>
            </div>
          ) : null}
          <div className="space-y-3">
            <SectionRule />
            <Lines count={3} />
            <SectionRule />
            <Lines count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (templateKey === "consulting") {
    return (
      <div className="h-full bg-card p-3 text-foreground">
        <div className="h-5 w-4/5 rounded-sm bg-foreground/85" />
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="h-8 rounded-sm bg-primary/45" />
          <div className="h-8 rounded-sm bg-primary/30" />
          <div className="h-8 rounded-sm bg-primary/20" />
        </div>
        <div className="mt-4 space-y-3">
          <SectionRule wide />
          <Lines count={4} />
          <SectionRule />
          <Lines count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-card p-4 text-foreground">
      <div className="h-5 w-4/5 rounded-sm bg-foreground/85" />
      <div className="mt-2 h-1.5 w-2/3 rounded-full bg-muted-foreground/35" />
      <div className="mt-4 h-px bg-border" />
      <div className="mt-4 space-y-4">
        <div>
          <SectionRule />
          <div className="mt-2">
            <Lines count={3} />
          </div>
        </div>
        <div>
          <SectionRule />
          <div className="mt-2">
            <Lines count={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
