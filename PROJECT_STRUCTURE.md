greenfield-academy
├── PROJECT_STRUCTURE.md
├── README.md
├── app
│   ├── about
│   │   └── page.jsx
│   ├── admin
│   │   ├── attendance
│   │   │   └── page.jsx
│   │   ├── classes
│   │   │   └── page.jsx
│   │   ├── dashboard
│   │   │   └── page.jsx
│   │   ├── events
│   │   │   └── page.jsx
│   │   ├── exams
│   │   │   └── page.jsx
│   │   ├── layout.jsx
│   │   ├── login
│   │   │   └── page.jsx
│   │   ├── notices
│   │   │   └── page.jsx
│   │   ├── page.jsx
│   │   ├── password-reset-requests
│   │   │   └── page.jsx
│   │   ├── results
│   │   │   └── page.jsx
│   │   ├── schedule
│   │   │   └── page.jsx
│   │   ├── settings
│   │   │   └── page.jsx
│   │   ├── students
│   │   │   └── page.jsx
│   │   ├── teachers
│   │   │   └── page.jsx
│   │   └── testimonials
│   │       └── page.jsx
│   ├── admission
│   │   └── page.jsx
│   ├── api
│   │   └── admission
│   │       └── route.js
│   ├── events
│   │   ├── [slug]
│   │   │   └── page.jsx
│   │   ├── faculty
│   │   └── page.jsx
│   ├── faculty
│   │   ├── loading.jsx
│   │   └── page.jsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.jsx
│   ├── login
│   │   └── page.jsx
│   ├── not-found.jsx
│   ├── notices
│   │   └── page.jsx
│   ├── page.jsx
│   ├── student
│   │   ├── attendance
│   │   │   └── page.jsx
│   │   ├── dashboard
│   │   │   └── page.jsx
│   │   ├── layout.jsx
│   │   ├── profile
│   │   │   └── page.jsx
│   │   ├── results
│   │   │   └── page.jsx
│   │   └── schedule
│   │       └── page.jsx
│   ├── superadmin
│   │   ├── attendance
│   │   │   └── page.jsx
│   │   ├── classes
│   │   │   └── page.jsx
│   │   ├── dashboard
│   │   │   └── page.jsx
│   │   ├── events
│   │   │   └── page.jsx
│   │   ├── exams
│   │   │   └── page.jsx
│   │   ├── layout.jsx
│   │   ├── login
│   │   │   └── page.jsx
│   │   ├── notices
│   │   │   └── page.jsx
│   │   ├── page.jsx
│   │   ├── password-reset-requests
│   │   │   └── page.jsx
│   │   ├── results
│   │   │   └── page.jsx
│   │   ├── schedule
│   │   │   └── page.jsx
│   │   ├── settings
│   │   │   └── page.jsx
│   │   ├── students
│   │   │   └── page.jsx
│   │   ├── teachers
│   │   │   └── page.jsx
│   │   ├── testimonials
│   │   │   └── page.jsx
│   │   └── users
│   │       └── page.jsx
│   └── teacher
│       ├── attendance
│       │   └── page.jsx
│       ├── dashboard
│       │   └── page.jsx
│       ├── grades
│       │   └── page.jsx
│       ├── layout.jsx
│       ├── profile
│       │   └── page.jsx
│       ├── schedule
│       │   └── page.jsx
│       └── students
│           └── page.jsx
├── components
│   ├── ClientOnly.jsx
│   ├── DashboardFooter.jsx
│   ├── Footer.jsx
│   ├── Navbar.jsx
│   ├── Preloader.jsx
│   ├── ScrollTop.jsx
│   ├── ThemeToggle.jsx
│   ├── admin
│   │   ├── AttendanceManager.jsx
│   │   ├── ClassesManager.jsx
│   │   ├── DashboardScreen.jsx
│   │   ├── EventsManager.jsx
│   │   ├── ExamsManager.jsx
│   │   ├── NoticesManager.jsx
│   │   ├── PasswordResetRequestsManager.jsx
│   │   ├── ResultsManager.jsx
│   │   ├── ScheduleManager.jsx
│   │   ├── SettingsManager.jsx
│   │   ├── StudentsManager.jsx
│   │   ├── TeachersManager.jsx
│   │   ├── TestimonialsManager.jsx
│   │   └── UserManager.jsx
│   ├── home
│   │   ├── ContactCTA.jsx
│   │   ├── EventsFeed.jsx
│   │   ├── Features.jsx
│   │   ├── Hero.jsx
│   │   ├── HeroSlideShow.jsx
│   │   ├── LeaderShip.jsx
│   │   ├── Notices.jsx
│   │   ├── Stats.jsx
│   │   └── Testimonials.jsx
│   ├── teacher
│   │   └── ExamResultsChart.jsx
│   └── ui
│       ├── Carousel.jsx
│       ├── CheckBox.jsx
│       ├── ConfirmDialog.jsx
│       ├── DataTable.jsx
│       ├── DatePicker.jsx
│       ├── FileUpload.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       ├── Radio.jsx
│       ├── SearchBox.jsx
│       ├── Select.jsx
│       ├── Textarea.jsx
│       ├── TimePicker.jsx
│       └── TipTapEditor.jsx
├── context
│   └── AuthContext.jsx
├── db_backup
│   ├── constraints.sql
│   ├── data.sql
│   ├── policies.sql
│   ├── readme.md
│   └── tables.sql
├── eslint.config.js
├── jsconfig.json
├── lib
│   ├── api
│   │   ├── adminPeople.js
│   │   ├── admission.js
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── classes.js
│   │   ├── client.js
│   │   ├── config.js
│   │   ├── events.js
│   │   ├── exams.js
│   │   ├── notices.js
│   │   ├── public.js
│   │   ├── resetRequests.js
│   │   ├── results.js
│   │   ├── schedule.js
│   │   ├── students.js
│   │   ├── subjects.js
│   │   ├── teachers.js
│   │   ├── testimonials.js
│   │   ├── tokens.js
│   │   └── users.js
│   ├── services
│   │   └── grading.js
│   └── supabase.js
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
│   └── assets
│       └── images
│           ├── icon.svg
│           ├── logo-512.png
│           └── logo.png
├── tailwind.config.js
└── utils
    └── supabase
        ├── client.js
        ├── middleware.js
        └── server.ts
