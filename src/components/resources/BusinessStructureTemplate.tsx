"use client";

import { useState, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type RoleEntry = {
  title: string;
  name: string;
  responsibilities: string;
  reportsTo: string;
  decisions: string;
};

type StructureData = {
  businessName: string;
  industry: string;
  teamSize: string;
  stage: string;
  founderRole: string;
  founderResponsibilities: string;
  founderDecisions: string;
  roles: RoleEntry[];
  communicationChannels: string;
  meetingRhythm: string;
  escalationProcess: string;
  notes: string;
};

const emptyRole: RoleEntry = {
  title: "",
  name: "",
  responsibilities: "",
  reportsTo: "",
  decisions: "",
};

const initialData: StructureData = {
  businessName: "",
  industry: "",
  teamSize: "",
  stage: "",
  founderRole: "",
  founderResponsibilities: "",
  founderDecisions: "",
  roles: [{ ...emptyRole }],
  communicationChannels: "",
  meetingRhythm: "",
  escalationProcess: "",
  notes: "",
};

/* ------------------------------------------------------------------ */
/*  SECTIONS                                                           */
/* ------------------------------------------------------------------ */

const sections = [
  { id: "overview", label: "Business Overview" },
  { id: "founder", label: "Founder Role" },
  { id: "team", label: "Team Roles" },
  { id: "communication", label: "Communication & Decisions" },
  { id: "export", label: "Review & Export" },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function BusinessStructureTemplate() {
  const [data, setData] = useState<StructureData>(initialData);
  const [activeSection, setActiveSection] = useState(0);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  function updateField(field: keyof StructureData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function updateRole(index: number, field: keyof RoleEntry, value: string) {
    setData((prev) => {
      const roles = [...prev.roles];
      roles[index] = { ...roles[index], [field]: value };
      return { ...prev, roles };
    });
  }

  function addRole() {
    setData((prev) => ({
      ...prev,
      roles: [...prev.roles, { ...emptyRole }],
    }));
  }

  function removeRole(index: number) {
    setData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  }

  function getFilledFieldCount() {
    let count = 0;
    const simple: (keyof StructureData)[] = [
      "businessName", "industry", "teamSize", "stage",
      "founderRole", "founderResponsibilities", "founderDecisions",
      "communicationChannels", "meetingRhythm", "escalationProcess",
    ];
    simple.forEach((f) => { if (data[f] as string) count++; });
    data.roles.forEach((r) => {
      if (r.title) count++;
      if (r.responsibilities) count++;
    });
    return count;
  }

  function generateExportText() {
    let text = `BUSINESS STRUCTURE DOCUMENT\n`;
    text += `${"=".repeat(50)}\n\n`;

    text += `Business Name: ${data.businessName || "(not filled)"}\n`;
    text += `Industry: ${data.industry || "(not filled)"}\n`;
    text += `Team Size: ${data.teamSize || "(not filled)"}\n`;
    text += `Business Stage: ${data.stage || "(not filled)"}\n\n`;

    text += `FOUNDER / LEAD\n`;
    text += `${"-".repeat(30)}\n`;
    text += `Role Title: ${data.founderRole || "(not filled)"}\n`;
    text += `Key Responsibilities:\n${data.founderResponsibilities || "(not filled)"}\n`;
    text += `Decisions Only Founder Makes:\n${data.founderDecisions || "(not filled)"}\n\n`;

    text += `TEAM ROLES\n`;
    text += `${"-".repeat(30)}\n`;
    data.roles.forEach((role, i) => {
      text += `\nRole ${i + 1}: ${role.title || "(not filled)"}\n`;
      text += `  Person: ${role.name || "(not assigned)"}\n`;
      text += `  Responsibilities: ${role.responsibilities || "(not filled)"}\n`;
      text += `  Reports To: ${role.reportsTo || "(not filled)"}\n`;
      text += `  Can Decide: ${role.decisions || "(not filled)"}\n`;
    });

    text += `\nCOMMUNICATION & DECISION FLOW\n`;
    text += `${"-".repeat(30)}\n`;
    text += `Communication Channels: ${data.communicationChannels || "(not filled)"}\n`;
    text += `Meeting Rhythm: ${data.meetingRhythm || "(not filled)"}\n`;
    text += `Escalation Process: ${data.escalationProcess || "(not filled)"}\n`;

    if (data.notes) {
      text += `\nADDITIONAL NOTES\n`;
      text += `${"-".repeat(30)}\n`;
      text += `${data.notes}\n`;
    }

    text += `\n${"=".repeat(50)}\n`;
    text += `Generated using the Business Structure Template\n`;
    text += `by Prowess Digital Solutions | prowessdigitalsolutions.com\n`;

    return text;
  }

  function handleCopyExport() {
    const text = generateExportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const text = generateExportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.businessName || "business"}-structure.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setData(initialData);
    setActiveSection(0);
  }

  const filledCount = getFilledFieldCount();

  return (
    <div className="space-y-6">
      {/* SECTION NAVIGATION */}
      <div className="flex flex-wrap gap-2">
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === i
                ? "bg-[#507c80] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* PROGRESS INDICATOR */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#507c80] transition-all duration-500"
            style={{ width: `${Math.min(100, (filledCount / 16) * 100)}%` }}
          />
        </div>
        <span>{filledCount} fields filled</span>
      </div>

      {/* SECTION: BUSINESS OVERVIEW */}
      {activeSection === 0 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Business Overview
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Start with the basics. This context shapes every structural
              decision that follows.
            </p>
          </div>

          <FieldGroup label="Business Name">
            <input
              type="text"
              value={data.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              placeholder="e.g. Prowess Digital Solutions"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Industry / Sector">
            <input
              type="text"
              value={data.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              placeholder="e.g. Business Consulting, E-commerce, EdTech"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Current Team Size (including you)">
            <input
              type="text"
              value={data.teamSize}
              onChange={(e) => updateField("teamSize", e.target.value)}
              placeholder="e.g. 1, 3, 5, 10+"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Business Stage">
            <select
              value={data.stage}
              onChange={(e) => updateField("stage", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            >
              <option value="">Select your stage</option>
              <option value="idea">Idea / Pre-launch</option>
              <option value="early">Early stage (0 to 12 months)</option>
              <option value="growing">Growing (1 to 3 years)</option>
              <option value="established">Established (3+ years)</option>
              <option value="restructuring">Restructuring / Pivoting</option>
            </select>
          </FieldGroup>

          <NavButtons onNext={() => setActiveSection(1)} />
        </div>
      )}

      {/* SECTION: FOUNDER ROLE */}
      {activeSection === 1 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Founder / Lead Role
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Define your own role first. Most structural confusion starts here.
              What exactly should you be doing, and what should you stop doing?
            </p>
          </div>

          <FieldGroup label="Your Role Title">
            <input
              type="text"
              value={data.founderRole}
              onChange={(e) => updateField("founderRole", e.target.value)}
              placeholder="e.g. Founder & Lead Consultant, CEO, Managing Director"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Your Key Responsibilities (the things only you should handle)">
            <textarea
              value={data.founderResponsibilities}
              onChange={(e) =>
                updateField("founderResponsibilities", e.target.value)
              }
              placeholder="e.g. Business strategy, client relationships, final pricing decisions, partnerships, financial oversight"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Decisions That Only You Should Make">
            <textarea
              value={data.founderDecisions}
              onChange={(e) => updateField("founderDecisions", e.target.value)}
              placeholder="e.g. Hiring and firing, pricing changes above 20%, new service launches, partnership agreements, spending above a certain amount"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <NavButtons
            onPrev={() => setActiveSection(0)}
            onNext={() => setActiveSection(2)}
          />
        </div>
      )}

      {/* SECTION: TEAM ROLES */}
      {activeSection === 2 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Roles</h3>
            <p className="mt-1 text-sm text-slate-500">
              Define each role in your team. If you are a solo founder, think
              about the first one or two roles you would hire for. This helps
              you prepare for delegation even before you are ready.
            </p>
          </div>

          {data.roles.map((role, index) => (
            <div
              key={index}
              className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Role {index + 1}
                </p>
                {data.roles.length > 1 && (
                  <button
                    onClick={() => removeRole(index)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Role Title" compact>
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) =>
                      updateRole(index, "title", e.target.value)
                    }
                    placeholder="e.g. Operations Manager, VA, Content Lead"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
                  />
                </FieldGroup>

                <FieldGroup label="Person (if assigned)" compact>
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) =>
                      updateRole(index, "name", e.target.value)
                    }
                    placeholder="Name or 'To be hired'"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Key Responsibilities" compact>
                <textarea
                  value={role.responsibilities}
                  onChange={(e) =>
                    updateRole(index, "responsibilities", e.target.value)
                  }
                  placeholder="What does this person own? What are they accountable for?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
                />
              </FieldGroup>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Reports To" compact>
                  <input
                    type="text"
                    value={role.reportsTo}
                    onChange={(e) =>
                      updateRole(index, "reportsTo", e.target.value)
                    }
                    placeholder="e.g. Founder, Operations Lead"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
                  />
                </FieldGroup>

                <FieldGroup label="Decisions They Can Make" compact>
                  <input
                    type="text"
                    value={role.decisions}
                    onChange={(e) =>
                      updateRole(index, "decisions", e.target.value)
                    }
                    placeholder="e.g. Scheduling, client comms, task prioritisation"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
                  />
                </FieldGroup>
              </div>
            </div>
          ))}

          <button
            onClick={addRole}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-[#507c80] hover:text-[#507c80]"
          >
            + Add Another Role
          </button>

          <NavButtons
            onPrev={() => setActiveSection(1)}
            onNext={() => setActiveSection(3)}
          />
        </div>
      )}

      {/* SECTION: COMMUNICATION & DECISIONS */}
      {activeSection === 3 && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Communication & Decision Flow
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              How does information move through your business? Clear
              communication channels and a simple escalation process prevent
              most of the confusion that slows teams down.
            </p>
          </div>

          <FieldGroup label="Communication Channels (what do you use and for what purpose)">
            <textarea
              value={data.communicationChannels}
              onChange={(e) =>
                updateField("communicationChannels", e.target.value)
              }
              placeholder="e.g. WhatsApp for quick updates, Email for client communication, Slack for internal tasks, Weekly call for progress review"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Meeting Rhythm">
            <textarea
              value={data.meetingRhythm}
              onChange={(e) => updateField("meetingRhythm", e.target.value)}
              placeholder="e.g. Monday morning check-in (15 min), Friday wrap-up (30 min), Monthly strategy review (1 hour)"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Escalation Process (what happens when someone is stuck or there is a problem)">
            <textarea
              value={data.escalationProcess}
              onChange={(e) =>
                updateField("escalationProcess", e.target.value)
              }
              placeholder="e.g. Try to resolve it yourself first. If unresolved after 24 hours, escalate to your direct report. If urgent, message the founder directly."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <FieldGroup label="Additional Notes (anything else relevant to how your business is structured)">
            <textarea
              value={data.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional. Any context about your current challenges, upcoming changes, or things you want to improve."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#507c80] focus:ring-2 focus:ring-[#507c80]/10"
            />
          </FieldGroup>

          <NavButtons
            onPrev={() => setActiveSection(2)}
            onNext={() => setActiveSection(4)}
          />
        </div>
      )}

      {/* SECTION: REVIEW & EXPORT */}
      {activeSection === 4 && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Review & Export
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Here is a summary of your business structure. You can copy it,
              download it as a text file, or use it as a starting point for a
              more detailed structure document.
            </p>

            <div
              ref={exportRef}
              className="mt-5 max-h-96 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-700"
            >
              <pre className="whitespace-pre-wrap">{generateExportText()}</pre>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleCopyExport}
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Download as Text File
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm text-slate-400 underline hover:text-slate-600"
              >
                Start Over
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm leading-relaxed text-slate-600">
              This template gives you a starting point. If you want help
              designing a structure that fits your specific business, a clarity
              session or business structure setup can take this further.
            </p>
            <a
              href="/consultation"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Book a Clarity Session
            </a>
          </div>

          <NavButtons onPrev={() => setActiveSection(3)} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HELPER COMPONENTS                                                  */
/* ------------------------------------------------------------------ */

function FieldGroup({
  label,
  children,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <label
        className={`block font-medium text-slate-700 ${
          compact ? "mb-1 text-sm" : "mb-2 text-sm"
        }`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function NavButtons({
  onPrev,
  onNext,
}: {
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onPrev ? (
        <button
          onClick={onPrev}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="rounded-xl bg-[#507c80] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Continue
        </button>
      )}
    </div>
  );
}
