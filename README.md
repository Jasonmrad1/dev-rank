# DevRank API

A backend REST API platform where developers build verifiable public profiles 
through peer-reviewed projects — designed for hiring teams to assess real coding ability.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- SQLite + Sequelize

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` with `MONGO_URI` and `PORT`
4. Run `npm run dev`

---

```mermaid
%% Initialize Mermaid for transparent edge labels
%% GitHub supports this
%% All arrow labels will have no background
%%{ init: { "flowchart": { "edgelabelbackground": "none", "curve": "linear" } } }%%

flowchart TB
 subgraph API["API Routes Layer"]
        UR["UserRoutes"]
        PR["ProjectRoutes"]
        RR["ReviewRoutes"]
        SR["SkillRoutes"]
        CR["CertificationRoutes"]
        BR["BadgeRoutes"]
        AR["ActivityLogRoutes"]
 end
 subgraph Controllers["Controllers Layer"]
        UC["UserController"]
        PC["ProjectController"]
        RC["ReviewController"]
        SC["SkillController"]
        CC["CertificationController"]
        BC["BadgeController"]
        AC["ActivityLogController"]
 end
 subgraph Services["Services Layer<br>Business Logic"]
        US["UserService"]
        PS["ProjectService"]
        RS["ReviewService"]
        SS["SkillService"]
        CS["CertificationService"]
        BS["BadgeService"]
        AS["ActivityLogService"]
 end
 subgraph MongoModels["MongoDB Models"]
        UM["User"]
        PM["Project"]
        RM["Review"]
        SM["Skill"]
        CM["CertificationRequest"]
        BM["Badge"]
 end
 subgraph SQLiteModels["SQLite Models"]
        AM["ActivityLog"]
 end
 subgraph Models["Models Layer"]
        MongoModels
        SQLiteModels
 end
 subgraph Databases["Database Layer"]
        MongoDB["MongoDB<br>Main Data Store"]
        SQLite["SQLite<br>Activity Logs"]
 end
 subgraph Middleware["Middleware & Utilities"]
        AH["AsyncHandler"]
        Val["Validators<br>User, Badge, Cert,<br>Project, Review, Skill"]
        Err["AppError<br>Error Handler"]
        EC["ErrorCodes"]
 end
 subgraph Loggers["Loggers"]
        UL["UserLogger"]
        PL["ProjectLogger"]
        RL["ReviewLogger"]
        SL["SkillLogger"]
        CL["CertificationLogger"]
        BL["BadgeLogger"]
 end
 subgraph Events["Event-Driven Architecture"]
        EB["Event Bus<br>EventEmitter"]
        Loggers
        EL["registerEventListeners"]
 end
 subgraph Config["Configuration"]
        MC["MongoDBConfig"]
        SC_C["SQLiteConfig"]
        EV["Environment<br>Variables"]
 end

    %% Connections
    API --> Controllers
    Controllers --> Services
    Services --> Models
    Models --> MongoDB
    AM --> SQLite
    MongoDB --> MC
    SQLite --> SC_C
    MC --> EV
    SC_C --> EV
    Controllers -- Use --> Middleware
    Err -- Uses --> EC
    Services -. Emit .-> EB
    EB -. Trigger .-> UL
    Loggers -. Log .-> Services
    EL -. Register .-> Loggers