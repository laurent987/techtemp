# 📁 TechTemp Internal Documentation

> **Internal project documentation** - Development journals, legacy docs, meeting notes, and project history.

---

## 📋 **What's Here**

This directory contains documentation for **internal project management** and **historical reference**:

### **🗂️ Directory Structure**

```
INTERNAL/
├── 📖 README.md                    # This file
├── 
├── 📚 archive/                     # Development journals & progress tracking
│   └── journaux/                   # French development journals
│       ├── journal#008_*.md        # MVP Lot 1 development
│       ├── journal#009_*.md        # System consolidation
│       ├── journal#010_*.md        # Web interface development
│       └── journal#011_*.md        # API documentation alignment
│
├── 📁 legacy/                      # Legacy documentation (pre-restructure)
│   ├── ARCHITECTURE.md             # Original architecture doc
│   ├── CONTRIBUTING.md             # Original contributing guide
│   ├── DOCUMENTATION_PLAN.md       # Documentation planning
│   ├── INDEX.md                    # Original documentation index
│   ├── MONITORING_EXPLICATION.md   # Monitoring implementation notes
│   ├── PHASE3_CHECKLIST.md         # Development phase tracking
│   ├── RASPBERRY_PI_SETUP.md       # Original Pi setup guide
│   ├── rapport-migration-schema.md # Database migration report
│   ├── roadmap-journals.md         # Roadmap planning notes
│   └── roadmap.md                  # Original project roadmap
│
└── 🏗️ decisions/                   # Architecture Decision Records (ADRs)
    ├── 001-database-choice.md       # SQLite vs PostgreSQL decision
    ├── 002-api-versioning.md        # API versioning strategy
    └── 003-documentation-structure.md # Documentation restructure decision
```

---

## 📝 **Development Journals**

The `archive/journaux/` directory contains **chronological development logs** in French documenting:

- **MVP development phases** - Feature implementation tracking
- **Technical decisions** - Architecture and design choices  
- **Problem resolution** - Issues encountered and solutions
- **Deployment experiences** - Production deployment learnings
- **Testing outcomes** - Validation and acceptance criteria

### **Recent Journal Entries**

| Journal | Date | Topic | Status |
|---------|------|-------|--------|
| [#011](archive/journaux/journal#011_2025-09-12.md) | 2025-09-12 | API Documentation Alignment | ✅ Completed |
| [#010](archive/journaux/journal#010_2025-09-12.md) | 2025-09-12 | Web Dashboard Interface | ✅ Completed |
| [#009](archive/journaux/journal#009_*.md) | 2025-09-11 | MVP Lot 1 Consolidation | ✅ Completed |
| [#008](archive/journaux/journal#008_*.md) | 2025-09-11 | Initial MVP Development | ✅ Completed |

---

## 🏗️ **Architecture Decision Records (ADRs)**

ADRs document **important architectural decisions** with context and rationale:

### **ADR Template**
```markdown
# ADR-XXX: Decision Title

**Status:** Accepted | Deprecated | Superseded  
**Date:** 2025-MM-DD  
**Deciders:** [Names]

## Context
What situation led to this decision?

## Decision  
What we decided to do.

## Consequences
- **Positive:** Benefits of this approach
- **Negative:** Costs or risks
- **Neutral:** Other implications
```

### **Current ADRs**

1. **[ADR-001: Database Choice](decisions/001-database-choice.md)** - Why SQLite over PostgreSQL
2. **[ADR-002: API Versioning](decisions/002-api-versioning.md)** - URL-based versioning strategy
3. **[ADR-003: Documentation Structure](decisions/003-documentation-structure.md)** - Audience-based organization

---

## 📚 **Legacy Documentation**

The `legacy/` directory contains **original documentation** before the audience-based restructure:

### **What's Preserved**
- **Original architecture documentation** - Technical system design
- **Development setup guides** - Historical setup procedures
- **Project planning documents** - Roadmaps and phase tracking
- **Implementation reports** - Database migrations, monitoring setup

### **Migration Status**

| Legacy Document | New Location | Status |
|----------------|--------------|--------|
| ARCHITECTURE.md | [CONTRIBUTOR/architecture.md](../CONTRIBUTOR/architecture.md) | 🚧 Being migrated |
| CONTRIBUTING.md | [CONTRIBUTOR/README.md](../CONTRIBUTOR/README.md) | ✅ Migrated |
| SETUP.md | [CONTRIBUTOR/setup.md](../CONTRIBUTOR/setup.md) | ✅ Migrated |
| API docs | [DEVELOPER/README.md](../DEVELOPER/README.md) | ✅ Migrated |
| Device guides | [USER/README.md](../USER/README.md) | 🚧 Being migrated |

---

## 🎯 **How to Use This Documentation**

### **For Current Team Members**
- **Check recent journals** for latest development context
- **Review ADRs** before making architectural changes
- **Reference legacy docs** when maintaining old features

### **For New Contributors**
- **Start with public docs** ([CONTRIBUTOR/README.md](../CONTRIBUTOR/README.md))
- **Refer to journals** for implementation details and lessons learned
- **Check ADRs** to understand why decisions were made

### **For Project Archaeology**
- **Journals provide timeline** of feature development
- **Legacy docs show evolution** of project structure
- **ADRs explain rationale** for current architecture

---

## 📋 **Internal Documentation Standards**

### **Journal Entry Format**
```markdown
# Journal #XXX - Topic Title
**Date**: YYYY-MM-DD  
**Author**: Name  
**Context**: Project phase or feature

## 🎯 Objective
What we're trying to accomplish

## ✅ Scope (Done/To Do)
- [x] Completed items
- [ ] Pending items

## 🔗 Useful Links
- Related documents
- GitHub issues/PRs

## 📋 Implementation Plan
Step-by-step approach

## ✅ Acceptance Criteria  
How we know it's done

## 🎉 Final Result
Summary of outcome
```

### **ADR Guidelines**
- **One decision per ADR** - Keep focused
- **Include alternatives** - What else was considered
- **Update status** - Mark as superseded when replaced
- **Link related ADRs** - Show decision evolution

---

## 🔍 **Finding Information**

### **By Topic**
- **API changes** → Journals #010, #011
- **Database design** → ADR-001, legacy/rapport-migration-schema.md
- **Deployment** → Journals #008-#011, legacy/RASPBERRY_PI_SETUP.md
- **Architecture** → ADRs, legacy/ARCHITECTURE.md

### **By Date**
- **2025-09-12** → API fixes and documentation restructure
- **2025-09-11** → Web interface development
- **Earlier** → Legacy documentation and initial development

### **By Author**
Most recent documentation by Laurent - see individual journal headers for specific authorship.

---

## 🚀 **Maintenance**

### **Regular Tasks**
- **Create journal entries** for significant development work
- **Update ADRs** when architectural decisions change
- **Archive completed projects** to legacy when superseded

### **Cleanup Schedule**
- **Quarterly review** - Consolidate old journals
- **Annual archive** - Move very old materials to deep archive
- **Version control** - Ensure important decisions are preserved

---

**📝 Note:** This internal documentation complements the public documentation structure and should not be exposed to end users. It serves as the project's "memory" and decision trail.
