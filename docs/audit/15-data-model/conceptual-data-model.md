# Conceptual Data Model Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 46 of 51  

---

## 1. Domain Object Hierarchy

```
               [TAXONOMY: CATEGORY -> TOPIC -> SUBTOPIC]
                                  |
                                  v
                        [CONTENT MASTER] (Aggregate Root: BP-CNT)
                          /                                   /                                    v              v
    [PRIMARY QUESTION] (BP-Q)      [VIDEO PRODUCTION] (BP-V)
           |                              |
           v                              +---> [SCRIPT] (BP-S)
    [DRAFT QUESTION] (BP-DFT)             |
                                          +---> [MEDIA ASSET] (Drive Cut)
                                          |
                                          +---> [THUMBNAIL] (BP-T)
                                          |
                                          +---> [PINNED COMMENT] (BP-PIN)
                                          |
                                          v
                              [SOCIAL REVIEW PACKAGE] (BP-REV)
                                          |
                                          v
                              [PUBLISHING RECORD] (PUB)
                             /         |                                     v          v          v
                       [YouTube]  [Instagram]  [Facebook]
                                      |          /
                             +---------+---------+
                                       |
                                       v
                             [SOCIAL ANALYTICS] (BP-ANL)
                                       |
                                       v
                         [PERFORMANCE INTELLIGENCE] (BP-SPI)
                                       |
                                       +---> [STAGE 01 LOOPBACK]
```
