# Automations

## Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `lead.created` | New lead | leadId, organizationId |
| `lead.stage_changed` | Lead stage update | leadId, from, to |
| `lead.converted` | Lead → Customer | leadId, customerId |
| `appointment.created` | New appointment | appointmentId, customerId, datetime |
| `appointment.completed` | Appointment done | appointmentId, customerId |
| `appointment.cancelled` | Cancelled | appointmentId, customerId |
| `checkin.created` | Check-in submitted | checkinId, customerId, riskScore |
| `checkin.overdue` | No check-in | customerId, daysOverdue |
| `customer.risk_changed` | Risk level changes | customerId, from, to |
| `message.received` | Incoming message | messageId, customerId, channel |
| `call.completed` | Call ended | callId, customerId, duration |
| `conversion.duplicate_attempt` | Duplicate conversion blocked | leadId, email, phone |

## Condition Operators

| Operator | Description |
|----------|-------------|
| `eq` | Equals |
| `ne` | Not equals |
| `gt` | Greater than |
| `gte` | Greater than or equals |
| `lt` | Less than |
| `lte` | Less than or equals |
| `in` | In array |
| `contains` | String contains |

## Actions

| Action | Behaviour |
|--------|-----------|
| `CREATE_TASK` | Creates `Task` record, assigned to specified user |
| `CREATE_ALERT` | Creates `Alert` record |
| `CREATE_NOTIFICATION` | In-app notification |
| `CHANGE_STAGE` | Updates lead/customer stage |
| `ADD_TAG` | Adds tag to customer metadata |
| `SCHEDULE_CHECKIN` | Creates future `CheckIn` |
| `UPDATE_LAST_INTERACTION` | Updates customer's lastInteractionAt |
| `CALL_WEBHOOK` | HTTP POST to configured URL (fire-and-forget) |

## Examples

### Alert on high risk
```json
{
  "triggerType": "checkin.created",
  "conditions": [
    { "field": "riskScore", "operator": "gte", "value": 8 }
  ],
  "actions": [
    { "type": "CREATE_ALERT", "params": { "severity": "HIGH" } }
  ]
}
```

### Auto-advance stage on qualification
```json
{
  "triggerType": "lead.stage_changed",
  "conditions": [
    { "field": "to", "operator": "eq", "value": "QUALIFIED" }
  ],
  "actions": [
    { "type": "CHANGE_STAGE", "params": { "stage": "PROPOSAL" } },
    { "type": "CREATE_TASK", "params": { "title": "Prepare proposal" } }
  ]
}
```
