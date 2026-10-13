# Prowess page and feature inventory

Audit date: 13 October 2026. Source baseline: commit `8b27a4b`. Classifications are provisional recommendations, not deletion or migration instructions. Every App Router page is listed below; API handlers and static HTML routes follow.

Dependencies are statically detected `.from()` targets across local imports, which may include Storage buckets and shared helper tables. This is a dependency map, not a claim that each dependency was exercised. Dynamic table names, runtime configuration, layouts and external services require the accompanying flow review. A dash means no literal target was detected, not that the feature has no dependencies.

Keep means preserve; Improve means preserve and correct; Separate means keep internal operations distinct from public discovery. No route is recommended for retirement without usage and ownership evidence.

## Pages

| URL pattern | Source file | Classification | Data or storage dependencies | SEO implication | Reason |
| --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Improve | career_paths, courses, events, jobs, opportunities, resources | Covered by current sitemap generator. | Retain four audiences and validate navigation and data loading. |
| `/about` | `src/app/about/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |
| `/account` | `src/app/account/(dashboard)/page.tsx` | Keep | learning_progress, member_profiles, profiles, saved_items, user_career_interests | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/achievements` | `src/app/account/(dashboard)/achievements/page.tsx` | Keep | badges, learner_stats, user_badges | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/certificates` | `src/app/account/(dashboard)/certificates/page.tsx` | Keep | certificates | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/cvs` | `src/app/account/(dashboard)/cvs/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/interests` | `src/app/account/(dashboard)/interests/page.tsx` | Keep | career_paths, user_career_interests | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/learning` | `src/app/account/(dashboard)/learning/page.tsx` | Keep | courses, learning_progress, quiz_attempts, saved_items, video_progress | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/login` | `src/app/account/login/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/membership` | `src/app/account/(dashboard)/membership/page.tsx` | Keep | site_settings | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/purchases` | `src/app/account/(dashboard)/purchases/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/saved` | `src/app/account/(dashboard)/saved/page.tsx` | Keep | saved_items | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/settings` | `src/app/account/(dashboard)/settings/page.tsx` | Keep | member_profiles | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/account/signup` | `src/app/account/signup/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/admin` | `src/app/admin/page.tsx` | Separate | events, member_profiles, purchases | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/achievements` | `src/app/admin/achievements/page.tsx` | Separate | achievement_point_rules, badges | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/assignments` | `src/app/admin/assignments/page.tsx` | Separate | assignment_submissions, assignments, courses, member_profiles | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths` | `src/app/admin/career-paths/page.tsx` | Separate | career_paths | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths/[id]` | `src/app/admin/career-paths/[id]/page.tsx` | Separate | career_path_course_map, career_path_resource_map, career_path_skill_map, career_path_tool_map, career_paths, courses, resources, saved_items, skills, tools | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths/[id]/projects` | `src/app/admin/career-paths/[id]/projects/page.tsx` | Separate | career_path_project_skill_map, career_path_projects, career_path_skill_map, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths/[id]/responsibilities` | `src/app/admin/career-paths/[id]/responsibilities/page.tsx` | Separate | career_path_responsibilities | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths/[id]/roadmap` | `src/app/admin/career-paths/[id]/roadmap/page.tsx` | Separate | career_path_roadmap_stage_skill_map, career_path_roadmap_stages, career_path_skill_map | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/career-paths/[id]/roles` | `src/app/admin/career-paths/[id]/roles/page.tsx` | Separate | career_path_role_skill_map, career_path_roles, career_path_skill_map, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/careers` | `src/app/admin/careers/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/case-studies/new` | `src/app/admin/case-studies/new/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/clients` | `src/app/admin/clients/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/community` | `src/app/admin/community/page.tsx` | Separate | content_reports, member_profiles | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/companies` | `src/app/admin/companies/page.tsx` | Separate | companies, jobs | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/consultations` | `src/app/admin/consultations/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/events` | `src/app/admin/events/page.tsx` | Separate | events | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/events/[id]/archive` | `src/app/admin/events/[id]/archive/page.tsx` | Separate | events | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/events/[id]/feedback` | `src/app/admin/events/[id]/feedback/page.tsx` | Separate | event_feedback, events | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/events/[id]/registrations` | `src/app/admin/events/[id]/registrations/page.tsx` | Separate | event_registrations | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/interview-prep` | `src/app/admin/interview-prep/page.tsx` | Separate | interview_questions | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/learn` | `src/app/admin/learn/page.tsx` | Separate | course_skill_map, courses, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/learn/[id]` | `src/app/admin/learn/[id]/page.tsx` | Separate | assignments, course_completion_rules, course_lessons, course_modules, courses, quizzes | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/learn/[id]/assignment/[assignmentId]` | `src/app/admin/learn/[id]/assignment/[assignmentId]/page.tsx` | Separate | assignments, course_lessons, quizzes | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/learn/[id]/quiz/[quizId]` | `src/app/admin/learn/[id]/quiz/[quizId]/page.tsx` | Separate | quiz_options, quiz_questions, quizzes | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/opportunities` | `src/app/admin/opportunities/page.tsx` | Separate | job_sources, opportunities, opportunity_skill_map, opportunity_types, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/purchases` | `src/app/admin/purchases/page.tsx` | Separate | purchases | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/resources` | `src/app/admin/resources/page.tsx` | Separate | resource-covers, resource-mockups, resource_mockups, resource_skill_map, resources, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Separate | site_settings | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/skills` | `src/app/admin/skills/page.tsx` | Separate | skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/tools` | `src/app/admin/tools/page.tsx` | Separate | tools | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/users` | `src/app/admin/users/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/admin/work` | `src/app/admin/work/page.tsx` | Separate | companies, job_categories, job_skill_map, job_sources, job_types, jobs, skills | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/blog` | `src/app/blog/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |
| `/career-paths` | `src/app/career-paths/page.tsx` | Improve | career_path_course_map, career_path_skill_map, career_paths, job_skill_map | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Useful content journey; address findings in the audit before promotion. |
| `/career-paths/[slug]` | `src/app/career-paths/[slug]/page.tsx` | Improve | career_path_project_skill_map, career_path_projects, career_path_responsibilities, career_path_roadmap_stage_skill_map, career_path_roadmap_stages, career_path_role_skill_map, career_path_roles, career_path_skill_map, career_path_tool_map, career_paths, course_completions, course_skill_map, courses, event_skill_map, job_skill_map, jobs, learning_progress, opportunities, opportunity_skill_map, resource_skill_map, saved_items, skills, user_career_interests | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Useful content journey; address findings in the audit before promotion. |
| `/case-studies` | `src/app/case-studies/page.tsx` | Improve | — | Covered by current sitemap generator. | Useful content journey; address findings in the audit before promotion. |
| `/case-studies/[slug]` | `src/app/case-studies/[slug]/page.tsx` | Improve | case_studies | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Useful content journey; address findings in the audit before promotion. |
| `/certificates/verify/[code]` | `src/app/certificates/verify/[code]/page.tsx` | Keep | certificates | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/consultation` | `src/app/consultation/page.tsx` | Improve | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Clarify commercial scope and validate the complete paid journey. |
| `/consultation/success` | `src/app/consultation/success/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/contact` | `src/app/contact/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Separate | activity_logs, announcements, available_projects, commission_sales, kpi_assignments, kpi_logs, messages, monthly_winners, offline_income, offline_outgoing, payroll_entries, profiles, task_assignments, tasks, weekly_scores, weekly_winners | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/events` | `src/app/events/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |
| `/events/[slug]` | `src/app/events/[slug]/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/events/payment-success` | `src/app/events/payment-success/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/jobs` | `src/app/jobs/page.tsx` | Keep | job_categories, job_skill_map, job_types, jobs, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/jobs/[slug]` | `src/app/jobs/[slug]/page.tsx` | Keep | career_path_skill_map, course_skill_map, event_skill_map, job_skill_map, jobs, opportunity_skill_map, resource_skill_map, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/learn` | `src/app/learn/page.tsx` | Keep | career_paths, course_skill_map, courses, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/learn/[slug]` | `src/app/learn/[slug]/page.tsx` | Keep | career_path_skill_map, course_completions, course_reviews, course_skill_map, courses, discussion_posts, discussion_replies, event_skill_map, job_skill_map, learning_progress, lesson_completions, opportunity_skill_map, resource_skill_map, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/login` | `src/app/login/page.tsx` | Separate | — | Exclude private or transaction pages; verify noindex. | Internal operations; retain functionality and keep outside public discovery. |
| `/opportunities` | `src/app/opportunities/page.tsx` | Keep | opportunities, opportunity_skill_map, opportunity_types, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/opportunities/[slug]` | `src/app/opportunities/[slug]/page.tsx` | Keep | career_path_skill_map, course_skill_map, event_skill_map, job_skill_map, opportunities, opportunity_skill_map, resource_skill_map, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Keep | member_portfolios | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/pricing` | `src/app/pricing/page.tsx` | Improve | payment_plans | Covered by current sitemap generator. | Clarify commercial scope and validate the complete paid journey. |
| `/pricing/success` | `src/app/pricing/success/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/privacy-policy` | `src/app/privacy-policy/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/purchase/success` | `src/app/purchase/success/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/resources` | `src/app/resources/page.tsx` | Improve | — | Covered by current sitemap generator. | Useful content journey; address findings in the audit before promotion. |
| `/resources/[slug]` | `src/app/resources/[slug]/page.tsx` | Improve | career_path_skill_map, checklist_progress, course_skill_map, event_skill_map, job_skill_map, opportunity_skill_map, resource-covers, resource_skill_map, resources, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Useful content journey; address findings in the audit before promotion. |
| `/search` | `src/app/search/page.tsx` | Keep | career_paths, courses, jobs, opportunities, resources | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/services` | `src/app/services/page.tsx` | Improve | — | Covered by current sitemap generator. | Clarify commercial scope and validate the complete paid journey. |
| `/services/[slug]` | `src/app/services/[slug]/page.tsx` | Improve | — | Covered by current sitemap generator. | Clarify commercial scope and validate the complete paid journey. |
| `/skill-to-business` | `src/app/skill-to-business/page.tsx` | Improve | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Clarify commercial scope and validate the complete paid journey. |
| `/skill-to-business/success` | `src/app/skill-to-business/success/page.tsx` | Keep | — | Exclude private or transaction pages; verify noindex. | Preserve account access and transaction return paths; verify authenticated journey. |
| `/skills` | `src/app/skills/page.tsx` | Keep | course_skill_map, job_skill_map, opportunity_skill_map, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/skills/[slug]` | `src/app/skills/[slug]/page.tsx` | Keep | career_path_skill_map, course_completions, course_skill_map, courses, event_skill_map, job_skill_map, jobs, learning_progress, opportunities, opportunity_skill_map, resource_skill_map, saved_items, skills | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/terms-of-service` | `src/app/terms-of-service/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/tools` | `src/app/tools/page.tsx` | Keep | tools | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/business-health-check` | `src/app/tools/business-health-check/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/calculator` | `src/app/tools/calculator/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/cv-builder` | `src/app/tools/cv-builder/page.tsx` | Keep | member_profiles | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/cv-builder/editor` | `src/app/tools/cv-builder/editor/page.tsx` | Keep | member_profiles | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/cv-checker` | `src/app/tools/cv-checker/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/interview-prep` | `src/app/tools/interview-prep/page.tsx` | Keep | member_profiles | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/inventory` | `src/app/tools/inventory/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/invoice` | `src/app/tools/invoice/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/portfolio-builder` | `src/app/tools/portfolio-builder/page.tsx` | Keep | member_profiles | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/reach` | `src/app/tools/reach/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/tools/tracker` | `src/app/tools/tracker/page.tsx` | Keep | — | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain tool until individual usage and output quality are verified. |
| `/videos` | `src/app/videos/page.tsx` | Keep | resources | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/videos/[slug]` | `src/app/videos/[slug]/page.tsx` | Keep | career_path_skill_map, course_skill_map, event_skill_map, job_skill_map, opportunity_skill_map, resource_skill_map, resources, saved_items, skills, video_progress | Not explicitly covered by sitemap; evaluate canonical and indexing intent. | Retain existing audience journey and URL pending usage evidence. |
| `/work-with-us` | `src/app/work-with-us/page.tsx` | Keep | — | Covered by current sitemap generator. | Retain existing audience journey and URL pending usage evidence. |

## API handlers

API URLs are operational endpoints, not search landing pages. Keep unless a specific finding below calls for improvement; exclusion from a sitemap is expected. Route names alone do not establish authentication. This list inventories all handlers; detailed review in this pass focused on content loading and payments.

| URL pattern | Methods | Source file | Data or storage dependencies | Classification |
| --- | --- | --- | --- | --- |
| `/admin/case-studies` | GET, POST | `src/app/admin/case-studies/route.ts` | case_studies | Improve |
| `/api/account/claim-purchases` | POST | `src/app/api/account/claim-purchases/route.ts` | purchases | Keep |
| `/api/account/purchases` | GET | `src/app/api/account/purchases/route.ts` | purchases | Keep |
| `/api/achievements/leaderboard` | GET | `src/app/api/achievements/leaderboard/route.ts` | learner_stats, member_profiles | Keep |
| `/api/achievements/reconcile` | POST | `src/app/api/achievements/reconcile/route.ts` | achievement_point_rules, badges, course_completions, learner_stats, point_events, quiz_attempts, user_badges | Keep |
| `/api/admin/assignments/submissions/[id]/grade` | POST | `src/app/api/admin/assignments/submissions/[id]/grade/route.ts` | achievement_point_rules, assignment_peer_reviews, assignment_submissions, assignments, badges, certificates, course_completion_rules, course_completions, course_lessons, course_modules, courses, learner_stats, learning_progress, lesson_completions, member_profiles, point_events, profiles, purchases, quiz_attempts, quizzes, user_badges | Keep |
| `/api/admin/careers` | GET, PATCH, DELETE | `src/app/api/admin/careers/route.ts` | careers_roles, profiles | Keep |
| `/api/admin/case-studies` | POST | `src/app/api/admin/case-studies/route.ts` | case_studies | Improve |
| `/api/admin/clients` | GET, POST, PATCH, DELETE | `src/app/api/admin/clients/route.ts` | client_codes, profiles | Keep |
| `/api/admin/jobs/import` | POST | `src/app/api/admin/jobs/import/route.ts` | companies, job_categories, job_skill_map, job_sources, job_types, jobs, profiles, skills | Keep |
| `/api/admin/opportunities/import` | POST | `src/app/api/admin/opportunities/import/route.ts` | job_sources, opportunities, opportunity_types, profiles | Keep |
| `/api/admin/users` | GET | `src/app/api/admin/users/route.ts` | member_profiles, profiles, purchases | Keep |
| `/api/assignments/[assignmentId]` | GET | `src/app/api/assignments/[assignmentId]/route.ts` | assignment_peer_reviews, assignment_submissions, assignments, course_completion_rules, course_lessons, course_modules, purchases | Keep |
| `/api/assignments/[assignmentId]/peer-review` | POST | `src/app/api/assignments/[assignmentId]/peer-review/route.ts` | achievement_point_rules, assignment_peer_reviews, assignment_submissions, assignments, badges, certificates, course_completion_rules, course_completions, course_lessons, course_modules, courses, learner_stats, lesson_completions, member_profiles, point_events, purchases, quiz_attempts, quizzes, user_badges | Keep |
| `/api/assignments/[assignmentId]/peer-review/next` | GET | `src/app/api/assignments/[assignmentId]/peer-review/next/route.ts` | assignment_peer_reviews, assignment_submissions, assignments, course_lessons, course_modules, purchases | Keep |
| `/api/assignments/[assignmentId]/submissions` | POST | `src/app/api/assignments/[assignmentId]/submissions/route.ts` | achievement_point_rules, assignment-submissions, assignment_peer_reviews, assignment_submissions, assignments, badges, certificates, course_completion_rules, course_completions, course_lessons, course_modules, courses, learner_stats, learning_progress, lesson_completions, member_profiles, point_events, purchases, quiz_attempts, quizzes, user_badges | Keep |
| `/api/assignments/submissions/[id]/file` | GET | `src/app/api/assignments/submissions/[id]/file/route.ts` | assignment-submissions, assignment_peer_reviews, assignment_submissions, assignments, course_lessons, course_modules, profiles, purchases | Keep |
| `/api/business-helper` | POST | `src/app/api/business-helper/route.ts` | — | Keep |
| `/api/business-helper/pdf` | POST | `src/app/api/business-helper/pdf/route.ts` | — | Keep |
| `/api/business-helper/save` | POST | `src/app/api/business-helper/save/route.ts` | business_helper_reports | Keep |
| `/api/careers` | POST | `src/app/api/careers/route.ts` | cvs, talent_pool_submissions | Keep |
| `/api/careers/roles` | GET, POST | `src/app/api/careers/roles/route.ts` | careers_roles | Keep |
| `/api/careers/subscribe` | POST | `src/app/api/careers/subscribe/route.ts` | — | Keep |
| `/api/case-studies` | GET, POST | `src/app/api/case-studies/route.ts` | case_studies | Improve |
| `/api/case-studies/insert` | POST | `src/app/api/case-studies/insert/route.ts` | case_studies | Improve |
| `/api/certificates/[id]/pdf` | POST | `src/app/api/certificates/[id]/pdf/route.ts` | certificates | Keep |
| `/api/community/discussions` | POST | `src/app/api/community/discussions/route.ts` | course_lessons, course_modules, discussion_posts, member_profiles, purchases | Keep |
| `/api/community/discussions/[postId]/replies` | POST | `src/app/api/community/discussions/[postId]/replies/route.ts` | discussion_posts, discussion_replies, member_profiles, purchases | Keep |
| `/api/community/report` | POST | `src/app/api/community/report/route.ts` | content_reports | Keep |
| `/api/community/reviews` | POST | `src/app/api/community/reviews/route.ts` | course_completions, course_reviews, member_profiles, purchases | Keep |
| `/api/consultations/admin/bookings` | GET | `src/app/api/consultations/admin/bookings/route.ts` | consultation_bookings | Keep |
| `/api/consultations/book` | POST | `src/app/api/consultations/book/route.ts` | consultation_bookings, consultation_services, payment_plans | Keep |
| `/api/consultations/confirm` | POST | `src/app/api/consultations/confirm/route.ts` | consultation_bookings, consultation_services | Keep |
| `/api/consultations/services` | GET | `src/app/api/consultations/services/route.ts` | consultation_services | Keep |
| `/api/consultations/verify-payment` | POST | `src/app/api/consultations/verify-payment/route.ts` | consultation_bookings, consultation_services, payment_plans | Keep |
| `/api/contact` | POST | `src/app/api/contact/route.ts` | contact_messages | Keep |
| `/api/content/access` | POST | `src/app/api/content/access/route.ts` | course_modules, purchases, resources | Keep |
| `/api/content/checkout` | POST | `src/app/api/content/checkout/route.ts` | payment_plans, purchases, resource_mockups | Keep |
| `/api/content/verify` | POST | `src/app/api/content/verify/route.ts` | payment_plans, purchases, resource_mockups | Keep |
| `/api/courses/[courseId]/evaluate-completion` | POST | `src/app/api/courses/[courseId]/evaluate-completion/route.ts` | achievement_point_rules, assignment_peer_reviews, assignment_submissions, assignments, badges, certificates, course_completion_rules, course_completions, course_lessons, course_modules, courses, learner_stats, lesson_completions, member_profiles, point_events, purchases, quiz_attempts, quizzes, user_badges | Keep |
| `/api/create-member` | POST | `src/app/api/create-member/route.ts` | profiles | Keep |
| `/api/cv-builder/pdf` | POST | `src/app/api/cv-builder/pdf/route.ts` | member_cvs, payment_plans, premium_membership_subscriptions | Keep |
| `/api/cv-builder/save` | GET, POST, DELETE | `src/app/api/cv-builder/save/route.ts` | member_cvs, payment_plans, premium_membership_subscriptions | Keep |
| `/api/cv-checker` | POST | `src/app/api/cv-checker/route.ts` | cv_checker_submissions, cvs, payment_plans, premium_membership_subscriptions | Keep |
| `/api/disable-member` | POST | `src/app/api/disable-member/route.ts` | profiles, task_assignments, tasks | Keep |
| `/api/enable-member` | POST | `src/app/api/enable-member/route.ts` | profiles | Keep |
| `/api/events` | GET | `src/app/api/events/route.ts` | events | Keep |
| `/api/events/archive` | GET, POST | `src/app/api/events/archive/route.ts` | event_media, events | Keep |
| `/api/events/archive/[id]` | DELETE | `src/app/api/events/archive/[id]/route.ts` | event_media | Keep |
| `/api/events/create` | POST | `src/app/api/events/create/route.ts` | events, newsletter_subscribers | Keep |
| `/api/events/feedback` | GET, POST | `src/app/api/events/feedback/route.ts` | event_feedback, event_registrations, events | Keep |
| `/api/events/feedback/verify` | POST | `src/app/api/events/feedback/verify/route.ts` | event_registrations, events | Keep |
| `/api/events/get-by-slug` | GET | `src/app/api/events/get-by-slug/route.ts` | event_registrations, events | Keep |
| `/api/events/register` | POST | `src/app/api/events/register/route.ts` | event_registrations, events, payment_plans | Keep |
| `/api/events/registrations/counts` | GET | `src/app/api/events/registrations/counts/route.ts` | event_registrations | Keep |
| `/api/events/verify-payment` | POST | `src/app/api/events/verify-payment/route.ts` | event_registrations, events, payment_plans | Keep |
| `/api/flutterwave/webhook` | POST | `src/app/api/flutterwave/webhook/route.ts` | client_codes, consultation_bookings, consultation_services, event_registrations, events, membership_subscriptions, payment_plans, premium_membership_subscriptions, purchases, resource_mockups, skill_to_business_purchases | Keep |
| `/api/interview-prep` | GET | `src/app/api/interview-prep/route.ts` | interview_questions, payment_plans, premium_membership_subscriptions | Keep |
| `/api/leads` | POST | `src/app/api/leads/route.ts` | leads | Keep |
| `/api/memberships/checkout` | POST | `src/app/api/memberships/checkout/route.ts` | membership_subscriptions, payment_plans | Keep |
| `/api/memberships/verify` | POST | `src/app/api/memberships/verify/route.ts` | client_codes, membership_subscriptions, payment_plans | Keep |
| `/api/notify-announcement` | POST | `src/app/api/notify-announcement/route.ts` | — | Keep |
| `/api/notify-commission` | POST | `src/app/api/notify-commission/route.ts` | — | Keep |
| `/api/notify-dashboard-admin` | POST | `src/app/api/notify-dashboard-admin/route.ts` | — | Keep |
| `/api/notify-mention` | POST | `src/app/api/notify-mention/route.ts` | — | Keep |
| `/api/notify-month-winner` | POST | `src/app/api/notify-month-winner/route.ts` | — | Keep |
| `/api/notify-payroll` | POST | `src/app/api/notify-payroll/route.ts` | — | Keep |
| `/api/notify-task` | POST | `src/app/api/notify-task/route.ts` | — | Keep |
| `/api/portfolio-builder/pdf` | POST | `src/app/api/portfolio-builder/pdf/route.ts` | member_portfolios | Keep |
| `/api/portfolio-builder/save` | GET, POST, DELETE | `src/app/api/portfolio-builder/save/route.ts` | member_portfolios, payment_plans, premium_membership_subscriptions | Keep |
| `/api/portfolio-builder/upload` | POST | `src/app/api/portfolio-builder/upload/route.ts` | payment_plans, portfolio-media, premium_membership_subscriptions | Keep |
| `/api/premium-membership/checkout` | GET, POST | `src/app/api/premium-membership/checkout/route.ts` | member_profiles, payment_plans, premium_membership_subscriptions, site_settings | Keep |
| `/api/premium-membership/verify` | POST | `src/app/api/premium-membership/verify/route.ts` | payment_plans, premium_membership_subscriptions | Keep |
| `/api/quizzes/[quizId]` | GET | `src/app/api/quizzes/[quizId]/route.ts` | assignments, course_lessons, course_modules, purchases, quiz_attempts, quiz_options, quiz_questions, quizzes | Keep |
| `/api/quizzes/[quizId]/attempts` | POST | `src/app/api/quizzes/[quizId]/attempts/route.ts` | assignments, course_lessons, course_modules, purchases, quiz_attempt_questions, quiz_attempts, quiz_questions, quizzes | Keep |
| `/api/quizzes/[quizId]/attempts/[attemptId]/answers` | POST | `src/app/api/quizzes/[quizId]/attempts/[attemptId]/answers/route.ts` | assignments, course_lessons, course_modules, purchases, quiz_answers, quiz_attempt_questions, quiz_attempts, quiz_options, quiz_questions, quizzes | Keep |
| `/api/quizzes/[quizId]/attempts/[attemptId]/submit` | POST | `src/app/api/quizzes/[quizId]/attempts/[attemptId]/submit/route.ts` | achievement_point_rules, assignment_peer_reviews, assignment_submissions, assignments, badges, certificates, course_completion_rules, course_completions, course_lessons, course_modules, courses, learner_stats, learning_progress, lesson_completions, member_profiles, point_events, purchases, quiz_answers, quiz_attempt_questions, quiz_attempts, quiz_questions, quizzes, user_badges | Keep |
| `/api/resources` | GET | `src/app/api/resources/route.ts` | resource-covers, resources | Keep |
| `/api/resources/[id]/file` | GET | `src/app/api/resources/[id]/file/route.ts` | resources | Keep |
| `/api/resources/cover` | POST | `src/app/api/resources/cover/route.ts` | resource-covers | Keep |
| `/api/resources/download` | POST | `src/app/api/resources/download/route.ts` | resources | Keep |
| `/api/skill-to-business/checkout` | POST | `src/app/api/skill-to-business/checkout/route.ts` | payment_plans, skill_to_business_purchases | Keep |
| `/api/skill-to-business/verify` | POST | `src/app/api/skill-to-business/verify/route.ts` | client_codes, payment_plans, skill_to_business_purchases | Keep |
| `/api/subscribe` | POST | `src/app/api/subscribe/route.ts` | newsletter_subscribers | Keep |
| `/api/subscribe/unsubscribe` | GET, POST | `src/app/api/subscribe/unsubscribe/route.ts` | newsletter_subscribers | Keep |
| `/api/tools-data` | GET, POST | `src/app/api/tools-data/route.ts` | client_codes, client_tool_data | Keep |
| `/api/verify-code` | POST | `src/app/api/verify-code/route.ts` | client_codes | Keep |

## Static HTML and legacy routes

| URL | Source | Classification and reason | SEO implication |
| --- | --- | --- | --- |
| `/google0e616ddb1b051351.html` | `public/google0e616ddb1b051351.html` | Keep pending review; site verification asset. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/offline.html` | `public/offline.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/pinterest-846c7.html` | `public/pinterest-846c7.html` | Keep pending review; site verification asset. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/tools/business-helper.html` | `public/tools/business-helper.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/tools/business-starter.html` | `public/tools/business-starter.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/tools/business-structure.html` | `public/tools/business-structure.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/tools/customer-support.html` | `public/tools/customer-support.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |
| `/tools/starter-checklist.html` | `public/tools/starter-checklist.html` | Keep pending review; inspect static experience and API dependencies. | Preserve verification files; decide indexing for tools and offline page separately. |

`next.config.ts` rewrites `/tools/business-helper`, `/tools/business-structure` and `/tools/customer-support` to their HTML assets. Preserve both routing and assets until replacement is verified. It redirects `/careers` permanently to `/work-with-us` and `/tools-admin` permanently to `/admin/clients`; retain these redirects.

Coverage: 97 page files, 87 route handlers and 8 static HTML files. No production records were changed.
