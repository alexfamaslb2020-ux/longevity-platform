# Data Model

## Core Entities

```
Organization (1) ──▶ (N) User
     │
     ├── (N) Lead ──▶ Customer (upon conversion)
     ├── (N) Appointment
     ├── (N) CheckIn
     ├── (N) Activity
     ├── (N) Workflow / WorkflowExecution
     └── (N) AuditLog
```

## Key Schema (Prisma)

### Organization
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | |
| settings | JSON | Configurable options |
| createdAt | DateTime | |

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organizationId | UUID | FK → Organization |
| email | String | Unique per org |
| role | Enum | ADMIN, MANAGER, SALES, PROFESSIONAL, SUPPORT, CLIENT |
| passwordHash | String | bcrypt |

### Lead
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organizationId | UUID | FK |
| name | String | |
| email | String? | |
| phone | String? | |
| status | Enum | NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST |
| assignedToId | UUID? | FK → User |
| convertedAt | DateTime? | Set on conversion |
| customerId | UUID? | FK → Customer |

### Customer
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organizationId | UUID | FK |
| leadId | UUID? | FK → Lead (original lead) |
| name | String | |
| email | String? | |
| phone | String? | |
| status | Enum | ACTIVE, INACTIVE, VIP, AT_RISK, CHURNED |

### CheckIn
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organizationId | UUID | FK |
| customerId | UUID | FK → Customer |
| scheduledDate | DateTime | |
| completedDate | DateTime? | |
| responses | JSON | Survey answers |
| riskScore | Float? | Computed on submit |
| riskLevel | RiskLevel? | NORMAL / ATTENTION / HIGH / CRITICAL |
| requiresHumanReview | Boolean | |

### Workflow
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | |
| triggerType | String | e.g. `lead.created` |
| conditions | JSON | Array of condition objects |
| actions | JSON | Array of action objects |
| active | Boolean | |
| createdAt | DateTime | |

### AuditLog
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organizationId | UUID | FK |
| userId | UUID | FK |
| action | String | e.g. `LEAD_CONVERTED` |
| entityType | String | `LEAD`, `CUSTOMER`, etc. |
| entityId | UUID | |
| metadata | JSON | Extra context |

## Full schema

See `apps/api/prisma/schema.prisma` for the complete Prisma schema.
