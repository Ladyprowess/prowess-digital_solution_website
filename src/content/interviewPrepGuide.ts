// Static editorial content shown on /tools/interview-prep alongside the
// admin-authored question library. Unlike the Q&A library (interview_questions
// table, editable at /admin/interview-prep), this guide is fixed copy - it
// isn't meant to be downloaded as a file, only read in place on the page.

export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "qa"; question: string; answer: string };

export type GuideSubsection = {
  number?: string;
  heading?: string;
  blocks: GuideBlock[];
};

export type GuideStageKey = "before" | "during" | "after";

export type GuideSection = {
  id: string;
  title: string;
  /** Only set for the three numbered stage sections - drives the stage tracker. */
  stage?: GuideStageKey;
  subsections: GuideSubsection[];
};

export const GUIDE_STAGES: { key: GuideStageKey; label: string; description: string }[] = [
  { key: "before", label: "Before the interview", description: "Research, preparation, and practice" },
  { key: "during", label: "During the interview", description: "Delivery, confidence, and connection" },
  { key: "after", label: "After the interview", description: "Follow-up and keeping the door open" },
];

export const INTERVIEW_PREP_GUIDE: GuideSection[] = [
  {
    id: "why-it-matters",
    title: "Why Interview Preparation Matters",
    subsections: [
      {
        blocks: [
          { type: "paragraph", text: "An interview is not just a test of your knowledge, it’s a conversation to see if you’re the right fit. Employers want to know if you can:" },
          {
            type: "bullets",
            items: [
              "Do the job well",
              "Communicate effectively in a remote setup",
              "Align with their company culture and values",
            ],
          },
          { type: "paragraph", text: "Good preparation helps you avoid rambling, makes you sound confident, and shows respect for the employer’s time." },
        ],
      },
    ],
  },
  {
    id: "before",
    title: "Before the Interview",
    stage: "before",
    subsections: [
      {
        number: "1",
        heading: "Research the Company",
        blocks: [
          { type: "paragraph", text: "Employers expect you to know who they are. Do some digging:" },
          {
            type: "bullets",
            items: [
              "What does the company do?",
              "Who are their clients or customers?",
              "What is their mission or vision?",
              "What recent news or projects have they announced?",
            ],
          },
          { type: "paragraph", text: "This allows you to tailor your answers. Instead of “I like working with teams,” you can say, “I admire how your team prioritizes collaboration in remote settings, and I enjoy working in that kind of environment.”" },
        ],
      },
      {
        number: "2",
        heading: "Research the Role",
        blocks: [
          { type: "paragraph", text: "Carefully read the job description. Highlight the skills they emphasize, and prepare stories from your experience that prove you have those skills." },
        ],
      },
      {
        number: "3",
        heading: "Prepare Your Setup",
        blocks: [
          { type: "paragraph", text: "Remote interviews depend on technology. Test everything:" },
          {
            type: "bullets",
            items: ["Internet connection", "Webcam and microphone", "Lighting (natural light is best)", "Quiet environment"],
          },
          { type: "paragraph", text: "First impressions in remote interviews are partly shaped by how “ready” you look on camera." },
        ],
      },
      {
        number: "4",
        heading: "Gather Your Tools",
        blocks: [
          { type: "paragraph", text: "Before the call, have these ready:" },
          {
            type: "bullets",
            items: [
              "A copy of your resume and cover letter",
              "Notes about the company and role",
              "A pen and notebook for quick notes",
              "A glass of water",
              "A list of questions to ask at the end",
            ],
          },
        ],
      },
      {
        number: "5",
        heading: "Practice Your Pitch Out Loud",
        blocks: [
          { type: "paragraph", text: "Don’t just think about your answers -say them out loud. Practicing helps you hear if you’re rambling, speaking too fast, or sounding flat." },
        ],
      },
    ],
  },
  {
    id: "during",
    title: "During the Interview",
    stage: "during",
    subsections: [
      {
        number: "1",
        heading: "Making a Strong First Impression",
        blocks: [
          { type: "paragraph", text: "The first 30 seconds matter. Smile, greet them warmly, and thank them for the opportunity. Even if you’re nervous, start with energy -you’ll settle into calmness as you go." },
        ],
      },
      {
        number: "2",
        heading: "Common Interview Questions",
        blocks: [
          { type: "paragraph", text: "We’ve covered some of the most popular ones (Tell me about yourself, Why do you want this role, etc.). But here are additional common questions many forget to prepare for:" },
          {
            type: "bullets",
            items: [
              "How do you handle working with difficult teammates or clients?",
              "Tell me about a time you missed a deadline. What happened and how did you fix it?",
              "How do you prioritize tasks when you have multiple deadlines?",
              "How do you stay productive when working remotely?",
            ],
          },
          { type: "paragraph", text: "Notice how many of these are about problem-solving and self-management. Employers want to see if you’ll thrive in a remote setup without hand-holding." },
        ],
      },
      {
        number: "3",
        heading: "Personal Pitching (Your Elevator Pitch)",
        blocks: [
          { type: "paragraph", text: "Your pitch can be used in multiple ways:" },
          {
            type: "bullets",
            items: ["As your introduction in interviews", "When networking with recruiters on LinkedIn", "When sending cold emails for opportunities"],
          },
          { type: "paragraph", text: "Keep it under one minute and always end with why you’re excited about the opportunity." },
        ],
      },
      {
        number: "4",
        heading: "Using Storytelling to Stand Out",
        blocks: [
          { type: "paragraph", text: "When everyone else gives generic answers, your story will make you memorable. Make sure your stories:" },
          {
            type: "bullets",
            items: ["Show your skill in action", "End with a positive result", "Highlight teamwork, leadership, or problem-solving"],
          },
        ],
      },
      {
        number: "5",
        heading: "Handling Tough Questions",
        blocks: [
          { type: "paragraph", text: "Sometimes interviewers ask difficult or tricky questions:" },
          { type: "qa", question: "Why did you leave your last job?", answer: "Be honest, but stay positive. Avoid speaking badly about past employers. Example: “I was ready to grow in new directions, and I’m excited about the opportunities your role offers.”" },
          { type: "qa", question: "Why should we hire you?", answer: "Frame your answer around the value you’ll bring. Example: “I bring three years of experience in customer service, plus a passion for building great client relationships. That combination allows me to deliver results quickly while also making customers feel valued.”" },
          { type: "qa", question: "What’s your salary expectation?", answer: "This can be tricky. If possible, research average salaries for the role beforehand. A safe approach: “I’m flexible and open to discussing a range that’s fair based on my skills and the value I’ll bring.”" },
        ],
      },
      {
        number: "6",
        heading: "Body Language and Confidence",
        blocks: [
          { type: "paragraph", text: "Confidence in a remote interview looks like this:" },
          {
            type: "bullets",
            items: ["Sitting upright", "Smiling naturally", "Speaking clearly", "Pausing instead of rushing", "Nodding while the interviewer speaks to show you’re engaged"],
          },
          { type: "paragraph", text: "Remember: confidence is not about being perfect. It’s about being calm, prepared, and showing that you’re interested in the role." },
        ],
      },
    ],
  },
  {
    id: "after",
    title: "After the Interview",
    stage: "after",
    subsections: [
      {
        number: "1",
        heading: "Thank-You Message",
        blocks: [
          { type: "paragraph", text: "Always send a thank-you email within 24 hours. Keep it short but thoughtful:" },
          {
            type: "bullets",
            items: ["Thank them for the interview", "Mention something specific you enjoyed about the conversation", "Reaffirm your interest in the role"],
          },
          { type: "paragraph", text: "This small step makes you stand out, because not everyone does it." },
        ],
      },
      {
        number: "2",
        heading: "Reflection",
        blocks: [
          { type: "paragraph", text: "After each interview, take notes:" },
          {
            type: "bullets",
            items: ["What questions did they ask?", "Which answers felt strong?", "Where did you struggle?"],
          },
          { type: "paragraph", text: "This helps you improve for the next interview." },
        ],
      },
      {
        number: "3",
        heading: "Follow-Up",
        blocks: [
          { type: "paragraph", text: "If you don’t hear back after the time they gave you, send a polite follow-up. For example:" },
          { type: "paragraph", text: "“Hello [Name], I hope you’re doing well. I wanted to kindly follow up on the [Role] interview we had on [Date]. I’m still very interested and excited about the possibility of joining your team.”" },
        ],
      },
    ],
  },
  {
    id: "checklist",
    title: "The Ultimate Checklist for Remote Interview Success",
    subsections: [
      {
        blocks: [
          { type: "paragraph", text: "Before your next interview, ask yourself:" },
          {
            type: "bullets",
            items: [
              "Have I researched the company and role?",
              "Do I know my pitch and practice my answers?",
              "Is my tech setup ready and tested?",
              "Do I have stories prepared for common questions?",
              "Am I ready to send a thank-you note after?",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mindset",
    title: "The Mindset Shift You Need Before Starting",
    subsections: [
      {
        blocks: [
          {
            type: "bullets",
            items: [
              "Stop thinking remote jobs are “out of reach” -they are not reserved for tech experts. Many roles only require skills you already have.",
              "Replace “I’m not experienced enough” with “I can learn, adapt, and grow.” Companies hire for potential and problem-solving, not just years of experience.",
              "Shift from waiting for opportunities to creating them -reach out, network, and pitch yourself instead of only applying passively.",
              "Understand that rejection is not failure -it’s redirection. Every “no” is part of the journey to your “yes.”",
              "Stop undervaluing your skills. What feels normal to you (organizing, writing emails, managing tasks) may be highly valuable to someone else.",
              "Move from “I just want a job” to “I want the right job” -one that aligns with your goals, values, and lifestyle.",
              "Believe you deserve a seat at the table. Confidence in your worth is what will set you apart in interviews, negotiations, and opportunities.",
            ],
          },
        ],
      },
    ],
  },
];
