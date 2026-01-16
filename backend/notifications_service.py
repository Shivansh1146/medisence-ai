"""notifications_service.py

Production-ready, JSON-backed notification system.

Design goals:
- User-scoped notifications with strong validation.
- Idempotent generation (no duplicates) via a stable `dedupe_key`.
- Filter + pagination + summary.

Note: This project uses a JSON-file database (`backend/data/*`). This module
implements a dedicated `notifications.json` store with lightweight indexing
patterns (user_id + is_read + created_at).
"""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional, Tuple

NotificationType = Literal[
    "appointment",
    "medication",
    "health_tip",
    "system",
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _parse_iso(dt_str: str) -> datetime:
    # Accept both naive and aware iso strings
    try:
        d = datetime.fromisoformat(dt_str)
    except Exception:
        return _utcnow()
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _safe_load_json(path: str, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def _atomic_write_json(path: str, data: Any) -> None:
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)


@dataclass
class NotificationRecord:
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    metadata: Dict[str, Any]
    created_at: str
    read_at: Optional[str]
    dedupe_key: str
    deleted_at: Optional[str] = None

    def to_frontend(self) -> Dict[str, Any]:
        # Frontend expects: {id, userId, title, message, type, read, timestamp}
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "read": self.is_read,
            "timestamp": self.created_at,
        }


class NotificationsService:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        _ensure_dir(self.data_dir)

        self.notifications_file = os.path.join(self.data_dir, "notifications.json")
        self._init_store()

    def _init_store(self) -> None:
        if not os.path.exists(self.notifications_file):
            _atomic_write_json(self.notifications_file, [])

    def _load_all(self) -> List[Dict[str, Any]]:
        data = _safe_load_json(self.notifications_file, [])
        if not isinstance(data, list):
            return []
        return data

    def _save_all(self, records: List[Dict[str, Any]]) -> None:
        _atomic_write_json(self.notifications_file, records)

    def _iter_user_records(
        self, user_id: str, include_deleted: bool = False
    ) -> List[Dict[str, Any]]:
        all_records = self._load_all()
        out: List[Dict[str, Any]] = []
        for r in all_records:
            if r.get("user_id") != user_id:
                continue
            if not include_deleted and r.get("deleted_at"):
                continue
            out.append(r)
        return out

    def _make_record(
        self,
        *,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        dedupe_key: str,
    ) -> NotificationRecord:
        now = _utcnow()
        return NotificationRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            is_read=False,
            metadata=metadata or {},
            created_at=_iso(now),
            read_at=None,
            dedupe_key=dedupe_key,
        )

    def _exists_dedupe_key(self, user_id: str, dedupe_key: str) -> bool:
        for r in self._iter_user_records(user_id=user_id, include_deleted=False):
            if r.get("dedupe_key") == dedupe_key:
                return True
        return False

    # -------------------------------
    # Public API
    # -------------------------------
    def fetch(
        self,
        *,
        user_id: str,
        filter_key: str = "all",
        limit: int = 50,
        cursor: Optional[int] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[int]]:
        """Return notifications for a user sorted by created_at DESC.

        cursor is an offset into the sorted list.
        Returns (items, next_cursor).
        """
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100

        records = self._iter_user_records(user_id=user_id, include_deleted=False)

        # Filter
        if filter_key == "unread":
            records = [r for r in records if not bool(r.get("is_read"))]
        elif filter_key == "appointments":
            records = [r for r in records if r.get("type") == "appointment"]
        elif filter_key == "medications":
            records = [r for r in records if r.get("type") == "medication"]
        elif filter_key == "health_tips":
            records = [r for r in records if r.get("type") == "health_tip"]
        elif filter_key == "all":
            pass
        else:
            # Unknown filter -> treat as all
            pass

        records.sort(key=lambda r: _parse_iso(r.get("created_at", "")), reverse=True)

        offset = cursor or 0
        page = records[offset : offset + limit]
        next_cursor = offset + limit if (offset + limit) < len(records) else None

        # Convert to frontend shape
        items: List[Dict[str, Any]] = []
        for r in page:
            nr = NotificationRecord(
                id=r["id"],
                user_id=r["user_id"],
                type=r["type"],
                title=r["title"],
                message=r["message"],
                is_read=bool(r.get("is_read")),
                metadata=r.get("metadata") or {},
                created_at=r["created_at"],
                read_at=r.get("read_at"),
                dedupe_key=r.get("dedupe_key", ""),
                deleted_at=r.get("deleted_at"),
            )
            items.append(nr.to_frontend())

        return items, next_cursor

    def summary(self, *, user_id: str) -> Dict[str, int]:
        records = self._iter_user_records(user_id=user_id, include_deleted=False)
        total = len(records)
        unread = sum(1 for r in records if not bool(r.get("is_read")))
        appointments = sum(1 for r in records if r.get("type") == "appointment")
        medications = sum(1 for r in records if r.get("type") == "medication")
        return {
            "total": total,
            "unread": unread,
            "appointments": appointments,
            "medications": medications,
        }

    def mark_one_read(self, *, user_id: str, notification_id: str) -> bool:
        all_records = self._load_all()
        now = _iso(_utcnow())
        updated = False

        for r in all_records:
            if r.get("id") != notification_id:
                continue
            if r.get("user_id") != user_id:
                # user-scoped: do not allow cross-user access
                return False
            if r.get("deleted_at"):
                return False
            if not bool(r.get("is_read")):
                r["is_read"] = True
                r["read_at"] = now
                updated = True
            else:
                # already read -> idempotent
                updated = True
            break

        if updated:
            self._save_all(all_records)
        return updated

    def mark_all_read(self, *, user_id: str) -> int:
        """Mark all as read for user. Returns how many were changed."""
        all_records = self._load_all()
        now = _iso(_utcnow())
        changed = 0
        for r in all_records:
            if r.get("user_id") != user_id:
                continue
            if r.get("deleted_at"):
                continue
            if not bool(r.get("is_read")):
                r["is_read"] = True
                r["read_at"] = now
                changed += 1
        if changed:
            self._save_all(all_records)
        return changed

    # -------------------------------
    # Generation / refresh
    # -------------------------------
    def refresh(self, *, user_id: str) -> Dict[str, int]:
        """Generate new notifications from data sources.

        Idempotent: uses dedupe_key.
        Returns counts.
        """
        created = 0

        # Appointments
        created += self._generate_appointment_notifications(user_id=user_id)

        # Medications (stored in health_records under medications)
        created += self._generate_medication_notifications(user_id=user_id)

        # Health tips (daily or weekly)
        created += self._generate_health_tip_notifications(user_id=user_id)

        # System alerts placeholder (can be extended)
        created += self._generate_system_notifications(user_id=user_id)

        return {"created": created}

    def _generate_appointment_notifications(self, *, user_id: str) -> int:
        from database import db  # local import to avoid circulars

        now = _utcnow()
        created = 0

        appts = db.get_appointments(user_id)
        for a in appts:
            status = (a.get("status") or "").lower()
            if status in ["cancelled", "canceled"]:
                continue

            # Appointment date/time are stored as strings.
            # Try best-effort parse: date: YYYY-MM-DD, time: e.g. "10:00 AM"
            date_str = a.get("date")
            time_str = a.get("time")
            if not date_str or not time_str:
                continue

            appt_dt = self._parse_appointment_datetime(date_str, time_str)
            if not appt_dt:
                continue

            # Reminders (24h, 1h)
            delta = appt_dt - now

            if (
                timedelta(hours=23, minutes=50)
                <= delta
                <= timedelta(hours=24, minutes=10)
            ):
                dedupe_key = f"apt:{a['id']}:reminder:24h"
                if not self._exists_dedupe_key(user_id, dedupe_key):
                    created += self._insert(
                        self._make_record(
                            user_id=user_id,
                            type="appointment",
                            title="Appointment reminder",
                            message=f"You have an appointment tomorrow at {time_str}.",
                            metadata={
                                "appointment_id": a.get("id"),
                                "deep_link": "#appointments",
                            },
                            dedupe_key=dedupe_key,
                        )
                    )

            if timedelta(minutes=50) <= delta <= timedelta(hours=1, minutes=10):
                dedupe_key = f"apt:{a['id']}:reminder:1h"
                if not self._exists_dedupe_key(user_id, dedupe_key):
                    created += self._insert(
                        self._make_record(
                            user_id=user_id,
                            type="appointment",
                            title="Upcoming appointment",
                            message=f"Your appointment starts in about 1 hour ({time_str}).",
                            metadata={
                                "appointment_id": a.get("id"),
                                "deep_link": "#appointments",
                            },
                            dedupe_key=dedupe_key,
                        )
                    )

            # Missed appointment: after end time by 30 minutes (assume slot length 30m)
            if now >= (appt_dt + timedelta(minutes=30)) and status == "scheduled":
                dedupe_key = f"apt:{a['id']}:missed"
                if not self._exists_dedupe_key(user_id, dedupe_key):
                    created += self._insert(
                        self._make_record(
                            user_id=user_id,
                            type="appointment",
                            title="Appointment missed",
                            message="It looks like you missed an appointment. You can reschedule anytime.",
                            metadata={
                                "appointment_id": a.get("id"),
                                "deep_link": "#appointments",
                            },
                            dedupe_key=dedupe_key,
                        )
                    )

        return created

    def _parse_appointment_datetime(
        self, date_str: str, time_str: str
    ) -> Optional[datetime]:
        # Try parse: YYYY-MM-DD + HH:MM AM/PM
        try:
            base = datetime.strptime(date_str, "%Y-%m-%d")
            t = datetime.strptime(time_str.strip(), "%I:%M %p")
            dt = base.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
            # stored data is local time. treat as UTC for simplicity in demo
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None

    def _generate_medication_notifications(self, *, user_id: str) -> int:
        from database import db  # local import

        now = _utcnow()
        created = 0

        # Expect medications stored as list in health_records[user_id]['medications']
        meds: List[Dict[str, Any]] = db.get_health_records(user_id, "medications")  # type: ignore
        if not isinstance(meds, list):
            return 0

        # Expected (best-effort) fields per medication item:
        # - id (optional)
        # - name
        # - schedule_time ("HH:MM" 24h or "HH:MM AM/PM")
        # - last_taken_at (iso) optional
        # - timezone optional
        #
        # This repo doesn't have a standard yet, so we implement safe heuristics.

        for med in meds:
            name = med.get("name") or med.get("medicine") or med.get("medication")
            if not name:
                continue

            schedule_time = (
                med.get("schedule_time") or med.get("time") or med.get("scheduled_time")
            )
            if not schedule_time:
                continue

            sched_dt = self._today_at(schedule_time)
            if not sched_dt:
                continue

            # Create reminder shortly after scheduled time (0-10m)
            if timedelta(minutes=0) <= (now - sched_dt) <= timedelta(minutes=10):
                key = f"med:{med.get('id', name)}:{sched_dt.date().isoformat()}:due"
                if not self._exists_dedupe_key(user_id, key):
                    created += self._insert(
                        self._make_record(
                            user_id=user_id,
                            type="medication",
                            title="Medication reminder",
                            message=f"Time to take {name}.",
                            metadata={
                                "medication_id": med.get("id"),
                                "deep_link": "#medications",
                            },
                            dedupe_key=key,
                        )
                    )

            # Missed dose after 60m grace period
            if (now - sched_dt) >= timedelta(minutes=60):
                last_taken_at = med.get("last_taken_at")
                if last_taken_at:
                    try:
                        last_taken = _parse_iso(last_taken_at)
                        # If taken after scheduled time, do not mark missed
                        if last_taken >= sched_dt:
                            continue
                    except Exception:
                        pass

                key = f"med:{med.get('id', name)}:{sched_dt.date().isoformat()}:missed"
                if not self._exists_dedupe_key(user_id, key):
                    created += self._insert(
                        self._make_record(
                            user_id=user_id,
                            type="medication",
                            title="Dose missed",
                            message=f"You may have missed a dose of {name}.",
                            metadata={
                                "medication_id": med.get("id"),
                                "deep_link": "#medications",
                            },
                            dedupe_key=key,
                        )
                    )

        return created

    def _today_at(self, time_str: str) -> Optional[datetime]:
        s = time_str.strip()
        now = _utcnow()
        base = now.replace(hour=0, minute=0, second=0, microsecond=0)

        for fmt in ["%H:%M", "%I:%M %p", "%I:%M%p"]:
            try:
                t = datetime.strptime(s, fmt)
                return base.replace(hour=t.hour, minute=t.minute)
            except Exception:
                continue
        return None

    def _generate_health_tip_notifications(self, *, user_id: str) -> int:
        # Daily tip per user (idempotent per day)
        now = _utcnow()
        day_key = now.date().isoformat()
        dedupe_key = f"tip:{day_key}"
        if self._exists_dedupe_key(user_id, dedupe_key):
            return 0

        # Non-intrusive generic tip rotation (still backend-generated, not hardcoded per request).
        # In a real system, this would be from a tips DB. Here we use the existing medical_kb.json
        # as a source of safely varied content.
        tip = self._pick_tip_from_kb(seed=day_key)
        if not tip:
            return 0

        created = self._insert(
            self._make_record(
                user_id=user_id,
                type="health_tip",
                title="Health tip",
                message=tip,
                metadata={"deep_link": "#home"},
                dedupe_key=dedupe_key,
            )
        )
        return created

    def _pick_tip_from_kb(self, seed: str) -> Optional[str]:
        # Try to read medical_kb.json if available and pick a stable "tip"-like string.
        kb_path = "medical_kb.json"
        kb = _safe_load_json(kb_path, {})

        candidates: List[str] = []
        if isinstance(kb, dict):
            # Collect short strings from common fields
            for _, v in kb.items():
                if isinstance(v, str) and 30 <= len(v) <= 140:
                    candidates.append(v)
                elif isinstance(v, list):
                    for item in v:
                        if isinstance(item, str) and 30 <= len(item) <= 140:
                            candidates.append(item)

        if not candidates:
            return None

        # stable pick by seed
        idx = abs(hash(seed)) % len(candidates)
        return candidates[idx]

    def _generate_system_notifications(self, *, user_id: str) -> int:
        # Placeholder for future: currently no system events.
        return 0

    def _insert(self, record: NotificationRecord) -> int:
        all_records = self._load_all()
        all_records.append(
            {
                "id": record.id,
                "user_id": record.user_id,
                "type": record.type,
                "title": record.title,
                "message": record.message,
                "is_read": record.is_read,
                "metadata": record.metadata,
                "created_at": record.created_at,
                "read_at": record.read_at,
                "dedupe_key": record.dedupe_key,
                "deleted_at": record.deleted_at,
            }
        )
        self._save_all(all_records)
        return 1

    # -------------------------------
    # Direct notification creation
    # -------------------------------
    def create_appointment_notification(
        self,
        *,
        user_id: str,
        appointment_id: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Create an immediate appointment notification (e.g., confirmation).

        Returns True if created, False if duplicate (idempotent).
        """
        dedupe_key = f"apt:{appointment_id}:confirmation"
        if self._exists_dedupe_key(user_id, dedupe_key):
            return False

        record = self._make_record(
            user_id=user_id,
            type="appointment",
            title=title,
            message=message,
            metadata=metadata or {},
            dedupe_key=dedupe_key,
        )
        self._insert(record)
        return True

    def create_notification(
        self,
        *,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        dedupe_key: Optional[str] = None,
    ) -> bool:
        """Create a general notification with optional deduplication.

        Returns True if created, False if duplicate.
        """
        if dedupe_key and self._exists_dedupe_key(user_id, dedupe_key):
            return False

        if not dedupe_key:
            dedupe_key = f"manual:{notification_type}:{str(uuid.uuid4())}"

        record = self._make_record(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {},
            dedupe_key=dedupe_key,
        )
        self._insert(record)
        return True
